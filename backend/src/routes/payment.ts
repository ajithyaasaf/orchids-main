import express, { Request, Response } from 'express';
import {
    createRazorpayOrder,
    verifyPaymentSignature,
} from '../services/paymentService';
import { updatePaymentStatus, deductOrderStock, getOrderById } from '../services/orderService';
import { deductBundleStock } from '../services/wholesaleStockService';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { paymentLimiter } from '../middleware/rateLimiter';
import { collections } from '../config/firebase';
import logger from '../utils/logger';

const router = express.Router();

/**
 * POST /api/payment/create-order
 * Create Razorpay order
 * 
 * SECURITY FIX: Now accepts orderId instead of amount.
 * Amount is validated server-side from database (single source of truth).
 * Rate limited to 5 requests per 15 minutes per IP.
 */
router.post(
    '/create-order',
    paymentLimiter, // SECURITY: Rate limiting
    verifyToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { orderId } = req.body;

            // SECURITY: Validate orderId is provided
            if (!orderId) {
                res.status(400).json({
                    success: false,
                    error: 'Order ID is required',
                });
                return;
            }

            // SECURITY: Fetch order from database (single source of truth)
            const order = await getOrderById(orderId);

            if (!order) {
                res.status(404).json({
                    success: false,
                    error: 'Order not found',
                });
                return;
            }

            // SECURITY: Verify order belongs to requesting user
            if (order.userId !== req.user!.uid) {
                logger.security('Unauthorized payment creation attempt', {
                    uid: req.user!.uid,
                    orderId,
                    actualUserId: order.userId,
                });
                res.status(403).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }

            // SECURITY: Verify order is in pending state
            if (order.paymentStatus !== 'pending') {
                res.status(400).json({
                    success: false,
                    error: 'Order payment already processed or failed',
                });
                return;
            }

            // SECURITY: Use server-calculated amount (NEVER trust client)
            const razorpayOrder = await createRazorpayOrder(order.totalAmount);

            // SECURITY: Store Razorpay order ID in our order for verification
            await collections.orders.doc(orderId).update({
                razorpayOrderId: razorpayOrder.orderId,
            });

            logger.info(`Razorpay order created for order: ${orderId}`, {
                amount: order.totalAmount,
                razorpayOrderId: razorpayOrder.orderId,
            });

            res.json({
                success: true,
                data: razorpayOrder,
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
 * Verify Razorpay payment
 * 
 * SECURITY ENHANCEMENTS:
 * - Rate limited to prevent brute force
 * - Checks for payment replay attacks
 * - Verifies Razorpay order ID matches our order
 */
router.post('/verify', paymentLimiter, verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            orderId,
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            res.status(400).json({
                success: false,
                error: 'Payment verification data is incomplete',
            });
            return;
        }

        if (!orderId) {
            res.status(400).json({
                success: false,
                error: 'Order ID is required',
            });
            return;
        }

        // SECURITY: Check if this payment ID was already used (replay attack prevention)
        const existingPayments = await collections.orders
            .where('razorpayPaymentId', '==', razorpayPaymentId)
            .get();

        if (!existingPayments.empty) {
            logger.security('Payment replay attack detected', {
                razorpayPaymentId,
                orderId,
                uid: req.user!.uid,
            });
            res.status(400).json({
                success: false,
                error: 'Payment already used for another order',
            });
            return;
        }

        // SECURITY: Verify the razorpayOrderId matches our order's expected order ID
        const order = await getOrderById(orderId);

        if (!order) {
            res.status(404).json({
                success: false,
                error: 'Order not found',
            });
            return;
        }

        // Verify order belongs to user
        if (order.userId !== req.user!.uid) {
            logger.security('Unauthorized payment verification attempt', {
                uid: req.user!.uid,
                orderId,
                actualUserId: order.userId,
            });
            res.status(403).json({
                success: false,
                error: 'Unauthorized',
            });
            return;
        }

        // Verify Razorpay order ID matches (prevent order/payment mismatch)
        if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
            logger.security('Payment order ID mismatch detected', {
                orderId,
                expectedRazorpayOrderId: order.razorpayOrderId,
                receivedRazorpayOrderId: razorpayOrderId,
            });
            res.status(400).json({
                success: false,
                error: 'Payment order mismatch',
            });
            return;
        }

        // Verify payment signature
        const isValid = verifyPaymentSignature({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });

        if (isValid && orderId) {
            // 1. Update order payment status to paid
            const updatedOrder = await updatePaymentStatus(orderId, 'paid', razorpayPaymentId);

            // 2. CRITICAL STEP: Deduct bundle inventory atomically
            // This also handles product price locking after first paid order
            try {
                // Check if this is a wholesale order (has bundlesOrdered field)
                if (updatedOrder.items?.[0]?.bundlesOrdered !== undefined) {
                    // Wholesale order - use bundle stock deduction
                    await deductBundleStock(orderId, updatedOrder.items);
                    logger.info(`Bundle stock deducted for wholesale order: ${orderId}`);
                } else {
                    // Retail order - use regular stock deduction
                    await deductOrderStock(orderId);
                    logger.info(`Regular stock deducted for retail order: ${orderId}`);
                }
            } catch (stockError) {
                logger.error('Stock deduction failed after payment', stockError);
                // Payment succeeded but stock deduction failed - requires manual intervention
                // Order is marked as paid but stock not deducted - admin review needed
            }

            // 3. AUTO-GENERATE INVOICE for paid orders
            try {
                const { generateInvoice, needsInvoiceGeneration } = await import('../services/invoiceService');
                if (needsInvoiceGeneration(updatedOrder)) {
                    await generateInvoice(orderId);
                    logger.info(`Invoice auto-generated for order: ${orderId}`);
                }
            } catch (error) {
                logger.error('Failed to auto-generate invoice', error);
                // Don't fail payment - invoice can be generated manually by admin
            }

            // 4. Track combo conversion if combo was used
            if (updatedOrder.appliedCombo) {
                const { trackComboEvent } = await import('../services/comboAnalyticsService');
                await trackComboEvent('converted', updatedOrder.appliedCombo.comboId, {
                    cartValue: updatedOrder.totalAmount,
                    savings: updatedOrder.appliedCombo.savings,
                    orderId: updatedOrder.id,
                    itemCount: updatedOrder.appliedCombo.itemCount,
                    userId: updatedOrder.userId,
                });
            }

            // 5. Track coupon usage if coupon was applied
            if (updatedOrder.appliedCoupon) {
                const { useCoupon } = await import('../services/couponService');
                try {
                    await useCoupon(updatedOrder.appliedCoupon.couponId, updatedOrder.userId);
                    logger.info(`Coupon ${updatedOrder.appliedCoupon.code} marked as used`, {
                        orderId: updatedOrder.id,
                        userId: updatedOrder.userId,
                        discount: updatedOrder.appliedCoupon.discount,
                    });
                } catch (error) {
                    // Log but don't fail the payment - coupon already applied
                    logger.error('Failed to track coupon usage', error);
                }
            }

            logger.info(`Payment verified successfully for order: ${orderId}`);

            res.json({
                success: true,
                message: 'Payment verified successfully',
            });
        } else {
            // Mark payment as failed
            if (orderId) {
                await updatePaymentStatus(orderId, 'failed');
            }

            logger.warn(`Payment verification failed for order: ${orderId}`);

            res.status(400).json({
                success: false,
                error: 'Payment verification failed',
            });
        }
    } catch (error: any) {
        logger.error('Payment verification error', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: 'Payment verification failed. Please contact support.',
        });
    }
});

/**
 * GET /api/payment/key
 * Get Razorpay public key
 */
router.get('/key', (req: Request, res: Response) => {
    res.json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID,
    });
});

export default router;
