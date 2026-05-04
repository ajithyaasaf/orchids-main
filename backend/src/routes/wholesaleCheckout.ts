import express from 'express';
import { verifyToken } from '../middleware/auth';
import { getWholesaleProductById } from '../services/wholesaleProductService';
import { calculateOrderTotal } from '../services/wholesalePricingService';
import { validateBundleStock } from '../services/wholesalePricingService';
import { logisticsService } from '../services/logisticsService';
import { validateCoupon } from '../services/couponService';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Wholesale Checkout Route
 * Calculate order totals with dynamic GST from settings
 * Validates stock availability and address
 */

interface CheckoutItem {
    productId: string;
    bundlesOrdered: number;
}

router.post('/calculate', verifyToken, async (req, res, next) => {
    try {
        const { items, address, couponCode } = req.body as {
            items: CheckoutItem[];
            address: any;
            couponCode?: string;
        };

        // Validate address
        const addressValidation = logisticsService.validateAddress(address);
        if (!addressValidation.valid) {
            return res.status(400).json({
                success: false,
                error: addressValidation.message,
            });
        }

        // ── 4. Fetch All Products in Bulk (Optimization) ─────────────────────
        const productIds = items.map(i => i.productId);
        const productSnapshots = await Promise.all(
            productIds.map(id => getWholesaleProductById(id))
        );

        const calculatedItems = [];
        const errors: string[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const product = productSnapshots[i];

            if (!product) {
                errors.push(`Product ${item.productId} not found`);
                continue;
            }

            // Check stock availability
            if (!product.inStock || product.availableBundles < item.bundlesOrdered) {
                errors.push(
                    `Insufficient stock for ${product.title}. Available: ${product.availableBundles} bundles`
                );
                continue;
            }

            // Validate stock logic
            const stockValidation = validateBundleStock(product, item.bundlesOrdered);
            if (!stockValidation.valid) {
                errors.push(stockValidation.message!);
                continue;
            }

            // Calculate line total
            const lineTotal = product.bundlePrice * item.bundlesOrdered;

            calculatedItems.push({
                productId: product.id,
                productTitle: product.title,
                productImage: product.images[0] || '',
                bundleQty: product.bundleQty,
                bundleComposition: product.bundleComposition,
                bundlesOrdered: item.bundlesOrdered,
                pricePerBundle: product.bundlePrice,
                lineTotal,
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                errors,
            });
        }

        if (calculatedItems.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid items in cart',
            });
        }

        // Calculate totals with dynamic GST
        let couponDiscount = 0;
        let appliedCoupon = null;
        
        if (couponCode) {
            const subtotal = calculatedItems.reduce((sum, item) => sum + item.lineTotal, 0);
            const couponResult = await validateCoupon(couponCode, (req as any).user.uid, subtotal);
            
            if (couponResult.valid && couponResult.coupon) {
                couponDiscount = couponResult.discount;
                appliedCoupon = {
                    code: couponResult.coupon.code,
                    discount: couponDiscount,
                };
            }
        }

        const totals = await calculateOrderTotal(calculatedItems, 0, couponDiscount);

        res.json({
            success: true,
            data: {
                items: calculatedItems,
                appliedCoupon,
                ...totals,
            },
        });
    } catch (error) {
        logger.error('Checkout calculation failed:', error);
        next(error);
    }
});

export default router;
