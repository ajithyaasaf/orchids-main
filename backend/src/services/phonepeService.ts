import crypto from 'crypto';
import { PHONEPE_CONFIG } from '../config/phonepe';
import logger from '../utils/logger';
import { PhonePeOrderData } from '@orchids/shared';

// Note: Ensure axios is used or Node's native fetch. Since Node 18+ has fetch, we will use fetch.
// But wait, the backend might be Node 18+, let's assume global.fetch is available or just use require('https').
// We will use native fetch.

export const generatePhonePeChecksum = (payload: string, endpoint: string): string => {
    const stringToHash = payload + endpoint + PHONEPE_CONFIG.SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    return sha256 + '###' + PHONEPE_CONFIG.SALT_INDEX;
};

export const initiatePayment = async (
    orderId: string,
    amount: number,
    userId: string,
    phone?: string,
    redirectMode: 'REDIRECT' | 'POST' = 'REDIRECT'
): Promise<PhonePeOrderData> => {
    const endpoint = '/pg/v1/pay';
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success?id=${orderId}`;
    const callbackUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/payment/webhook`;

    // Ensure amount is in paise
    const amountInPaise = Math.round(amount * 100);

    const payloadData = {
        merchantId: PHONEPE_CONFIG.MERCHANT_ID,
        merchantTransactionId: orderId,
        merchantUserId: userId,
        amount: amountInPaise,
        redirectUrl: redirectUrl,
        redirectMode: redirectMode,
        callbackUrl: callbackUrl,
        mobileNumber: phone || '9999999999', // Fallback for testing if missing
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadData)).toString('base64');
    const checksum = generatePhonePeChecksum(base64Payload, endpoint);

    try {
        const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            body: JSON.stringify({ request: base64Payload })
        });

        const result = await response.json() as any;

        if (result.success && result.data && result.data.instrumentResponse && result.data.instrumentResponse.redirectInfo) {
            return {
                merchantTransactionId: orderId,
                redirectUrl: result.data.instrumentResponse.redirectInfo.url
            };
        } else {
            logger.error('PhonePe init failure:', result);
            throw new Error(result.message || 'Failed to initialize payment');
        }
    } catch (error) {
        logger.error('Error connecting to PhonePe:', error);
        throw error;
    }
};

export const checkPaymentStatus = async (merchantTransactionId: string): Promise<{ success: boolean; state: string; paymentId?: string }> => {
    const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${merchantTransactionId}`;
    const checksum = generatePhonePeChecksum('', endpoint);

    try {
        const response = await fetch(`${PHONEPE_CONFIG.BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID
            }
        });

        const result = await response.json() as any;

        // Check if the payment was successful (state could be COMPLETED, PENDING, FAILED)
        if (result.success && result.data && result.data.state === 'COMPLETED') {
            return { success: true, state: 'COMPLETED', paymentId: result.data.transactionId };
        } else if (result.data) {
            return { success: false, state: result.data.state || 'FAILED', paymentId: result.data.transactionId };
        } else {
            return { success: false, state: 'FAILED' };
        }
    } catch (error) {
        logger.error('Error checking PhonePe status:', error);
        throw error;
    }
};

export const validateWebhookSignature = (base64Response: string, xVerifyHeader: string): boolean => {
    // PhonePe sends the base64 body as {"response": "base64...string"} in webhook,
    // but the verification checksum is calculated on the raw base64 string, not the JSON payload itself.
    // According to docs, X-VERIFY = SHA256(base64Payload + saltKey) + "###" + saltIndex
    
    const stringToHash = base64Response + PHONEPE_CONFIG.SALT_KEY;
    const expectedChecksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + PHONEPE_CONFIG.SALT_INDEX;

    return expectedChecksum === xVerifyHeader;
};
