import express, { Request, Response } from 'express';
import {
    getAllActiveCombos,
    getAllCombos,
    getComboById,
    createCombo,
    updateCombo,
    deleteCombo,
} from '../services/comboService';
import { calculateBestPrice, validateComboAtCheckout } from '../services/comboPricingService';
import { getComboAnalytics, getAllCombosAnalytics, trackComboEvent } from '../services/comboAnalyticsService';
import { verifyToken, optionalAuth } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleCheck';
import { CartItem } from '@tntrends/shared';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * GET /api/combos/active
 * Get all active combo offers for customers
 */
router.get('/active', async (req: Request, res: Response) => {
    try {
        const combos = await getAllActiveCombos();

        res.json({
            success: true,
            data: combos,
            count: combos.length,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/combos/calculate
 * Calculate best price for given cart items
 */
router.post('/calculate', async (req: Request, res: Response) => {
    try {
        const { cartItems } = req.body as { cartItems: CartItem[] };

        if (!cartItems || !Array.isArray(cartItems)) {
            res.status(400).json({
                success: false,
                error: 'Invalid cart items',
            });
            return;
        }

        const bestPrice = await calculateBestPrice(cartItems);

        // Track view event if combo is applicable
        if (bestPrice.type === 'combo' && bestPrice.appliedCombo) {
            await trackComboEvent('view', bestPrice.appliedCombo.comboId, {
                cartValue: bestPrice.total,
                itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
            });
        }

        res.json({
            success: true,
            data: bestPrice,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/combos/validate
 * Re-validate combo at checkout
 */
router.post('/validate', async (req: Request, res: Response) => {
    try {
        const { cartItems, comboId } = req.body as {
            cartItems: CartItem[];
            comboId: string;
        };

        if (!cartItems || !comboId) {
            res.status(400).json({
                success: false,
                error: 'Cart items and combo ID are required',
            });
            return;
        }

        const validation = await validateComboAtCheckout(cartItems, comboId);

        if (!validation.valid) {
            // Track expired/removed event
            await trackComboEvent('expired', comboId, {
                reason: validation.message,
            });
        }

        res.json({
            success: validation.valid,
            data: validation.recalculatedPrice,
            message: validation.message,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// ============================================
// ADMIN ROUTES (Protected)
// ============================================

/**
 * GET /api/combos
 * Get all combos (admin only)
 */
router.get('/', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        console.log('===== COMBO LIST ENDPOINT HIT =====');
        console.log('User:', (req as any).user ? {
            uid: (req as any).user.uid,
            email: (req as any).user.email,
            role: (req as any).user.role
        } : 'NO USER');

        const combos = await getAllCombos();

        res.json({
            success: true,
            data: combos,
            count: combos.length,
        });
    } catch (error: any) {
        console.error('Error in GET /combos:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/combos
 * Create new combo - Superadmin only
 */
router.post('/', verifyToken, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
        const { name, type, minimumQuantity, comboPrice, active, startDate, endDate } = req.body;

        // Validation
        if (!name || !type || minimumQuantity === undefined || comboPrice === undefined) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: name, type, minimumQuantity, comboPrice',
            });
            return;
        }

        const combo = await createCombo(
            {
                name,
                type,
                minimumQuantity,
                comboPrice,
                active: active !== undefined ? active : true,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : undefined,
            },
            (req as any).user!.uid
        );

        res.status(201).json({
            success: true,
            data: combo,
            message: 'Combo created successfully',
        });
    } catch (error: any) {
        res.status(error.message.includes('Missing') || error.message.includes('must') ? 400 : 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/combos/analytics
 * Get analytics for all combos
 */
router.get('/analytics', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const analytics = await getAllCombosAnalytics(
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined
        );

        res.json({
            success: true,
            data: analytics,
            count: analytics.length,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/combos/analytics/:id
 * Get analytics for specific combo
 */
router.get('/analytics/:id', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const analytics = await getComboAnalytics(
            req.params.id,
            startDate ? new Date(startDate as string) : undefined,
            endDate ? new Date(endDate as string) : undefined
        );

        if (!analytics) {
            res.json({
                success: true,
                data: null,
                message: 'No analytics data available for this combo',
            });
            return;
        }

        res.json({
            success: true,
            data: analytics,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * PUT /api/combos/:id
 * Update existing combo - Admin + Superadmin
 */
router.put('/:id', verifyToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        const updates = req.body;

        // Convert date strings to Date objects if present
        if (updates.startDate) {
            updates.startDate = new Date(updates.startDate);
        }
        if (updates.endDate) {
            updates.endDate = new Date(updates.endDate);
        }

        const combo = await updateCombo(req.params.id, updates);

        res.json({
            success: true,
            data: combo,
            message: 'Combo updated successfully',
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('must') ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * DELETE /api/combos/:id
 * Delete (deactivate) combo - Superadmin only
 */
router.delete('/:id', verifyToken, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
        await deleteCombo(req.params.id);

        res.json({
            success: true,
            message: 'Combo deleted successfully',
        });
    } catch (error: any) {
        const statusCode = error.message.includes('not found') ? 404 : 500;

        res.status(statusCode).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/combos/:id
 * Get single combo details (must be last to avoid collision)
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const combo = await getComboById(req.params.id);

        if (!combo) {
            res.status(404).json({
                success: false,
                error: 'Combo not found',
            });
            return;
        }

        res.json({
            success: true,
            data: combo,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
