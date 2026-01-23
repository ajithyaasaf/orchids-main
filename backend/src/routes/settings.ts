import express, { Request, Response } from 'express';
import { getSettings, updateSettings } from '../services/settingsService';
import { verifyToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/roleCheck';

const router = express.Router();

/**
 * GET /api/settings
 * Get global settings (public)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const settings = await getSettings();

        res.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PUT /api/settings
 * Update global settings (superadmin only)
 */
router.put(
    '/',
    verifyToken,
    requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            const settings = await updateSettings(req.body);

            res.json({
                success: true,
                data: settings,
                message: 'Settings updated successfully',
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message,
            });
        }
    }
);

export default router;
