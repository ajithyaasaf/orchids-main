import express, { Response } from 'express';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService';
import { restoreBundleStock } from '../services/wholesaleStockService';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimiter';
import { collections } from '../config/firebase';
import logger from '../utils/logger';
import { getWholesaleOrderById, updateWholesalePaymentStatus } from '../services/wholesaleOrderService';
import { updateCustomerCacheOnOrder } from '../services/customerAnalyticsService';

const router = express.Router();

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order and returns the razorpayOrderId + amount to the frontend.
 * The frontend uses this to open the Razorpay checkout popup.
 * 
 * Security:
 *  - Authenticated with verifyToken (Firebase JWT)
 *  - Rate-limited to prevent abuse
 *  - Amount is read from DB, never from client
 *  - Only the order owner can initiate payment
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

            // SECURITY: Only the order owner can pay for their own order
            if (order.userId !== req.user!.uid) {
                logger.security('Unauthorized payment creation attempt', { uid: req.user!.uid, orderId });
                res.status(403).json({ success: false, error: 'Unauthorized' });
                return;
            }

            if (order.paymentStatus !== 'pending') {
                res.status(400).json({ success: false, error: 'Order payment already processed or failed' });
                return;
            }

            // Create Razorpay order (amount comes from DB, never from client)
            const { razorpayOrderId } = await createRazorpayOrder(orderId, order.totalAmount);

            // Store the Razorpay order ID for later verification & reconciliation
            await collections.wholesaleOrders.doc(orderId).update({
                gatewayOrderId: razorpayOrderId,
            });

            logger.info(`Razorpay order created: ${razorpayOrderId} for internal order ${orderId}`);

            res.json({
                success: true,
                data: {
                    razorpayOrderId,
                    amount: Math.round(order.totalAmount * 100), // in paise for the SDK
                    currency: 'INR',
                    orderId, // echo back for frontend convenience
                },
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
 * Called by the frontend AFTER the Razorpay popup succeeds.
 * Verifies the cryptographic signature — this is the real security gate.
 * 
 * Security:
 *  - The 3 Razorpay values (order_id, payment_id, signature) are verified
 *    using HMAC-SHA256 with KEY_SECRET that never left this server.
 *  - A tampered success response from the browser is mathematically impossible to forge.
 *  - Idempotent: if the order is already 'paid', we skip and return success.
 */
router.post('/verify', paymentLimiter, verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        // Validate all required fields
        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            res.status(400).json({
                success: false,
                error: 'Missing payment verification fields (orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature)',
            });
            return;
        }

        const order = await getWholesaleOrderById(orderId);
        if (!order) {
            res.status(404).json({ success: false, error: 'Order not found' });
            return;
        }

        // SECURITY: Only the order owner can verify payment for their own order
        if (order.userId !== req.user!.uid) {
            logger.security('Unauthorized payment verification attempt', { uid: req.user!.uid, orderId });
            res.status(403).json({ success: false, error: 'Unauthorized' });
            return;
        }

        // Idempotency: if already paid (maybe webhook was faster), just return success
        if (order.paymentStatus === 'paid') {
            res.json({ success: true, message: 'Payment already verified' });
            return;
        }

        // Cross-check: the razorpayOrderId should match what we stored
        if (order.gatewayOrderId && order.gatewayOrderId !== razorpayOrderId) {
            logger.security('Razorpay order ID mismatch — possible replay attack', {
                orderId,
                expected: order.gatewayOrderId,
                received: razorpayOrderId,
            });
            res.status(400).json({ success: false, error: 'Payment order mismatch' });
            return;
        }

        // SECURITY: Verify the signature using KEY_SECRET (never exposed to client)
        const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

        if (!isValid) {
            logger.security('Razorpay signature verification failed — possible tampering', {
                orderId,
                razorpayOrderId,
                razorpayPaymentId,
            });
            await updateWholesalePaymentStatus(orderId, 'failed');
            await restoreBundleStock(orderId);
            res.status(400).json({ success: false, error: 'Payment signature verification failed' });
            return;
        }

        // ✅ Signature verified — mark order as paid
        const updatedOrder = await updateWholesalePaymentStatus(orderId, 'paid', razorpayPaymentId);

        // Update customer analytics cache (non-fatal)
        try {
            await updateCustomerCacheOnOrder(updatedOrder);
        } catch (error) {
            logger.error('Failed to update customer cache after payment verify', error);
        }

        // Auto-generate invoice
        try {
            const { generateInvoice, needsInvoiceGeneration } = await import('../services/invoiceService');
            if (needsInvoiceGeneration(updatedOrder as any)) {
                await generateInvoice(orderId);
            }
        } catch (error) {
            logger.error('Failed to auto-generate invoice after payment verification', error);
        }

        logger.info(`Payment verified successfully for order ${orderId}, payment: ${razorpayPaymentId}`);
        res.json({ success: true, message: 'Payment verified successfully' });
    } catch (error: any) {
        logger.error('Payment verification error', error);
        res.status(500).json({ success: false, error: 'Payment verification failed' });
    }
});

export default router;
