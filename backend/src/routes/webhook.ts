import express, { Request, Response } from 'express';
import { verifyWebhookSignature, processWebhookEvent, RazorpayWebhookPayload } from '../services/webhookService';
import { updatePaymentStatus, deductOrderStock, getOrderById } from '../services/orderService';
import { collections } from '../config/firebase';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/payment/webhook
 * Razorpay webhook endpoint for payment events
 * 
 * SECURITY FEATURES:
 * - Signature verification using webhook secret
 * - Idempotent processing (safe to receive duplicate events)
 * - Comprehensive logging for audit trail
 * 
 * IMPORTANT: This endpoint must be accessible without authentication
 * as it's called by Razorpay's servers, not by the client
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    try {
        // 1. SECURITY: Verify webhook signature
        const webhookSignature = req.headers['x-razorpay-signature'] as string;
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            logger.error('Webhook secret not configured');
            res.status(500).json({
                success: false,
                error: 'Webhook not configured',
            });
            return;
        }

        if (!webhookSignature) {
            logger.warn('Webhook received without signature');
            res.status(400).json({
                success: false,
                error: 'Missing webhook signature',
            });
            return;
        }

        // Get raw body for signature verification
        const rawBody = req.body.toString('utf8');

        // Verify the webhook is actually from Razorpay
        const isValid = verifyWebhookSignature(rawBody, webhookSignature, webhookSecret);

        if (!isValid) {
            logger.security('Invalid webhook signature detected', {
                signature: webhookSignature,
            });
            res.status(400).json({
                success: false,
                error: 'Invalid signature',
            });
            return;
        }

        // 2. Parse and process the webhook payload
        const payload: RazorpayWebhookPayload = JSON.parse(rawBody);
        const eventData = processWebhookEvent(payload);

        logger.info('Webhook event received', {
            event: eventData.event,
            razorpayOrderId: eventData.razorpayOrderId,
            razorpayPaymentId: eventData.razorpayPaymentId,
            status: eventData.status,
        });

        // 3. Find the order by Razorpay order ID
        const ordersSnapshot = await collections.orders
            .where('razorpayOrderId', '==', eventData.razorpayOrderId)
            .limit(1)
            .get();

        if (ordersSnapshot.empty) {
            logger.warn('Webhook received for unknown order', {
                razorpayOrderId: eventData.razorpayOrderId,
            });
            // Still return 200 to acknowledge receipt
            res.json({
                success: true,
                message: 'Order not found but webhook acknowledged',
            });
            return;
        }

        const orderDoc = ordersSnapshot.docs[0];
        const orderId = orderDoc.id;
        const order = await getOrderById(orderId);

        if (!order) {
            logger.error('Order document exists but cannot be retrieved', {
                orderId,
            });
            res.json({
                success: true,
                message: 'Order retrieval failed but webhook acknowledged',
            });
            return;
        }

        // 4. Handle different webhook events
        switch (eventData.event) {
            case 'payment.captured':
            case 'order.paid':
                // IDEMPOTENCY: Check if payment is already processed
                if (order.paymentStatus === 'paid') {
                    logger.info('Payment already processed, skipping', {
                        orderId,
                        razorpayPaymentId: eventData.razorpayPaymentId,
                    });
                    res.json({
                        success: true,
                        message: 'Payment already processed',
                    });
                    return;
                }

                // Update payment status to paid
                await updatePaymentStatus(orderId, 'paid', eventData.razorpayPaymentId);

                // Deduct stock (idempotent operation)
                await deductOrderStock(orderId);

                // Track combo conversion if applicable
                if (order.appliedCombo) {
                    const { trackComboEvent } = await import('../services/comboAnalyticsService');
                    await trackComboEvent('converted', order.appliedCombo.comboId, {
                        cartValue: order.totalAmount,
                        savings: order.appliedCombo.savings,
                        orderId: order.id,
                        itemCount: order.appliedCombo.itemCount,
                        userId: order.userId,
                    });
                }

                logger.info('Payment captured via webhook', {
                    orderId,
                    razorpayPaymentId: eventData.razorpayPaymentId,
                    amount: eventData.amount,
                });
                break;

            case 'payment.failed':
                // IDEMPOTENCY: Only update if still pending
                if (order.paymentStatus === 'pending') {
                    await updatePaymentStatus(orderId, 'failed', eventData.razorpayPaymentId);

                    logger.warn('Payment failed via webhook', {
                        orderId,
                        razorpayPaymentId: eventData.razorpayPaymentId,
                        errorCode: eventData.errorCode,
                        errorDescription: eventData.errorDescription,
                    });
                }
                break;

            case 'payment.authorized':
                // Payment is authorized but not captured yet
                // For auto-capture mode, this is informational
                logger.info('Payment authorized via webhook', {
                    orderId,
                    razorpayPaymentId: eventData.razorpayPaymentId,
                });
                break;

            case 'refund.created':
            case 'refund.processed':
                // TODO: Handle refunds in future enhancement
                logger.info('Refund event received', {
                    event: eventData.event,
                    orderId,
                    razorpayPaymentId: eventData.razorpayPaymentId,
                });
                break;

            default:
                logger.info('Unhandled webhook event', {
                    event: eventData.event,
                    orderId,
                });
        }

        // 5. Always return 200 to acknowledge receipt
        res.json({
            success: true,
            message: 'Webhook processed successfully',
        });

    } catch (error: any) {
        // CRITICAL: Always return 200 even on error to prevent Razorpay retries
        // Log the error but acknowledge receipt
        logger.error('Webhook processing error', error);

        res.json({
            success: false,
            error: 'Webhook processing failed but acknowledged',
        });
    }
});

export default router;
