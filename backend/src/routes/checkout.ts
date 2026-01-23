import express, { Request, Response } from 'express';
import { shippingService } from '../services/shippingService';
import { verifyToken } from '../middleware/auth';
import { CheckoutCalculationRequest } from '@tntrends/shared';
import { validateCoupon, getUserOrderCount } from '../services/couponService';

const router = express.Router();

/**
 * POST /api/checkout/calculate
 * Calculate cart total with shipping and optional coupon discount
 * Requires authentication
 */
router.post('/calculate', verifyToken, async (req: Request, res: Response) => {
    try {
        const { items, pincode, couponCode } = req.body as CheckoutCalculationRequest & { couponCode?: string };

        // Validate request body
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({
                success: false,
                error: 'Items array is required and must not be empty',
            });
            return;
        }

        if (!pincode) {
            res.status(400).json({
                success: false,
                error: 'Pincode is required',
            });
            return;
        }

        // Validate each item has required fields
        for (const item of items) {
            if (!item.productId || !item.size || !item.quantity) {
                res.status(400).json({
                    success: false,
                    error: 'Each item must have productId, size, and quantity',
                });
                return;
            }

            if (item.quantity <= 0) {
                res.status(400).json({
                    success: false,
                    error: 'Quantity must be greater than 0',
                });
                return;
            }
        }

        // Get userId from verified token
        const userId = (req as any).user.uid;

        // Calculate cart total (without coupon)
        const calculation = await shippingService.calculateCartTotal(
            items,
            pincode,
            userId
        );

        // Apply coupon if provided
        let couponDiscount = 0;
        let couponError: string | undefined;
        let validCouponCode: string | undefined;

        if (couponCode && couponCode.trim()) {
            // Get user's order count for first-order coupon validation
            const userOrderCount = await getUserOrderCount(userId);
            const cartSubtotal = calculation.subtotal;

            // Validate coupon
            const couponResult = await validateCoupon(
                couponCode,
                userId,
                cartSubtotal,
                userOrderCount
            );

            if (couponResult.valid && couponResult.coupon) {
                couponDiscount = couponResult.discount;
                validCouponCode = couponResult.coupon.code;
            } else {
                // Return coupon error to frontend
                couponError = couponResult.reason;
            }
        }

        // Calculate final total with coupon discount
        const finalTotal = Math.max(0, calculation.finalTotal - couponDiscount);

        // Update response with coupon info
        const response = {
            ...calculation,
            discount: calculation.discount + couponDiscount,  // Total discount (product + coupon)
            discountLabel: validCouponCode
                ? `Coupon Discount (${validCouponCode})`
                : calculation.discountLabel,
            finalTotal,
            couponCode: validCouponCode,
            couponError,
        };

        res.json({
            success: true,
            data: response,
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
