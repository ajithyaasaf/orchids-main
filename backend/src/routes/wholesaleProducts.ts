import express from 'express';
import { verifyToken } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/roleCheck';
import {
    createWholesaleProduct,
    updateWholesaleProduct,
    getWholesaleProductById,
    getWholesaleProductBySlug,
    getWholesaleProductsByCategory,
    getWholesaleProductsByStyleCode,
    getAllWholesaleProducts,
    deleteWholesaleProduct,
} from '../services/wholesaleProductService';
import { WholesaleProduct } from '@orchids/shared';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

// ---------------------------------------------------------------------------
// Sanitizer — applied to every GET response to guarantee type safety.
// Protects against Firestore documents that are missing optional numeric fields
// (e.g. a product saved before bundlePrice/bundleQty were required).
// ---------------------------------------------------------------------------

function sanitizeProduct(product: WholesaleProduct): WholesaleProduct {
    return {
        ...product,
        bundlePrice:
            typeof product.bundlePrice === 'number' && !isNaN(product.bundlePrice)
                ? product.bundlePrice
                : 0,
        bundleQty:
            typeof product.bundleQty === 'number' && !isNaN(product.bundleQty)
                ? product.bundleQty
                : 0,
        availableBundles:
            typeof product.availableBundles === 'number' && !isNaN(product.availableBundles)
                ? product.availableBundles
                : 0,
        // Guarantee images is always an array so the frontend never has to check
        images: Array.isArray(product.images) ? product.images : [],
        // Guarantee bundleComposition is always an object
        bundleComposition:
            product.bundleComposition && typeof product.bundleComposition === 'object'
                ? product.bundleComposition
                : {},
    };
}

/**
 * Wholesale Product Management Routes
 * Admin-only routes for managing bundle-based products
 */

/**
 * GET /api/wholesale/products
 * Get all wholesale products
 */
router.get('/', async (req, res, next) => {
    try {
        const products = await getAllWholesaleProducts();
        res.json({ success: true, data: products.map(sanitizeProduct) });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wholesale/products/category/:category
 * Get products by category
 */
router.get('/category/:category', async (req, res, next) => {
    try {
        const { category } = req.params;
        const products = await getWholesaleProductsByCategory(category);
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wholesale/products/style/:styleCode
 * Get color variants by style code
 */
router.get('/style/:styleCode', async (req, res, next) => {
    try {
        const { styleCode } = req.params;
        const products = await getWholesaleProductsByStyleCode(styleCode);
        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wholesale/products/slug/:slug
 * Get single wholesale product by slug for SEO URLs
 * IMPORTANT: Must be registered BEFORE /:id to prevent Express from
 * treating "slug" as a product ID wildcard match.
 */
router.get('/slug/:slug', async (req, res, next) => {
    try {
        const product = await getWholesaleProductBySlug(req.params.slug);
        res.json({ success: true, data: sanitizeProduct(product) });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/wholesale/products/:id
 * Get single wholesale product by ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const product = await getWholesaleProductById(req.params.id);
        res.json({ success: true, data: sanitizeProduct(product) });
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
