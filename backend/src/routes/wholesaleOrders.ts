import express from 'express';
import { verifyToken, AuthRequest, requireOwnerOrAdmin } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleCheck';
import { collections } from '../config/firebase';
import { WholesaleOrder } from '@orchids/shared';
import admin from 'firebase-admin';

const router = express.Router();

/**
 * Wholesale Order Management Routes
 * Admin routes for order status management and manual discounts
 */

// Valid status transitions map
const VALID_TRANSITIONS: Record<string, string[]> = {
    placed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],  // Terminal state
    cancelled: [],  // Terminal state
};

import { createWholesaleOrder } from '../services/wholesaleOrderService';
import { getDashboardAnalytics } from '../services/dashboardService';
import { updateCustomerCacheOnCancellation } from '../services/customerAnalyticsService';
import logger from '../utils/logger';

/**
 * POST /api/wholesale/orders
 * Create a new wholesale order (Zero Trust, server-side calculation)
 *
 * ✅ Server re-calculates all prices — client cannot manipulate totals
 * ✅ Atomic Firestore transaction — prevents overselling in race conditions
 * ✅ Idempotency key — prevents double orders from retries
 * ✅ Address re-validated on the backend
 */
router.post('/', verifyToken, async (req: AuthRequest, res, next) => {
    try {
        const { cartItems, address, expectedTotalAmount, idempotencyKey, isTestMode, couponCode } = req.body;
        const userId = req.user!.uid;

        if (!cartItems || !address || !idempotencyKey) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: cartItems, address, idempotencyKey',
            });
        }

        const result = await createWholesaleOrder({
            userId,
            address,
            cartItems,
            expectedTotalAmount,
            idempotencyKey,
            isTestMode, // Passed to service for dummy test bypass
            couponCode,
        });

        res.status(201).json({
            success: true,
            data: {
                orderId: result.orderId,
                order: result.order,
            },
            message: 'Order created successfully',
        });
    } catch (error) {
        next(error); // AppError will be handled by the global error handler
    }
});

/**
 * PATCH /api/wholesale/orders/:id/status
 * Update order status with enforced transitions
 */
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { orderStatus, notes } = req.body;
        const orderId = req.params.id;
        const adminId = (req as any).user.uid;

        // Get current order
        const orderDoc = await collections.wholesaleOrders.doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        const order = orderDoc.data() as WholesaleOrder;
        const currentStatus = order.orderStatus;

        // Enforce valid transitions
        const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowedTransitions.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                error: `Invalid transition: ${currentStatus} → ${orderStatus}`,
                allowedTransitions,
            });
        }

        // Create status history entry
        const statusEntry = {
            status: orderStatus,
            changedBy: adminId,
            changedAt: new Date(),
            notes: notes || '',
        };

        await collections.wholesaleOrders.doc(orderId).update({
            orderStatus,
            statusHistory: admin.firestore.FieldValue.arrayUnion(statusEntry),
            updatedAt: new Date(),
        });

        // If cancelling a paid order, reverse the customer analytics cache
        if (orderStatus === 'cancelled') {
            try {
                await updateCustomerCacheOnCancellation({ ...order, id: orderId });
            } catch (cacheError) {
                logger.error(`Failed to update customer cache on cancellation for order ${orderId}:`, cacheError);
                // Non-fatal: cache can be rebuilt via /api/customers/resync
            }
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/wholesale/orders/:id/discount
 * Apply manual discount with audit trail
 * Admin accessible
 */
router.patch('/:id/discount', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { discount, reason } = req.body;
        const orderId = req.params.id;
        const adminId = (req as any).user.uid;

        // Validate discount reason
        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Discount reason required (minimum 10 characters)',
            });
        }

        // Get order
        const orderDoc = await collections.wholesaleOrders.doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        const order = orderDoc.data() as WholesaleOrder;

        // Validate discount amount
        if (discount < 0 || discount > order.subtotal) {
            return res.status(400).json({
                success: false,
                error: 'Invalid discount amount',
            });
        }

        // Create audit log entry
        const discountEntry = {
            amount: discount,
            reason: reason.trim(),
            appliedBy: adminId,
            appliedAt: new Date(),
        };

        // Recalculate total
        const newTotal = order.subtotal + order.gst - discount;

        await collections.wholesaleOrders.doc(orderId).update({
            adminDiscount: discount,
            adminDiscountHistory: admin.firestore.FieldValue.arrayUnion(discountEntry),
            totalAmount: newTotal,
            updatedAt: new Date(),
        });

        res.json({
            success: true,
            message: 'Discount applied successfully',
            data: {
                newTotal,
                discount,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/wholesale/orders/:id/tracking
 * Add shipping tracking number (admin only)
 */
router.patch('/:id/tracking', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { trackingNumber, courierName } = req.body;
        const orderId = req.params.id;

        if (!trackingNumber || !courierName) {
            return res.status(400).json({
                success: false,
                error: 'trackingNumber and courierName are required',
            });
        }

        const orderDoc = await collections.wholesaleOrders.doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        await collections.wholesaleOrders.doc(orderId).update({
            trackingNumber,
            courierName,
            updatedAt: new Date(),
        });

        res.json({ success: true, message: 'Tracking info added successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/wholesale/orders/:id/notes
 * Add admin internal note to order
 */
router.patch('/:id/notes', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { note } = req.body;
        const orderId = req.params.id;
        const adminId = (req as any).user.uid;

        if (!note || note.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Note cannot be empty' });
        }

        const noteEntry = {
            text: note.trim(),
            addedBy: adminId,
            addedAt: new Date(),
        };

        await collections.wholesaleOrders.doc(orderId).update({
            adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
            updatedAt: new Date(),
        });

        res.json({ success: true, message: 'Note added successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wholesale/orders/stats/summary
 * Get order stats for admin dashboard
 */
router.get('/stats/summary', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const analytics = await getDashboardAnalytics();
        
        const stats = {
            total: analytics.totalOrders,
            pending: analytics.placedCount,
            processing: analytics.processingCount,
            shipped: analytics.shippedCount,
            delivered: analytics.deliveredCount,
            cancelled: analytics.cancelledCount,
            unpaidAmount: analytics.unpaidAmount,
            totalRevenue: analytics.totalRevenue,
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        logger.error('Failed to fetch order summary stats:', error);
        next(error);
    }
});

/**
 * GET /api/wholesale/orders/:id
 * Get order details
 */
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const orderDoc = await collections.wholesaleOrders.doc(req.params.id).get();

        if (!orderDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
            });
        }

        const order = { id: orderDoc.id, ...orderDoc.data() };
        res.json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wholesale/orders/user/:userId
 * Get orders for a specific user
 * Protected: Resource owner or admin only
 */
router.get('/user/:userId', verifyToken, requireOwnerOrAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        const snapshot = await collections.wholesaleOrders
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(Number(limit))
            .get();

        const orders = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wholesale/orders
 * Get all orders (with optional filters) - Admin only
 */
router.get('/', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { status, limit = 50 } = req.query;

        let query: any = collections.wholesaleOrders;

        if (status) {
            query = query.where('orderStatus', '==', status);
        }

        query = query.orderBy('createdAt', 'desc').limit(Number(limit));

        const snapshot = await query.get();
        const orders = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
});

export default router;
