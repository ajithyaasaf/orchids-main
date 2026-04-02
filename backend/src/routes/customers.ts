import express from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { 
    getAllCustomersWithInsights, 
    getCustomerInsight, 
    recalculateAllCustomerMetrics,
    exportCustomersToCSV
} from '../services/customerAnalyticsService';

const router = express.Router();

/**
 * GET /api/customers
 * Get all customers with analytics (admin only)
 * Supports segment filtering and cursor-based pagination
 */
router.get('/', verifyToken, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { segment, minSpent, search, limit, lastDocId } = req.query;
        const limitNum = limit ? Number(limit) : 20;
        const result = await getAllCustomersWithInsights(
            { 
                segment: segment as any, 
                minSpent: minSpent ? Number(minSpent) : undefined,
                search: search as string 
            },
            limitNum,
            lastDocId as string
        );

        res.json({
            success: true,
            data: result.customers,
            pagination: {
                total: result.total,
                lastDocId: result.lastDocId,
                hasMore: result.customers.length === limitNum
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/customers/export/csv
 * Export customers as CSV (admin only)
 */
router.get('/export/csv', verifyToken, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const { segment, minSpent, search } = req.query;
        
        const csv = await exportCustomersToCSV({
            segment: segment as any,
            minSpent: minSpent ? Number(minSpent) : undefined,
            search: search as string
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=customers-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/customers/resync
 * Manually trigger metrics recalculation (admin only)
 * WARNING: Expensive operation
 */
router.post('/resync', verifyToken, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const result = await recalculateAllCustomerMetrics();
        res.json({
            success: true,
            message: 'Customer metrics resynced successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/customers/:id
 * Get single customer details with full order history (admin only)
 */
router.get('/:id', verifyToken, requireAdmin, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.params.id;
        const insight = await getCustomerInsight(userId);

        if (!insight) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: insight
        });
    } catch (error) {
        next(error);
    }
});

export default router;
