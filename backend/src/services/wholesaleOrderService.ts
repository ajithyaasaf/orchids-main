import { WholesaleBundleItem, WholesaleOrder, Address } from '@orchids/shared';
import * as admin from 'firebase-admin';
import { collections, db } from '../config/firebase';
import { calculateOrderTotal } from './wholesalePricingService';
import { logisticsService } from './logisticsService';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * Wholesale Order Service
 * All business logic for order creation and management.
 * Follows Zero-Trust principle: all prices are recalculated server-side.
 */

// How much the price can differ (in %) between what user expected vs DB value
// before we reject the order. Set to 0 for strict mode.
const PRICE_TOLERANCE_PERCENT = 0;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CreateOrderInput {
    userId: string;
    address: Address;
    /** Items from cart — only IDs and quantities are trusted */
    cartItems: Array<{
        productId: string;
        bundlesOrdered: number;
    }>;
    /**
     * The totalAmount the client *expects* to pay. We validate this
     * against our server-calculated value to detect stale-price scenarios.
     */
    expectedTotalAmount?: number;
    /** 
     * Idempotency key to prevent double-orders on retry 
     */
    idempotencyKey: string;
}

export interface CreateOrderResult {
    orderId: string;
    order: WholesaleOrder & { id: string };
}

// ─────────────────────────────────────────────
// Idempotency Guard
// ─────────────────────────────────────────────

/**
 * Check if an order with this idempotency key was already created.
 * Prevents double-orders from network retries or double-clicks.
 */
async function findExistingOrder(
    userId: string,
    idempotencyKey: string
): Promise<(WholesaleOrder & { id: string }) | null> {
    const snapshot = await collections.wholesaleOrders
        .where('userId', '==', userId)
        .where('idempotencyKey', '==', idempotencyKey)
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data() as WholesaleOrder;
    // Explicitly exclude any 'id' from data to avoid duplicate key
    const { id: _ignored, ...rest } = data as any;
    return { ...(rest as WholesaleOrder), id: doc.id };
}

// ─────────────────────────────────────────────
// Core Order Creation
// ─────────────────────────────────────────────

/**
 * Create a wholesale order with full server-side validation.
 *
 * Security Guarantees:
 *  1. Prices are fetched from DB — the client cannot fake them.
 *  2. Stock is reserved inside a Firestore Transaction (atomic, prevents race conditions).
 *  3. The idempotency key ensures network retries don't create duplicate orders.
 *  4. Address is re-validated on the backend before order is saved.
 *
 * @throws {AppError} with descriptive codes for each failure mode
 */
export async function createWholesaleOrder(
    input: CreateOrderInput
): Promise<CreateOrderResult> {
    const { userId, address, cartItems, expectedTotalAmount, idempotencyKey } = input;
    
    // Internal bypass flag (Only enabled if EXPLICITLY set in env)
    const isTestMode = process.env.ALLOW_TEST_PAYMENTS === 'true' && process.env.NODE_ENV !== 'production';

    // ── 1. Idempotency Check ──────────────────────────────────────────────
    const existingOrder = await findExistingOrder(userId, idempotencyKey);
    if (existingOrder) {
        logger.info(`[OrderService] Duplicate request for idempotency key ${idempotencyKey}. Returning existing order ${existingOrder.id}.`);
        return { orderId: existingOrder.id, order: existingOrder };
    }

    // ── 2. Validate Request Shape ─────────────────────────────────────────
    if (!cartItems || cartItems.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // ── 3. Validate Delivery Address ──────────────────────────────────────
    const addressValidation = logisticsService.validateAddress(address);
    if (!addressValidation.valid) {
        throw new AppError(`Invalid address: ${addressValidation.message}`, 400);
    }

    // ── 4. Atomic Transaction: Verify Stock & Reserve ─────────────────────
    // This is the critical section. Using a Firestore Transaction ensures that:
    //   a) We read the LATEST stock values (not a stale cache)
    //   b) Stock decrement and order creation are a single atomic operation
    //   c) If two users buy the last bundle simultaneously, only one succeeds

    const productRefs = cartItems.map((item) =>
        collections.wholesaleProducts.doc(item.productId)
    );
    const userRef = collections.users.doc(userId);

    let serverCalculatedItems: WholesaleBundleItem[] = [];
    let orderId: string;

    await db.runTransaction(async (tx) => {
        // Read all product docs atomically + user doc
        const productSnapshots = await tx.getAll(...productRefs);
        const userDoc = await tx.get(userRef);

        // Build verified line items using server-side prices
        serverCalculatedItems = [];
        const stockUpdates: Array<{ ref: admin.firestore.DocumentReference; newStock: number; newReserved: number; newTotal: number }> = [];

        for (let i = 0; i < cartItems.length; i++) {
            const cartItem = cartItems[i];
            const snap = productSnapshots[i];

            if (!snap.exists) {
                throw new AppError(`Product ${cartItem.productId} not found`, 404);
            }

            const product = snap.data() as any; // WholesaleProduct

            // Stock validation
            if (!product.inStock || product.availableBundles < cartItem.bundlesOrdered) {
                throw new AppError(
                    `"${product.title}" is low on stock. Only ${product.availableBundles} bundle(s) available.`,
                    409 // 409 Conflict — stock issue
                );
            }

            if (cartItem.bundlesOrdered <= 0) {
                throw new AppError(`Invalid quantity for product "${product.title}"`, 400);
            }

            // ── Server-side price calculation (Zero Trust) ──
            const lineTotal = product.bundlePrice * cartItem.bundlesOrdered;

            serverCalculatedItems.push({
                productId: product.id || snap.id,
                productTitle: product.title,
                productImage: product.images?.[0] ?? '',
                bundleQty: product.bundleQty,
                bundleComposition: product.bundleComposition,
                bundlesOrdered: cartItem.bundlesOrdered,
                pricePerBundle: product.bundlePrice, // Price locked at time of order
                lineTotal,
            });

            // Prepare stock decrement
            const newStock = product.availableBundles - cartItem.bundlesOrdered;
            const newReserved = (product.reservedBundles || 0) + cartItem.bundlesOrdered;
            const newTotal = newStock * product.bundleQty;
            stockUpdates.push({
                ref: snap.ref,
                newStock,
                newReserved,
                newTotal,
            });
        }

        // ── 5. Server-Side Total Calculation (Zero Trust) ──────────────────
        const totals = await calculateOrderTotal(serverCalculatedItems);

        // ── 6. Price Integrity Check ────────────────────────────────────────
        // Warn if the client expected a different price (e.g., price changed mid-session)
        if (expectedTotalAmount !== undefined && PRICE_TOLERANCE_PERCENT === 0) {
            if (Math.abs(totals.totalAmount - expectedTotalAmount) > 0.01) {
                throw new AppError(
                    `Price has changed. Expected ₹${expectedTotalAmount}, new total is ₹${totals.totalAmount.toFixed(2)}. Please review your order and try again.`,
                    409
                );
            }
        }

        // ── 7. Create Order Document ────────────────────────────────────────
        const orderRef = collections.wholesaleOrders.doc();
        orderId = orderRef.id;

        const newOrder: Omit<WholesaleOrder, 'id'> & { idempotencyKey: string; shipping: number } = {
            items: serverCalculatedItems,
            subtotal: totals.subtotal,
            gstRate: totals.gstRate,
            gst: totals.gst,
            shipping: totals.shipping,
            adminDiscount: 0,
            totalAmount: totals.totalAmount,
            adminDiscountHistory: [],

            // Payment & Status handling
            paymentStatus: isTestMode ? 'paid' : 'pending',
            gatewayOrderId: isTestMode ? 'test_bypass' : '',
            gatewayPaymentId: isTestMode ? `test_payment_${Date.now()}` : '',

            // Order lifecycle
            orderStatus: isTestMode ? 'processing' : 'placed',
            statusHistory: [
                {
                    status: 'placed',
                    changedBy: userId,
                    changedAt: new Date(),
                    notes: 'Order placed by customer',
                },
                ...(isTestMode ? [{
                    status: 'processing',
                    changedBy: userId,
                    changedAt: new Date(),
                    notes: 'System: Test mode auto-confirm',
                }] : [])
            ],

            // Metadata
            userId,
            address,
            stockDeducted: false, // Wait for payment success to finalize
            stockReserved: true, // We are reserving it inside this transaction
            idempotencyKey,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        tx.set(orderRef, newOrder);

        // ── 7.5. Auto-Save Address to User Profile ──────────────────────────────
        if (userDoc.exists) {
            const userData = userDoc.data() as any;
            const existingAddresses: any[] = userData.addresses || [];

            const normalize = (str?: string) => (str || '').toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '').trim();
            const normName = normalize(address.name);
            const normPhone = normalize(address.phone);
            const normLine1 = normalize(address.addressLine1);
            const normPincode = normalize(address.pincode);

            // Exact Match requires Name + Phone + House + Pincode
            const matchedIndex = existingAddresses.findIndex(a => 
                normalize(a.name) === normName &&
                normalize(a.phone) === normPhone &&
                normalize(a.addressLine1) === normLine1 &&
                normalize(a.pincode) === normPincode
            );

            let updatedAddresses = [...existingAddresses];
            let shouldUpdateUser = false;

            if (matchedIndex === -1) {
                // 1. It is a completely new identity or location. Create New.
                const isDefault = existingAddresses.length === 0;

                const newSavedAddress = {
                    ...address,
                    id: admin.firestore().collection('_tmp_').doc().id, // Quick ID generator
                    label: isDefault ? 'Default' : 'Checkout',
                    isDefault,
                    createdAt: new Date().toISOString(),
                    lastUsedAt: new Date().toISOString()
                };

                updatedAddresses.unshift(newSavedAddress); // Prepend so it's top of list

                // Enforce Max-10 LRU limit
                if (updatedAddresses.length > 10) {
                    const nonDefaults = updatedAddresses.filter(a => !a.isDefault);
                    if (nonDefaults.length > 0) {
                        nonDefaults.sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
                        const oldestId = nonDefaults[nonDefaults.length - 1].id;
                        updatedAddresses = updatedAddresses.filter(a => a.id !== oldestId);
                    }
                }
                shouldUpdateUser = true;

            } else {
                // 2. Exact match found. Just bump the 'lastUsedAt' timestamp.
                updatedAddresses[matchedIndex].lastUsedAt = new Date().toISOString();
                shouldUpdateUser = true;
            }

            if (shouldUpdateUser) {
                tx.update(userRef, {
                    addresses: updatedAddresses,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        // ── 8. Decrement Stock Atomically ────────────────────────────────────
        for (const { ref, newStock, newReserved, newTotal } of stockUpdates) {
            tx.update(ref, {
                availableBundles: newStock,
                reservedBundles: newReserved,
                totalPieces: newTotal,
                inStock: newStock > 0,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    });

    // ── 9. Post-Creation Logic ─────────────────────────────────────────────
    if (isTestMode) {
        try {
            const { generateInvoice, needsInvoiceGeneration } = await import('./invoiceService');
            const createdOrder = await getWholesaleOrderById(orderId!);
            if (createdOrder && needsInvoiceGeneration(createdOrder as any)) {
                await generateInvoice(orderId!);
                logger.info(`[OrderService] Test Mode: Auto-generated invoice for order ${orderId!}`);
            }
        } catch (err) {
            logger.error(`[OrderService] Test Mode: Failed to generate invoice`, err);
        }
    }

    logger.info(`[OrderService] Created order ${orderId!} for user ${userId}`);

    const created = await getWholesaleOrderById(orderId!);
    return { orderId: orderId!, order: created! };
}

// ─────────────────────────────────────────────
// Read / Update Helpers (Refactored for Atomicity)
// ─────────────────────────────────────────────

/** Fetch a wholesale order by ID */
export async function getWholesaleOrderById(
    orderId: string,
    transaction?: admin.firestore.Transaction
): Promise<(WholesaleOrder & { id: string }) | null> {
    const orderRef = collections.wholesaleOrders.doc(orderId);
    const doc = transaction ? await transaction.get(orderRef) : await orderRef.get();
    
    if (!doc.exists) return null;
    const data = doc.data() as WholesaleOrder;
    return { ...data, id: doc.id };
}

/** 
 * Update wholesale order payment status.
 * Handles product price locking atomically on success.
 * Called from Razorpay webhook or inline verification.
 */
export async function updateWholesalePaymentStatus(
    orderId: string,
    status: 'paid' | 'failed',
    paymentId?: string
): Promise<WholesaleOrder & { id: string }> {
    try {
        const orderRef = collections.wholesaleOrders.doc(orderId);
        
        await db.runTransaction(async (transaction) => {
            const order = await getWholesaleOrderById(orderId, transaction);
            if (!order) throw new AppError('Order not found', 404);

            // Skip if state is already terminal to ensure idempotency
            if (order.paymentStatus === status) {
                logger.info(`Idempotency: Order ${orderId} already marked as ${status}. Skipping update.`);
                return;
            }

            const updateData: any = {
                paymentStatus: status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (paymentId) updateData.gatewayPaymentId = paymentId;

            if (status === 'paid' && order.stockReserved) {
                updateData.stockDeducted = true;
                updateData.stockReserved = false;
                
                // Clear reservation on products
                for (const item of order.items) {
                    const productRef = collections.wholesaleProducts.doc(item.productId);
                    transaction.update(productRef, {
                        reservedBundles: admin.firestore.FieldValue.increment(-item.bundlesOrdered),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            transaction.update(orderRef, updateData);

            // If payment succeeded, lock the product prices (async call after transaction commits, or here)
            // Best practice: Lock prices only after payment is confirmed.
            if (status === 'paid') {
                const { lockProductPrices } = await import('./wholesaleStockService');
                // We call this inside the transaction or immediately after.
                // Since firestore doesn't support recursive transactions, we run locking as a separate process
                // triggered by successful payment verification.
                await lockProductPrices(orderId, order.items);
            }
        });

        const updated = await getWholesaleOrderById(orderId);
        if (!updated) throw new AppError('Order not found after update', 404);
        return updated;
    } catch (error) {
        logger.error(`Failed to update payment status for order ${orderId}:`, error);
        throw error;
    }
}
