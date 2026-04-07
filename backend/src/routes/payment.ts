import express, { Request, Response } from 'express';
import { initiatePayment, checkPaymentStatus } from '../services/phonepeService';
import { deductBundleStock, restoreBundleStock } from '../services/wholesaleStockService';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimiter';
import { collections } from '../config/firebase';
import admin from 'firebase-admin';
import logger from '../utils/logger';
import { getWholesaleOrderById, updateWholesalePaymentStatus } from '../services/wholesaleOrderService';

const router = express.Router();

/**
 * POST /api/payment/create-order
 * Create PhonePe Payment session
 */
router.post(
    '/create-order',
    paymentLimiter,
    verifyToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { orderId } = req.body;

            if (!orderId) {
                res.status(400).json({ success: false, error: 'Order ID is required' });
                return;
            }

            const order = await getWholesaleOrderById(orderId);

            if (!order) {
                res.status(404).json({ success: false, error: 'Order not found' });
                return;
            }

            if (order.userId !== req.user!.uid) {
                logger.security('Unauthorized payment creation attempt', { uid: req.user!.uid, orderId });
                res.status(403).json({ success: false, error: 'Unauthorized' });
                return;
            }

            if (order.paymentStatus !== 'pending') {
                res.status(400).json({ success: false, error: 'Order payment already processed or failed' });
                return;
            }

            // Generate PhonePe URL
            const phonepeOrder = await initiatePayment(
                orderId,
                order.totalAmount,
                order.userId,
                order.address.phone
            );

            // Store Gateway ID
            await collections.wholesaleOrders.doc(orderId).update({
                gatewayOrderId: phonepeOrder.merchantTransactionId,
            });

            logger.info(`PhonePe order created: ${orderId}`);

            res.json({
                success: true,
                data: phonepeOrder, // { merchantTransactionId, redirectUrl }
            });
        } catch (error: any) {
            logger.error('Payment order creation failed', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: 'Failed to create payment order. Please try again.',
            });
        }
    }
);

/**
 * POST /api/payment/verify
 * Check PhonePe payment status directly (Server to Server polling upon frontend return)
 */
router.post('/verify', paymentLimiter, verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            res.status(400).json({ success: false, error: 'Order ID is required' });
            return;
        }

        const order = await getWholesaleOrderById(orderId);
        if (!order) {
            res.status(404).json({ success: false, error: 'Order not found' });
            return;
        }

        if (order.userId !== req.user!.uid) {
            res.status(403).json({ success: false, error: 'Unauthorized' });
            return;
        }
        
        // If already paid (maybe webhook was faster), just return success
        if (order.paymentStatus === 'paid') {
             res.json({ success: true, message: 'Payment already verified' });
             return;
        }

        // Call PhonePe status API directly
        const statusResponse = await checkPaymentStatus(orderId);

        if (statusResponse.success && statusResponse.state === 'COMPLETED') {
            const updatedOrder = await updateWholesalePaymentStatus(orderId, 'paid', statusResponse.paymentId);

            // Invoice Gen
            try {
                const { generateInvoice, needsInvoiceGeneration } = await import('../services/invoiceService');
                if (needsInvoiceGeneration(updatedOrder as any)) {
                    await generateInvoice(orderId);
                }
            } catch (error) {
                logger.error('Failed to auto-generate invoice', error);
            }

            res.json({ success: true, message: 'Payment verified successfully' });
        } else if (statusResponse.state === 'PENDING') {
            res.status(202).json({ success: true, pending: true, message: 'Payment is still processing' });
        } else {
            // Failed
            await updateWholesalePaymentStatus(orderId, 'failed');
            await restoreBundleStock(orderId); // Restore the stock reserved on order creation
            res.status(400).json({ success: false, error: 'Payment verification failed' });
        }
    } catch (error: any) {
        logger.error('Payment verification error', error);
        res.status(500).json({ success: false, error: 'Payment verification failed' });
    }
});

export default router;
