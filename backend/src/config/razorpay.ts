import Razorpay from 'razorpay';
import logger from '../utils/logger';

/**
 * Razorpay Payment Gateway Configuration
 * Validates required env vars at startup in production to fail fast.
 */
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
    const missing: string[] = [];
    if (!process.env.RAZORPAY_KEY_ID)       missing.push('RAZORPAY_KEY_ID');
    if (!process.env.RAZORPAY_KEY_SECRET)   missing.push('RAZORPAY_KEY_SECRET');

    if (missing.length > 0) {
        throw new Error(`Razorpay PRODUCTION config incomplete. Missing: ${missing.join(', ')}`);
    }
    logger.info('✅ Razorpay configured for PRODUCTION');
} else {
    logger.info('⚙️ Razorpay running in TEST mode');
}

export const razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_placeholder',
});

export const RAZORPAY_CONFIG = {
    KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'test_secret_placeholder',
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    IS_PROD: isProd,
};
