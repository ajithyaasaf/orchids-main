import express, { Request, Response } from 'express';
import {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    getAllOrders,
    updateOrderStatus,
    markEmailSent,
} from '../services/orderService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { validateOrder } from '../middleware/validation';

const router = express.Router();

/**
 * POST /api/orders
 * Create new order
 */
router.post(
    '/',
    verifyToken,
    validateOrder,
    async (req: AuthRequest, res: Response) => {
        try {
            const orderData = {
                ...req.body,
                userId: req.user!.uid,
                emailSent: false,
            };

            const order = await createOrder(orderData);

            // Send order confirmation email
            if (req.user?.email) {
                const emailSent = await sendOrderConfirmationEmail(order, req.user.email);
                if (emailSent) {
                    await markEmailSent(order.id);
                }
            }

            res.status(201).json({
                success: true,
                data: order,
                message: 'Order created successfully',
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message,
            });
        }
    }
);

/**
 * GET /api/orders/user/:userId
 * Get orders by user ID
 */
router.get(
    '/user/:userId',
    verifyToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { userId } = req.params;

            // Users can only view their own orders unless admin
            if (req.user!.uid !== userId && req.user!.role === 'customer') {
                res.status(403).json({
                    success: false,
                    error: 'Forbidden: Cannot access other user orders',
                });
                return;
            }

            const orders = await getOrdersByUserId(userId);

            res.json({
                success: true,
                data: orders,
                count: orders.length,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message,
            });
        }
    }
);

/**
 * GET /api/orders/:id
 * Get single order by ID
 */
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const order = await getOrderById(req.params.id);

        if (!order) {
            res.status(404).json({
                success: false,
                error: 'Order not found',
            });
            return;
        }

        // Users can only view their own orders unless admin
        if (order.userId !== req.user!.uid && req.user!.role === 'customer') {
            res.status(403).json({
                success: false,
                error: 'Forbidden: Cannot access this order',
            });
            return;
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/admin/orders
 * Get all orders (admin only)
 */
router.get(
    '/admin/all',
    verifyToken,
    requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const { orderStatus, paymentStatus, limit } = req.query;

            const filters: any = {};
            if (orderStatus) filters.orderStatus = orderStatus;
            if (paymentStatus) filters.paymentStatus = paymentStatus;
            if (limit) filters.limit = parseInt(limit as string);

            const orders = await getAllOrders(filters);

            res.json({
                success: true,
                data: orders,
                count: orders.length,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message,
            });
        }
    }
);

/**
 * PATCH /api/orders/:id/status
 * Update order status (admin only)
 */
router.patch(
    '/:id/status',
    verifyToken,
    requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const { orderStatus } = req.body;

            if (!orderStatus) {
                res.status(400).json({
                    success: false,
                    error: 'Order status is required',
                });
                return;
            }

            const order = await updateOrderStatus(req.params.id, orderStatus);

            res.json({
                success: true,
                data: order,
                message: 'Order status updated successfully',
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
