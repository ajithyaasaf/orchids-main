import express from 'express';
import { validateWebhookSignature } from '../services/phonepeService';
import { getWholesaleOrderById, updateWholesalePaymentStatus } from '../services/wholesaleOrderService';
import { restoreBundleStock } from '../services/wholesaleStockService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/payment/webhook
 * Handle PhonePe Server-to-Server callbacks
 */
router.post('/webhook', express.json(), async (req, res) => {
    try {
        const xVerify = req.headers['x-verify'] as string;
        
        if (!xVerify) {
            logger.security('PhonePe webhook missing X-VERIFY header');
            return res.status(400).send('Missing signature');
        }

        const base64Response = req.body.response;
        
        if (!base64Response) {
            logger.error('PhonePe webhook missing response payload');
            return res.status(400).send('Missing payload');
        }

        const isValid = validateWebhookSignature(base64Response, xVerify);

        if (!isValid) {
            logger.security('PhonePe webhook invalid signature');
            return res.status(400).send('Invalid signature');
        }

        // Decode payload
        const decodedString = Buffer.from(base64Response, 'base64').toString('utf-8');
        const payload = JSON.parse(decodedString);

        const merchantTransactionId = payload.data.merchantTransactionId;
        const transactionId = payload.data.transactionId; // PhonePe's ID
        const state = payload.data.state;

        logger.info(`PhonePe webhook received for order ${merchantTransactionId}, state: ${state}`);

        const order = await getWholesaleOrderById(merchantTransactionId);
        if (!order) {
            logger.error(`Webhook order not found: ${merchantTransactionId}`);
            return res.status(404).send('Order not found');
        }

        // Idempotency: skip if already paid
        if (order.paymentStatus === 'paid') {
            return res.status(200).send('OK');
        }

        if (payload.success && state === 'COMPLETED') {
            const updatedOrder = await updateWholesalePaymentStatus(merchantTransactionId, 'paid', transactionId);
            
            // Auto-generate invoice
            try {
                const { generateInvoice, needsInvoiceGeneration } = await import('../services/invoiceService');
                if (needsInvoiceGeneration(updatedOrder as any)) {
                    await generateInvoice(merchantTransactionId);
                }
            } catch (error) {
                logger.error('Failed to auto-generate invoice in webhook', error);
            }
        } else if (state === 'FAILED') {
            await updateWholesalePaymentStatus(merchantTransactionId, 'failed');
            await restoreBundleStock(merchantTransactionId);
            logger.info(`PhonePe webhook marked order ${merchantTransactionId} as failed and restored stock`);
        }

        // Always return 200 OK to PhonePe to acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.status(500).send('Webhook error');
    }
});

export default router;
