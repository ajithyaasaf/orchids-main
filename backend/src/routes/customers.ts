import express, { Request, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import {
    getAllCustomersWithInsights,
    getCustomerInsight,
    exportCustomersToCSV,
    recalculateAllCustomerMetrics
} from '../services/customerAnalyticsService';
import type { CustomerFilters } from '@tntrends/shared';

const router = express.Router();

/**
 * GET /api/customers
 * Get all customers with analytics (admin only)
 * Supports filtering and cursor-based pagination
 */
router.get('/', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { segment, state, minSpent, search, limit = '20', lastDocId } = req.query;

        const filters: CustomerFilters = {
            segment: segment as any,
            state: state as string,
            minSpent: minSpent ? Number(minSpent) : undefined,
            search: search as string,
        };

        const result = await getAllCustomersWithInsights(
            filters,
            Number(limit),
            lastDocId as string | undefined
        );

        res.json({
            success: true,
            data: result.customers,
            pagination: {
                limit: Number(limit),
                total: result.total,
                lastDocId: result.lastDocId,
                hasMore: !!result.lastDocId,
            },
        });
    } catch (error: any) {
        console.error('Failed to get customers:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/customers/:userId
 * Get single customer with full order history (admin only)
 */
router.get('/:userId', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const customer = await getCustomerInsight(req.params.userId);

        if (!customer) {
            res.status(404).json({
                success: false,
                error: 'Customer not found',
            });
            return;
        }

        res.json({
            success: true,
            data: customer,
        });
    } catch (error: any) {
        console.error('Failed to get customer:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/customers/export/csv
 * Export customer data as CSV (admin only)
 * Streams data in batches for performance
 */
router.get('/export/csv', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { segment, state, minSpent, search } = req.query;

        const filters: CustomerFilters = {
            segment: segment as any,
            state: state as string,
            minSpent: minSpent ? Number(minSpent) : undefined,
            search: search as string,
        };

        const csv = await exportCustomersToCSV(filters);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
        res.send(csv);
    } catch (error: any) {
        console.error('Failed to export customers:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/customers/resync
 * Recalculate all customer metrics from orders (admin only)
 * WARNING: Expensive operation - use only for data recovery
 */
router.post('/resync', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        console.log('Starting customer metrics resync...');
        const result = await recalculateAllCustomerMetrics();

        res.json({
            success: true,
            data: result,
            message: `Recalculated metrics for ${result.processed} customers (${result.errors} errors)`,
        });
    } catch (error: any) {
        console.error('Failed to resync customers:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
