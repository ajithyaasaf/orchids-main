import logger from '../utils/logger';

/**
 * PhonePe Payment Gateway Configuration
 * Validates required env vars at startup in production to fail fast.
 */
export const PHONEPE_CONFIG = (() => {
    const isProd = process.env.PHONEPE_ENV === 'PROD';

    if (isProd) {
        const missing: string[] = [];
        if (!process.env.PHONEPE_MERCHANT_ID)  missing.push('PHONEPE_MERCHANT_ID');
        if (!process.env.PHONEPE_SALT_KEY)     missing.push('PHONEPE_SALT_KEY');
        if (!process.env.PHONEPE_SALT_INDEX)   missing.push('PHONEPE_SALT_INDEX');

        if (missing.length > 0) {
            throw new Error(`PhonePe PRODUCTION config incomplete. Missing: ${missing.join(', ')}`);
        }
        logger.info('✅ PhonePe configured for PRODUCTION');
    } else {
        logger.info('⚙️ PhonePe running in UAT (sandbox) mode');
    }

    return {
        MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || 'TEST_MERCHANT_ID',
        SALT_KEY: process.env.PHONEPE_SALT_KEY || 'TEST_SALT_KEY',
        SALT_INDEX: process.env.PHONEPE_SALT_INDEX || '1',
        ENV: process.env.PHONEPE_ENV || 'UAT',
        BASE_URL: isProd
            ? 'https://api.phonepe.com/apis/hermes'
            : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    };
})();
