import { collections, db } from '../config/firebase';
import { WholesaleProduct, WholesaleBundleItem } from '@orchids/shared';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import * as admin from 'firebase-admin';

/**
 * Wholesale Stock Management Service
 * Uses Firestore transactions for atomic stock operations
 * Prevents race conditions and overselling
 */

/**
 * Lock product prices after the first successful sale.
 * This ensures that once a product is "live" and sold, its wholesale price 
 * cannot be changed, maintaining accounting integrity.
 * 
 * @param orderId The successful order ID
 * @param items The items to lock
 */
export const lockProductPrices = async (
    orderId: string,
    items: WholesaleBundleItem[]
): Promise<void> => {
    try {
        await db.runTransaction(async (transaction) => {
            for (const item of items) {
                const productRef = collections.wholesaleProducts.doc(item.productId);
                const productDoc = await transaction.get(productRef);

                if (productDoc.exists) {
                    const product = productDoc.data() as WholesaleProduct;
                    
                    // Only lock if not already locked
                    if (!product.isLocked) {
                        transaction.update(productRef, {
                            isLocked: true,
                            lockedAt: admin.firestore.FieldValue.serverTimestamp(),
                            firstOrderId: orderId,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                        logger.info(`Locked price for product ${product.id} due to order ${orderId}`);
                    }
                }
            }
        });
    } catch (error) {
        logger.error(`Failed to lock product prices for order ${orderId}:`, error);
        // We don't throw here to avoid failing the payment verification process 
        // if just the locking fails, but we log it for admin review.
    }
};

/**
 * Restore stock on order failure or cancellation.
 * CRITICAL: Points to 'wholesaleOrders' collection.
 * Uses transaction to ensure atomicity.
 */
export const restoreBundleStock = async (orderId: string): Promise<void> => {
    try {
        await db.runTransaction(async (transaction) => {
            const orderRef = collections.wholesaleOrders.doc(orderId);
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists) {
                logger.error(`Cannot restore stock: Order ${orderId} not found`);
                return;
            }

            const orderData = orderDoc.data();
            
            // Only restore if stock was actually deducted and hasn't been restored yet
            if (!orderData?.stockDeducted) {
                logger.info(`Stock for order ${orderId} was not deducted or already restored. Skipping.`);
                return;
            }

            for (const item of orderData.items as WholesaleBundleItem[]) {
                const productRef = collections.wholesaleProducts.doc(item.productId);
                const productDoc = await transaction.get(productRef);

                if (productDoc.exists) {
                    const product = productDoc.data() as WholesaleProduct;
                    const newStock = product.availableBundles + item.bundlesOrdered;

                    transaction.update(productRef, {
                        availableBundles: newStock,
                        totalPieces: newStock * product.bundleQty,
                        inStock: true,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }

            // Mark as restored
            transaction.update(orderRef, {
                stockDeducted: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        logger.info(`✅ Stock restored successfully for order: ${orderId}`);
    } catch (error) {
        logger.error(`❌ Stock restoration failed for order ${orderId}:`, error);
        throw new AppError('Failed to restore stock', 500);
    }
};

/** 
 * Note: deductBundleStock is now handled directly inside the 
 * createWholesaleOrder transaction in wholesaleOrderService.ts 
 * to ensure "Zero-Trust" atomic reservation.
 */
