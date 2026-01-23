import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

/**
 * Verify Razorpay webhook signature
 * SECURITY: This validates that the webhook actually came from Razorpay
 */
export const verifyWebhookSignature = (
    webhookBody: string,
    webhookSignature: string,
    webhookSecret: string
): boolean => {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(webhookBody)
            .digest('hex');

        return expectedSignature === webhookSignature;
    } catch (error) {
        logger.error('Error verifying webhook signature', error);
        return false;
    }
};

/**
 * Razorpay webhook event types
 */
export type RazorpayWebhookEvent =
    | 'payment.authorized'
    | 'payment.captured'
    | 'payment.failed'
    | 'order.paid'
    | 'refund.created'
    | 'refund.processed';

export interface RazorpayWebhookPayload {
    entity: string;
    account_id: string;
    event: RazorpayWebhookEvent;
    contains: string[];
    payload: {
        payment: {
            entity: {
                id: string;
                entity: string;
                amount: number;
                currency: string;
                status: string;
                order_id: string;
                invoice_id: string | null;
                international: boolean;
                method: string;
                amount_refunded: number;
                refund_status: string | null;
                captured: boolean;
                description: string | null;
                card_id: string | null;
                bank: string | null;
                wallet: string | null;
                vpa: string | null;
                email: string;
                contact: string;
                error_code: string | null;
                error_description: string | null;
                error_source: string | null;
                error_step: string | null;
                error_reason: string | null;
                created_at: number;
            };
        };
        order?: {
            entity: {
                id: string;
                entity: string;
                amount: number;
                amount_paid: number;
                amount_due: number;
                currency: string;
                receipt: string;
                status: string;
                attempts: number;
                created_at: number;
            };
        };
    };
    created_at: number;
}

/**
 * Process webhook event and return relevant data
 */
export const processWebhookEvent = (
    payload: RazorpayWebhookPayload
): {
    event: RazorpayWebhookEvent;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    status: string;
    amount: number;
    errorCode?: string;
    errorDescription?: string;
} => {
    const { event, payload: webhookPayload } = payload;
    const payment = webhookPayload.payment.entity;

    return {
        event,
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        status: payment.status,
        amount: payment.amount / 100, // Convert paise to rupees
        errorCode: payment.error_code || undefined,
        errorDescription: payment.error_description || undefined,
    };
};
