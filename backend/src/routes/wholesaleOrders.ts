import express from 'express';
import { verifyToken } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleCheck';
import { collections } from '../config/firebase';
import { WholesaleOrder } from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';
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
        const orderDoc = await collections.orders.doc(orderId).get();
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

        await collections.orders.doc(orderId).update({
            orderStatus,
            statusHistory: admin.firestore.FieldValue.arrayUnion(statusEntry),
            updatedAt: new Date(),
        });

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
 * Superadmin only
 */
router.patch('/:id/discount', verifyToken, requireSuperAdmin, async (req, res, next) => {
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
        const orderDoc = await collections.orders.doc(orderId).get();
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

        await collections.orders.doc(orderId).update({
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
 * GET /api/wholesale/orders/:id
 * Get order details
 */
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const orderDoc = await collections.orders.doc(req.params.id).get();

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
 * GET /api/wholesale/orders
 * Get all orders (with optional filters)
 */
router.get('/', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { status, limit = 50 } = req.query;

        let query: any = collections.orders.orderBy('createdAt', 'desc');

        if (status) {
            query = query.where('orderStatus', '==', status);
        }

        query = query.limit(Number(limit));

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
