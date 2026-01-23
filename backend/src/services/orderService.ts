import { collections } from '../config/firebase'; // Assume 'db' is available via 'collections' setup
import { Order, OrderStatus, PaymentStatus } from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';
// 💡 REQUIRED IMPORT: We need the product service to check stock and update it
import { getProductById, updateStock } from './productService';
// CRITICAL: Customer and analytics cache updates for data integrity
import { updateCustomerCacheOnOrder, updateCustomerCacheOnCancellation } from './customerAnalyticsService';
import { updateAnalyticsCache } from './dashboardService';

/**
 * Create new order with STOCK VALIDATION
 */
export const createOrder = async (
    orderData: Omit<Order, 'id' | 'createdAt'>
): Promise<Order> => {
    try {
        // 1. VALIDATE STOCK FOR ALL ITEMS (Preventing overselling)
        for (const item of orderData.items) {
            // Get product details for real-time stock check
            const product = await getProductById(item.productId);

            if (!product) {
                throw new AppError(`Product not found: ${item.productTitle}`, 400);
            }

            const availableStock = product.stockBySize[item.size] || 0;

            if (availableStock < item.quantity) {
                throw new AppError(
                    `Insufficient stock for ${product.title} (Size: ${item.size}). Available: ${availableStock}`,
                    400
                );
            }
        }

        // 2. CREATE ORDER (Only proceeds if stock is OK)
        const newOrder = {
            ...orderData,
            createdAt: new Date(),
            updatedAt: new Date(),
            // CRITICAL: Order is placed but payment is pending
            paymentStatus: 'pending' as PaymentStatus,
            orderStatus: 'placed' as OrderStatus
        };

        const docRef = await collections.orders.add(newOrder);
        const order = await getOrderById(docRef.id);

        if (!order) {
            throw new AppError('Failed to create order', 500);
        }

        return order;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error creating order:', error);
        throw new AppError('Failed to create order', 500);
    }
};

/**
 * Get order by ID
 */
export const getOrderById = async (id: string): Promise<Order | null> => {
    try {
        const doc = await collections.orders.doc(id).get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data()?.createdAt?.toDate(),
            updatedAt: doc.data()?.updatedAt?.toDate(),
        } as Order;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw new AppError('Failed to fetch order', 500);
    }
};

/**
 * Get orders by user ID
 */
export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
    try {
        const snapshot = await collections.orders
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        }));
    } catch (error) {
        console.error('Error fetching user orders:', error);
        throw new AppError('Failed to fetch orders', 500);
    }
};

/**
 * Get all orders with optional filtering
 */
export const getAllOrders = async (
    filters?: {
        orderStatus?: OrderStatus;
        paymentStatus?: PaymentStatus;
        limit?: number;
    }
): Promise<Order[]> => {
    try {
        let query: any = collections.orders;

        if (filters?.orderStatus) {
            query = query.where('orderStatus', '==', filters.orderStatus);
        }

        if (filters?.paymentStatus) {
            query = query.where('paymentStatus', '==', filters.paymentStatus);
        }

        const limit = filters?.limit || 100;
        const snapshot = await query.orderBy('createdAt', 'desc').limit(limit).get();

        return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw new AppError('Failed to fetch orders', 500);
    }
};

/**
 * Update order status
 * 
 * INVOICE INTEGRATION: Auto-generates invoice for COD orders on delivery
 */
export const updateOrderStatus = async (
    orderId: string,
    orderStatus: OrderStatus
): Promise<Order> => {
    try {
        const orderRef = collections.orders.doc(orderId);
        const doc = await orderRef.get();

        if (!doc.exists) {
            throw new AppError('Order not found', 404);
        }

        await orderRef.update({
            orderStatus,
            updatedAt: new Date(),
        });

        const updatedOrder = await getOrderById(orderId);

        if (!updatedOrder) {
            throw new AppError('Failed to update order', 500);
        }

        // CRITICAL: Handle COD delivery confirmation → Auto-generate invoice
        if (orderStatus === 'delivered' && doc.data()?.paymentStatus === 'pending') {
            try {
                // Mark COD as paid
                await updatePaymentStatus(orderId, 'paid');

                // Auto-generate invoice for COD delivery
                const { generateInvoice, needsInvoiceGeneration } = await import('./invoiceService');
                const deliveredOrder = await getOrderById(orderId);
                if (deliveredOrder && needsInvoiceGeneration(deliveredOrder)) {
                    await generateInvoice(orderId);
                    console.log(`Invoice auto-generated for COD delivery: ${orderId}`);
                }
            } catch (error) {
                console.error('Failed to process COD delivery invoice:', error);
                // Don't fail status update - invoice can be generated manually
            }
        }

        // CRITICAL: Update customer cache if order is cancelled
        if (orderStatus === 'cancelled' && doc.data()?.orderStatus !== 'cancelled') {
            try {
                const order = doc.data() as Order;
                await updateCustomerCacheOnCancellation({
                    ...order,
                    id: doc.id,
                    createdAt: order.createdAt?.toDate(),
                    updatedAt: order.updatedAt?.toDate(),
                } as Order);
            } catch (error) {
                console.error('Failed to update customer cache on cancellation:', error);
                // Don't fail the status update, but log for manual resync
            }
        }

        return updatedOrder;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error updating order status:', error);
        throw new AppError('Failed to update order status', 500);
    }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: PaymentStatus,
    razorpayPaymentId?: string
): Promise<Order> => {
    try {
        const orderRef = collections.orders.doc(orderId);
        const doc = await orderRef.get();

        if (!doc.exists) {
            throw new AppError('Order not found', 404);
        }

        const updateData: any = {
            paymentStatus,
            updatedAt: new Date(),
        };

        if (razorpayPaymentId) {
            updateData.razorpayPaymentId = razorpayPaymentId;
        }

        await orderRef.update(updateData);

        const updatedOrder = await getOrderById(orderId);

        if (!updatedOrder) {
            throw new AppError('Failed to update order', 500);
        }

        // CRITICAL: Update customer and analytics caches when payment is successful
        if (paymentStatus === 'paid' && doc.data()?.paymentStatus !== 'paid') {
            try {
                await updateCustomerCacheOnOrder(updatedOrder);
                await updateAnalyticsCache(updatedOrder);
            } catch (error) {
                console.error('Failed to update caches on payment:', error);
                // Don't fail payment update, but log for manual resync
            }
        }

        return updatedOrder;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error updating payment status:', error);
        throw new AppError('Failed to update payment status', 500);
    }
};

/**
 * Mark order email as sent
 */
export const markEmailSent = async (orderId: string): Promise<void> => {
    try {
        await collections.orders.doc(orderId).update({
            emailSent: true,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error('Error marking email sent:', error);
        // Don't throw error, just log it
    }
};

/**
 * Deduct stock for all items in an order
 * CRITICAL: This should be called immediately after successful payment verification
 * to prevent overselling
 * 
 * SECURITY: Idempotency protection - safe to call multiple times
 */
export const deductOrderStock = async (orderId: string): Promise<void> => {
    try {
        // 1. Fetch the order
        const order = await getOrderById(orderId);

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // SECURITY FIX: Idempotency check - prevent double stock deduction
        if (order.stockDeducted) {
            const logger = (await import('../utils/logger')).default;
            logger.info(`Stock already deducted for order: ${orderId}. Skipping.`);
            return; // Safe to call multiple times
        }

        // 2. Loop through each item and deduct stock
        for (const item of order.items) {
            // Get current product to retrieve latest stock
            const product = await getProductById(item.productId);

            if (!product) {
                throw new AppError(
                    `Product not found: ${item.productId}`,
                    404
                );
            }

            // Get current stock for the specific size
            const currentStock = product.stockBySize[item.size] || 0;

            // Calculate new stock after deduction
            const newStock = currentStock - item.quantity;

            // VALIDATION: Prevent negative stock (defensive check)
            if (newStock < 0) {
                const logger = (await import('../utils/logger')).default;
                logger.warn(
                    `Stock for ${product.title} (Size: ${item.size}) would go negative. ` +
                    `Current: ${currentStock}, Requested: ${item.quantity}. Setting to 0.`
                );
            }

            // 3. Update stock for this product/size combination
            // Note: updateStock handles the product update and inStock flag automatically
            await updateStock(
                item.productId,
                item.size,
                Math.max(0, newStock) // Ensure we never set negative stock
            );
        }

        // SECURITY FIX: Mark stock as deducted (idempotency flag)
        await collections.orders.doc(orderId).update({
            stockDeducted: true,
            updatedAt: new Date(),
        });

        const logger = (await import('../utils/logger')).default;
        logger.info(`Successfully deducted stock for order: ${orderId}`);
    } catch (error) {
        if (error instanceof AppError) throw error;
        const logger = (await import('../utils/logger')).default;
        logger.error('Error deducting order stock', error);
        throw new AppError('Failed to deduct order stock', 500);
    }
};