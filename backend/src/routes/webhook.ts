import express from 'express';
import { verifyRazorpayWebhookSignature } from '../services/razorpayService';
import { RAZORPAY_CONFIG } from '../config/razorpay';
import { getWholesaleOrderById, updateWholesalePaymentStatus } from '../services/wholesaleOrderService';
import { restoreBundleStock } from '../services/wholesaleStockService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/payment/webhook
 * Handle Razorpay Server-to-Server webhooks.
 * 
 * CRITICAL: This route must use express.raw() to get the unparsed body,
 * because signature verification requires the exact raw bytes.
 * The global express.json() middleware must NOT parse this route first.
 * 
 * Events we handle:
 *  - payment.captured  → Mark order as paid, generate invoice
 *  - payment.failed    → Mark order as failed, restore stock
 *  - order.paid        → Alternative event for order-level capture (auto-capture mode)
 * 
 * Security:
 *  - HMAC-SHA256 signature verification using RAZORPAY_WEBHOOK_SECRET
 *  - Idempotent: already-paid orders are skipped
 *  - Always returns 200 to Razorpay to prevent retries (except on signature failure)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;

        if (!signature) {
            logger.security('Razorpay webhook missing X-Razorpay-Signature header');
            return res.status(400).send('Missing signature');
        }

        if (!RAZORPAY_CONFIG.WEBHOOK_SECRET) {
            logger.error('RAZORPAY_WEBHOOK_SECRET is not configured — cannot verify webhook');
            return res.status(500).send('Webhook secret not configured');
        }

        // Convert raw body buffer to string for signature verification
        const rawBody = req.body.toString('utf8');

        const isValid = verifyRazorpayWebhookSignature(
            rawBody,
            signature,
            RAZORPAY_CONFIG.WEBHOOK_SECRET,
        );

        if (!isValid) {
            logger.security('Razorpay webhook signature verification failed — rejecting');
            return res.status(400).send('Invalid signature');
        }

        // Parse the verified payload
        const payload = JSON.parse(rawBody);
        const event = payload.event as string;

        logger.info(`Razorpay webhook received: event=${event}`);

        // Extract the internal orderId from multiple possible locations
        const orderId =
            payload.payload?.payment?.entity?.notes?.internalOrderId ||
            payload.payload?.order?.entity?.receipt ||
            payload.payload?.order?.entity?.notes?.internalOrderId;

        if (!orderId) {
            logger.error('Razorpay webhook: could not extract orderId from payload', {
                event,
                paymentNotes: payload.payload?.payment?.entity?.notes,
                orderReceipt: payload.payload?.order?.entity?.receipt,
            });
            // Return 200 anyway so Razorpay doesn't keep retrying a structurally invalid event
            return res.status(200).send('OK - orderId not found, skipping');
        }

        const razorpayPaymentId = payload.payload?.payment?.entity?.id;

        // ── Handle payment.captured or order.paid ────────────────────────────
        if (event === 'payment.captured' || event === 'order.paid') {
            const order = await getWholesaleOrderById(orderId);

            if (!order) {
                logger.error(`Webhook: Order ${orderId} not found in database`);
                return res.status(200).send('OK - order not found');
            }

            // Idempotency: skip if already paid
            if (order.paymentStatus === 'paid') {
                logger.info(`Webhook: Order ${orderId} already paid — skipping`);
                return res.status(200).send('OK');
            }

            const updatedOrder = await updateWholesalePaymentStatus(orderId, 'paid', razorpayPaymentId);
            logger.info(`Webhook: Order ${orderId} marked as PAID (payment: ${razorpayPaymentId})`);

            // Auto-generate invoice
            try {
                const { generateInvoice, needsInvoiceGeneration } = await import('../services/invoiceService');
                if (needsInvoiceGeneration(updatedOrder as any)) {
                    await generateInvoice(orderId);
                    logger.info(`Webhook: Invoice auto-generated for order ${orderId}`);
                }
            } catch (error) {
                logger.error('Webhook: Failed to auto-generate invoice', error);
            }
        }

        // ── Handle payment.failed ────────────────────────────────────────────
        else if (event === 'payment.failed') {
            const order = await getWholesaleOrderById(orderId);

            if (order && order.paymentStatus === 'pending') {
                await updateWholesalePaymentStatus(orderId, 'failed');
                await restoreBundleStock(orderId);
                logger.info(`Webhook: Order ${orderId} marked as FAILED and stock restored`);
            } else {
                logger.info(`Webhook: Ignoring payment.failed for order ${orderId} (status: ${order?.paymentStatus})`);
            }
        }

        // ── Unhandled events — log and acknowledge ───────────────────────────
        else {
            logger.info(`Webhook: Unhandled event ${event} — acknowledging`);
        }

        // Always return 200 OK to Razorpay to acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        logger.error('Webhook processing error:', error);
        // Return 200 even on internal errors to prevent Razorpay from retrying
        // (the reconciler will catch any missed updates)
        res.status(200).send('OK - processed with error');
    }
});

export default router;
