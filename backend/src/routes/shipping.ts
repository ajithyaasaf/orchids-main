import express, { Request, Response } from 'express';
import { validateIndianPincode } from '../utils/pincodeValidator';
import { TIER_1_PREFIXES, SHIPPING_RATES } from '../config/shippingConfig';

const router = express.Router();

/**
 * GET /api/shipping/check/:pincode
 * Check pincode serviceability and get estimated delivery date
 */
router.get('/check/:pincode', async (req: Request, res: Response) => {
    try {
        const { pincode } = req.params;
        
        if (!pincode || pincode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pincode. Please enter a 6-digit Indian pincode.',
            });
        }

        const validation = validateIndianPincode(pincode);

        if (!validation.isValid) {
            return res.status(200).json({
                success: true,
                data: {
                    serviceable: false,
                    message: validation.message,
                },
            });
        }

        // Determine if it's Tier 1 or Tier 2 based on prefix
        const prefix = pincode.substring(0, 3);
        const isTier1 = TIER_1_PREFIXES.includes(prefix);
        const shippingTier = isTier1 ? 'TIER_1' : 'TIER_2';
        const rateInfo = SHIPPING_RATES[shippingTier];

        res.json({
            success: true,
            data: {
                serviceable: true,
                pincode,
                region: validation.region,
                estimatedDays: rateInfo.ESTIMATED_DAYS,
                deliveryLabel: rateInfo.LABEL,
                message: `Delivery available to ${validation.region || 'your location'}. Estimated delivery: ${rateInfo.ESTIMATED_DAYS}.`,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error checking pincode serviceability',
            error: error.message,
        });
    }
});

export default router;
