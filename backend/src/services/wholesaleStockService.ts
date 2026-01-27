import { collections, db } from '../config/firebase';
import { WholesaleProduct, WholesaleBundleItem } from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';

/**
 * Wholesale Stock Management Service
 * Uses Firestore transactions for atomic stock operations
 * Prevents race conditions and overselling
 */

/**
 * Deduct stock using Firestore transaction
 * CRITICAL: Atomic operation to prevent overselling
 * Also handles product price locking after first paid order
 */
export const deductBundleStock = async (
    orderId: string,
    items: WholesaleBundleItem[]
): Promise<void> => {
    try {
        await db.runTransaction(async (transaction) => {
            // 1. Idempotency check
            const orderRef = collections.orders.doc(orderId);
            const orderDoc = await transaction.get(orderRef);

            if (orderDoc.data()?.stockDeducted) {
                console.log(`✓ Stock already deducted for order: ${orderId}`);
                return; // Safe exit
            }

            // 2. Validate and calculate stock changes
            const stockUpdates: { productId: string; newStock: number }[] = [];

            for (const item of items) {
                const productRef = collections.products.doc(item.productId);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists) {
                    throw new AppError(`Product not found: ${item.productId}`, 404);
                }

                const product = productDoc.data() as WholesaleProduct;
                const newStock = product.availableBundles - item.bundlesOrdered;

                if (newStock < 0) {
                    throw new AppError(
                        `Insufficient stock for ${product.title}. Available: ${product.availableBundles} bundles`,
                        400
                    );
                }

                stockUpdates.push({ productId: item.productId, newStock });
            }

            // 3. Apply stock updates atomically
            for (const update of stockUpdates) {
                const productRef = collections.products.doc(update.productId);
                const productDoc = await transaction.get(productRef);
                const product = productDoc.data() as WholesaleProduct;

                transaction.update(productRef, {
                    availableBundles: update.newStock,
                    inStock: update.newStock > 0,
                    totalPieces: update.newStock * product.bundleQty,
                    updatedAt: new Date(),
                    // CRITICAL: Lock price after first PAID order
                    // This code only runs inside deductBundleStock(), which is called
                    // AFTER payment verification succeeds. Failed payments never reach here.
                    ...(product.isLocked ? {} : {
                        isLocked: true,
                        lockedAt: new Date(),
                        firstOrderId: orderId,
                    }),
                });
            }

            // 4. Mark order as deducted
            transaction.update(orderRef, {
                stockDeducted: true,
                updatedAt: new Date(),
            });
        });

        console.log(`✅ Stock deducted successfully for order: ${orderId}`);
    } catch (error) {
        console.error('❌ Stock deduction failed:', error);
        throw error;
    }
};

/**
 * Restore stock on order cancellation
 * Uses transaction to ensure atomicity
 */
export const restoreBundleStock = async (orderId: string): Promise<void> => {
    const order = await collections.orders.doc(orderId).get();

    if (!order.exists || !order.data()?.stockDeducted) {
        return; // Nothing to restore
    }

    await db.runTransaction(async (transaction) => {
        for (const item of order.data()!.items) {
            const productRef = collections.products.doc(item.productId);
            const productDoc = await transaction.get(productRef);

            if (productDoc.exists) {
                const product = productDoc.data() as WholesaleProduct;
                const newStock = product.availableBundles + item.bundlesOrdered;

                transaction.update(productRef, {
                    availableBundles: newStock,
                    totalPieces: newStock * product.bundleQty,
                    inStock: true,
                    updatedAt: new Date(),
                });
            }
        }

        transaction.update(collections.orders.doc(orderId), {
            stockDeducted: false,
            updatedAt: new Date(),
        });
    });

    console.log(`✅ Stock restored for cancelled order: ${orderId}`);
};
