import express from 'express';
import { verifyToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/roleCheck';
import {
    createWholesaleProduct,
    updateWholesaleProduct,
    getWholesaleProductById,
    getAllWholesaleProducts,
    deleteWholesaleProduct,
} from '../services/wholesaleProductService';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

/**
 * Wholesale Product Management Routes
 * Admin-only routes for managing bundle-based products
 */

/**
 * GET /api/wholesale/products
 * Get all wholesale products
 */
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const products = await getAllWholesaleProducts();
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wholesale/products/:id
 * Get single wholesale product
 */
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const product = await getWholesaleProductById(req.params.id);
        res.json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/wholesale/products
 * Create new wholesale product
 * Superadmin only
 */
router.post('/', verifyToken, requireSuperAdmin, async (req, res, next) => {
    try {
        const productData = req.body;

        // Validate required fields
        if (!productData.title || !productData.bundleQty || !productData.bundlePrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, bundleQty, bundlePrice',
            });
        }

        if (!productData.bundleComposition || Object.keys(productData.bundleComposition).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Bundle composition is required',
            });
        }

        const product = await createWholesaleProduct(productData);

        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/wholesale/products/:id
 * Update wholesale product
 * Admin can update, but price changes blocked if locked
 */
router.patch('/:id', verifyToken, requireSuperAdmin, async (req, res, next) => {
    try {
        const updates = req.body;
        await updateWholesaleProduct(req.params.id, updates);

        const updatedProduct = await getWholesaleProductById(req.params.id);

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Product updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/wholesale/products/:id
 * Delete wholesale product
 * Only allowed if product is not locked
 */
router.delete('/:id', verifyToken, requireSuperAdmin, async (req, res, next) => {
    try {
        await deleteWholesaleProduct(req.params.id);

        res.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
