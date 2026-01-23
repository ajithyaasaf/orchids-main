import express, { Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import {
    createCoupon,
    validateCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    useCoupon,
    getUserOrderCount,
} from '../services/couponService';
import { Coupon } from '@tntrends/shared';

const router = express.Router();

/**
 * POST /api/coupons/validate
 * Public (authenticated) route to validate coupon code
 * 
 * Body: { code: string, cartValue: number }
 * Returns: { valid: boolean, discount: number, reason?: string }
 */
router.post(
    '/validate',
    verifyToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { code, cartValue } = req.body;
            const userId = req.user!.uid;

            if (!code || typeof code !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Coupon code is required',
                });
                return;
            }

            if (!cartValue || typeof cartValue !== 'number' || cartValue <= 0) {
                res.status(400).json({
                    success: false,
                    error: 'Valid cart value is required',
                });
                return;
            }

            // Get user's order count to check first-order eligibility
            const orderCount = await getUserOrderCount(userId);

            // Validate coupon
            const result = await validateCoupon(code, userId, cartValue, orderCount);

            if (result.valid) {
                res.json({
                    success: true,
                    data: {
                        code: result.coupon!.code,
                        discount: result.discount,
                    },
                });
            } else {
                res.json({
                    success: false,
                    error: result.reason,
                });
            }
        } catch (error: any) {
            console.error('Error validating coupon:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to validate coupon',
            });
        }
    }
);

/**
 * GET /api/coupons
 * Admin only: Get all coupons
 */
router.get(
    '/',
    verifyToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
        try {
            const coupons = await getAllCoupons();

            res.json({
                success: true,
                data: coupons,
            });
        } catch (error: any) {
            console.error('Error fetching coupons:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch coupons',
            });
        }
    }
);

/**
 * GET /api/coupons/:id
 * Admin only: Get specific coupon by ID
 */
router.get(
    '/:id',
    verifyToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const coupon = await getCouponById(id);

            if (!coupon) {
                res.status(404).json({
                    success: false,
                    error: 'Coupon not found',
                });
                return;
            }

            res.json({
                success: true,
                data: coupon,
            });
        } catch (error: any) {
            console.error('Error fetching coupon:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch coupon',
            });
        }
    }
);

/**
 * POST /api/coupons
 * Admin only: Create new coupon
 */
router.post(
    '/',
    verifyToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
        try {
            const couponData: Omit<Coupon, 'id' | 'createdAt' | 'usedCount' | 'usedBy'> = {
                ...req.body,
                createdBy: req.user!.uid,
                // Convert date strings to Date objects
                validFrom: new Date(req.body.validFrom),
                validUntil: new Date(req.body.validUntil),
            };

            // Validate required fields
            if (!couponData.code) {
                res.status(400).json({
                    success: false,
                    error: 'Coupon code is required',
                });
                return;
            }

            if (!couponData.type || !['flat', 'percentage'].includes(couponData.type)) {
                res.status(400).json({
                    success: false,
                    error: 'Valid coupon type is required (flat or percentage)',
                });
                return;
            }

            if (!couponData.value || couponData.value <= 0) {
                res.status(400).json({
                    success: false,
                    error: 'Coupon value must be greater than 0',
                });
                return;
            }

            if (!req.body.validFrom || !req.body.validUntil) {
                res.status(400).json({
                    success: false,
                    error: 'Valid from and valid until dates are required',
                });
                return;
            }

            // Set defaults
            if (typeof couponData.active === 'undefined') {
                couponData.active = true;
            }

            if (!couponData.perUserLimit) {
                couponData.perUserLimit = 1;
            }

            if (!couponData.appliesTo) {
                couponData.appliesTo = 'all';
            }

            const coupon = await createCoupon(couponData);

            res.status(201).json({
                success: true,
                data: coupon,
                message: 'Coupon created successfully',
            });
        } catch (error: any) {
            console.error('Error creating coupon:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to create coupon',
            });
        }
    }
);

/**
 * PUT /api/coupons/:id
 * Admin only: Update coupon
 */
router.put(
    '/:id',
    verifyToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };

            // Don't allow updating certain fields
            delete updateData.id;
            delete updateData.createdAt;
            delete updateData.createdBy;
            delete updateData.usedCount;
            delete updateData.usedBy;

            // Convert date strings to Date objects if they're being updated
            if (updateData.validFrom) {
                updateData.validFrom = new Date(updateData.validFrom);
            }
            if (updateData.validUntil) {
                updateData.validUntil = new Date(updateData.validUntil);
            }

            const coupon = await updateCoupon(id, updateData);

            res.json({
                success: true,
                data: coupon,
                message: 'Coupon updated successfully',
            });
        } catch (error: any) {
            console.error('Error updating coupon:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to update coupon',
            });
        }
    }
);

/**
 * DELETE /api/coupons/:id
 * Admin only: Delete (deactivate) coupon
 */
router.delete(
    '/:id',
    verifyToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            await deleteCoupon(id);

            res.json({
                success: true,
                message: 'Coupon deactivated successfully',
            });
        } catch (error: any) {
            console.error('Error deleting coupon:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to delete coupon',
            });
        }
    }
);

export default router;
