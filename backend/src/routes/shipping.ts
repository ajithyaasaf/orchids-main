import express, { Request, Response } from 'express';
import { shippingService } from '../services/shippingService';

const router = express.Router();

/**
 * GET /api/shipping/check
 * Check shipping tier and fee for a pincode
 * Used for product page pincode checker
 */
router.get('/check', async (req: Request, res: Response) => {
    try {
        const { pincode } = req.query;

        if (!pincode || typeof pincode !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Pincode is required',
            });
            return;
        }

        const shippingInfo = await shippingService.checkPincode(pincode);

        res.json({
            success: true,
            data: shippingInfo,
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
