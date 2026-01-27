import express from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { collections } from '../config/firebase';
import { WholesaleOrder } from '@tntrends/shared';
import admin from 'firebase-admin';

const router = express.Router();

/**
 * Create wholesale order
 * POST /api/wholesale/orders
 */
router.post('/', verifyToken, async (req: AuthRequest, res) => {
    try {
        const { items, address, subtotal, gstRate, gst, totalAmount } = req.body;
        const userId = req.user!.uid;

        // Validate required fields
        if (!items || !address || !subtotal || !gstRate || !totalAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
            });
        }

        // Create order
        const newOrder: Omit<WholesaleOrder, 'id'> = {
            items,
            subtotal,
            gstRate,
            gst,
            adminDiscount: 0,
            totalAmount,
            adminDiscountHistory: [],

            // Payment
            paymentStatus: 'pending',
            razorpayOrderId: '',

            // Order lifecycle
            orderStatus: 'placed',
            statusHistory: [{
                status: 'placed',
                changedBy: userId,
                changedAt: new Date(),
                notes: 'Order created',
            }],

            // Metadata
            userId,
            address,
            stockDeducted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await collections.orders.add(newOrder);

        res.status(201).json({
            success: true,
            data: { id: docRef.id, ...newOrder },
            message: 'Order created successfully',
        });
    } catch (error: any) {
        console.error('Order creation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order',
        });
    }
});

export default router;
