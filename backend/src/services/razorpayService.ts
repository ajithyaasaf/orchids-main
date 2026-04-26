import crypto from 'crypto';
import { razorpayClient, RAZORPAY_CONFIG } from '../config/razorpay';
import logger from '../utils/logger';

/**
 * Razorpay Payment Service
 * 
 * Security model:
 *  - KEY_SECRET never leaves the backend.
 *  - Payment verification uses HMAC-SHA256 signature check.
 *  - Webhook uses a separate WEBHOOK_SECRET for independent verification.
 */

// ─────────────────────────────────────────────
// Order Creation
// ─────────────────────────────────────────────

/**
 * Creates a Razorpay order server-side.
 * Razorpay requires an order to exist BEFORE the frontend popup opens.
 * The returned `razorpayOrderId` is what the frontend SDK needs.
 * 
 * @param orderId - Your internal order ID (stored as `receipt` in Razorpay)
 * @param amount  - Amount in INR (converted to paise internally)
 * @returns { razorpayOrderId } - The Razorpay order ID
 */
export const createRazorpayOrder = async (
    orderId: string,
    amount: number,
): Promise<{ razorpayOrderId: string }> => {
    // Convert to paise (Razorpay's smallest unit)
    const amountInPaise = Math.round(amount * 100);

    if (amountInPaise < 100) {
        throw new Error('Razorpay requires minimum ₹1 (100 paise)');
    }

    try {
        const razorpayOrder = await razorpayClient.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: orderId,
            notes: {
                internalOrderId: orderId,
            },
        });

        logger.info(`Razorpay order created: ${razorpayOrder.id} for internal order ${orderId}`);
        return { razorpayOrderId: razorpayOrder.id as string };
    } catch (error: any) {
        logger.error('Razorpay order creation failed:', error);
        
        // Extract meaningful error message
        const message = error?.error?.description || error?.message || 'Failed to create Razorpay order';
        const err = new Error(message) as any;
        err.statusCode = error?.statusCode || 500;
        throw err;
    }
};

// ─────────────────────────────────────────────
// Payment Signature Verification
// ─────────────────────────────────────────────

/**
 * SECURITY CRITICAL: Verify the payment signature after the Razorpay popup closes.
 * This prevents anyone from faking a successful payment response.
 *
 * How it works:
 *   1. Razorpay popup gives the browser 3 values: order_id, payment_id, signature
 *   2. We sign: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET)
 *   3. If our computed signature matches what Razorpay sent, the payment is genuine.
 *
 * Why this is secure:
 *   - KEY_SECRET is only on our server — a browser cannot compute the correct HMAC.
 *   - Even if someone intercepts the 3 values, they cannot forge a valid signature.
 */
export const verifyRazorpaySignature = (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
): boolean => {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_CONFIG.KEY_SECRET)
        .update(body)
        .digest('hex');

    // Constant-time comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(razorpaySignature, 'hex')
        );
    } catch {
        // If buffers have different lengths, timingSafeEqual throws
        return false;
    }
};

// ─────────────────────────────────────────────
// Webhook Signature Verification
// ─────────────────────────────────────────────

/**
 * Verify Razorpay webhook signature.
 * Different from payment signature — uses the raw request body and a separate WEBHOOK_SECRET.
 * 
 * IMPORTANT: The webhook route must use express.raw() to get the unparsed body.
 */
export const verifyRazorpayWebhookSignature = (
    rawBody: string,
    webhookSignatureHeader: string,
    webhookSecret: string,
): boolean => {
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    // Constant-time comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(webhookSignatureHeader, 'hex')
        );
    } catch {
        return false;
    }
};

// ─────────────────────────────────────────────
// Payment Status Check (for reconciliation)
// ─────────────────────────────────────────────

/**
 * Fetch the status of a Razorpay payment by the Razorpay order ID.
 * Used by the payment reconciler to handle abandoned or silent-fail orders.
 */
export const checkRazorpayPaymentStatus = async (
    razorpayOrderId: string,
): Promise<{ success: boolean; state: string; paymentId?: string }> => {
    try {
        // Fetch all payments for this Razorpay order
        const payments = await razorpayClient.orders.fetchPayments(razorpayOrderId) as any;

        if (!payments || !payments.items || payments.items.length === 0) {
            return { success: false, state: 'NO_PAYMENTS' };
        }

        // Find the most recent captured or authorized payment
        const captured = payments.items.find((p: any) => p.status === 'captured');
        if (captured) {
            return { success: true, state: 'COMPLETED', paymentId: captured.id };
        }

        const authorized = payments.items.find((p: any) => p.status === 'authorized');
        if (authorized) {
            return { success: false, state: 'PENDING', paymentId: authorized.id };
        }

        const failed = payments.items.find((p: any) => p.status === 'failed');
        if (failed) {
            return { success: false, state: 'FAILED', paymentId: failed.id };
        }

        // Default: still pending (no payment attempts yet, or all attempts are in-flight)
        return { success: false, state: 'PENDING' };
    } catch (error) {
        logger.error('Error checking Razorpay payment status:', error);
        throw error;
    }
};
