import express, { Request, Response } from 'express';
import { verifyToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import {
    getDashboardAnalytics,
    rebuildAnalyticsCache
} from '../services/dashboardService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /api/dashboard/analytics
 * Get comprehensive business analytics (admin only)
 * Uses cached data for optimal performance
 */
router.get('/analytics', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const analytics = await getDashboardAnalytics();

        res.json({
            success: true,
            data: analytics,
        });
    } catch (error: any) {
        logger.error('Failed to get dashboard analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/dashboard/analytics/rebuild
 * Rebuild analytics cache from scratch (admin only)
 * WARNING: Expensive operation - reads all orders
 */
router.post('/analytics/rebuild', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        logger.info('Starting analytics cache rebuild...');
        const analytics = await rebuildAnalyticsCache();

        res.json({
            success: true,
            data: analytics,
            message: 'Analytics cache rebuilt successfully',
        });
    } catch (error: any) {
        logger.error('Failed to rebuild analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
