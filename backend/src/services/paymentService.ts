import razorpayInstance from '../config/razorpay';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { RazorpayOrderData, PaymentVerification } from '@tntrends/shared';

/**
 * Create Razorpay order
 */
export const createRazorpayOrder = async (
    amount: number,
    currency: string = 'INR'
): Promise<RazorpayOrderData> => {
    try {
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency,
            receipt: `order_${Date.now()}`,
        };

        const order = await razorpayInstance.orders.create(options);

        return {
            orderId: order.id,
            amount: order.amount / 100, // Convert back to rupees
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID as string,
        };
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new AppError('Failed to create payment order', 500);
    }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = (
    verification: PaymentVerification
): boolean => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verification;

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        return generatedSignature === razorpaySignature;
    } catch (error) {
        console.error('Error verifying payment signature:', error);
        return false;
    }
};

/**
 * Get payment details from Razorpay
 */
export const getPaymentDetails = async (paymentId: string): Promise<any> => {
    try {
        const payment = await razorpayInstance.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('Error fetching payment details:', error);
        throw new AppError('Failed to fetch payment details', 500);
    }
};
