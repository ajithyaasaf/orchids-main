import { collections } from '../config/firebase';
import { checkPaymentStatus } from '../services/phonepeService';
import { updateWholesalePaymentStatus } from '../services/wholesaleOrderService';
import { restoreBundleStock } from '../services/wholesaleStockService';
import logger from '../utils/logger';

/**
 * Payment Reconciler
 * Runs periodically to check 'pending' orders older than 30 minutes.
 * If the user abandoned the payment or it failed silently, this script 
 * will mark it as 'failed' and restore the stock, preventing "Ghost Orders".
 */
export const reconcilePendingOrders = async () => {
    logger.info('Starting scheduled reconciliation for pending PhonePe orders...');
    
    try {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        // Find all orders that are still pending after 30 minutes
        const pendingOrdersSnapshot = await collections.wholesaleOrders
            .where('paymentStatus', '==', 'pending')
            .where('createdAt', '<=', thirtyMinsAgo)
            .get();

        if (pendingOrdersSnapshot.empty) {
            logger.info('No pending orders to reconcile.');
            return;
        }

        logger.info(`Found ${pendingOrdersSnapshot.size} pending orders to check.`);

        for (const doc of pendingOrdersSnapshot.docs) {
            const orderId = doc.id;
            const orderData = doc.data();

            try {
                // If it never reached PhonePe (no gatewayOrderId), it's completely abandoned
                if (!orderData.gatewayOrderId) {
                    logger.info(`Order ${orderId} has no gateway ID. Marking as failed and restoring stock.`);
                    await updateWholesalePaymentStatus(orderId, 'failed');
                    await restoreBundleStock(orderId);
                    continue;
                }

                // Check actual status with PhonePe
                const status = await checkPaymentStatus(orderId);

                if (status.success && status.state === 'COMPLETED') {
                    logger.info(`Reconciliation: Order ${orderId} was actually PAID. Updating...`);
                    const updatedOrder = await updateWholesalePaymentStatus(orderId, 'paid', status.paymentId);
                    
                    // Generate invoice if needed
                    try {
                        const { generateInvoice, needsInvoiceGeneration } = await import('../services/invoiceService');
                        if (needsInvoiceGeneration(updatedOrder as any)) {
                            await generateInvoice(orderId);
                        }
                    } catch (error) {
                        logger.error(`Reconciliation: Failed to auto-generate invoice for ${orderId}`, error);
                    }
                } else if (status.state === 'FAILED' || status.state === 'CANCELLED' || status.state === 'AUTHORIZATION_FAILED') {
                    logger.info(`Reconciliation: Order ${orderId} FAILED. Restoring stock.`);
                    await updateWholesalePaymentStatus(orderId, 'failed');
                    await restoreBundleStock(orderId);
                } else {
                    // Still pending with bank? Wait for next cycle.
                    logger.info(`Reconciliation: Order ${orderId} is still ${status.state} at bank. Waiting...`);
                }
            } catch (err) {
                logger.error(`Failed to reconcile order ${orderId}:`, err);
            }
        }
        
        logger.info('Reconciliation complete.');
    } catch (error) {
        logger.error('Fatal error in payment reconciler:', error);
    }
};

// In a real production environment with a single node, you can use `setInterval`
// or a cron library like `node-cron`. 
// If running in serverless/Firebase functions, this should be an HTTP trigger 
// called by Google Cloud Scheduler.

// For MVP, we export it so it can be called manually or attached to a basic interval in index.ts.
