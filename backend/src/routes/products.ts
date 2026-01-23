import express, { Request, Response } from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getTagsByCategory,
} from '../services/productService';
import { deleteMultipleImages } from '../services/imageService';
import { verifyToken, optionalAuth } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleCheck';
import { validateProduct } from '../middleware/validation';

const router = express.Router();

/**
 * GET /api/products
 * Get all products with optional filters and sorting
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            sizes,
            tags,              // NEW: Tag filtering
            inStock,
            search,
            sortBy,
            limit,
            // Variant Filters
            styleCode,
            excludeId
        } = req.query;

        const filters: any = {};
        if (category) filters.category = category as string;
        if (minPrice) filters.minPrice = parseFloat(minPrice as string);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
        if (sizes) filters.sizes = (sizes as string).split(',');
        if (tags) filters.tags = (tags as string).split(',').map(t => t.trim()).filter(Boolean); // NEW: Parse tags
        if (inStock) filters.inStock = inStock === 'true';
        if (search) filters.search = search as string;

        // Pass variant filters to service
        if (styleCode) filters.styleCode = styleCode as string;
        if (excludeId) filters.excludeId = excludeId as string;

        const products = await getAllProducts(
            filters,
            sortBy as any,
            limit ? parseInt(limit as string) : 50
        );

        res.json({
            success: true,
            data: products,
            count: products.length,
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/products/tags/by-category
 * Get all unique tags grouped by category (Men, Women, Kids)
 * Used for mega menu navigation
 */
router.get('/tags/by-category', async (req: Request, res: Response) => {
    try {
        const tagsByCategory = await getTagsByCategory();

        res.json({
            success: true,
            data: tagsByCategory,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/products/variants/:styleCode
 * Get related products for a specific style code
 * (Optional helper route for cleaner API usage)
 */
router.get('/variants/:styleCode', async (req: Request, res: Response) => {
    try {
        const { styleCode } = req.params;
        const { excludeId, limit } = req.query;

        const products = await getAllProducts(
            {
                styleCode,
                excludeId: excludeId as string
            },
            undefined,
            limit ? parseInt(limit as string) : 10
        );

        res.json({
            success: true,
            data: products,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const product = await getProductById(req.params.id);

        if (!product) {
            res.status(404).json({
                success: false,
                error: 'Product not found',
            });
            return;
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/products/admin
 * Create new product (superadmin only)
 */
router.post(
    '/admin',
    verifyToken,
    requireSuperAdmin,
    validateProduct,
    async (req: Request, res: Response) => {
        try {
            const product = await createProduct(req.body);

            res.status(201).json({
                success: true,
                data: product,
                message: 'Product created successfully',
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
 * PUT /api/products/admin/:id
 * Update product (admin + superadmin)
 */
router.put(
    '/admin/:id',
    verifyToken,
    requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const product = await updateProduct(req.params.id, req.body);

            res.json({
                success: true,
                data: product,
                message: 'Product updated successfully',
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
 * DELETE /api/products/admin/:id
 * Delete product (superadmin only)
 */
router.delete(
    '/admin/:id',
    verifyToken,
    requireSuperAdmin,
    async (req: Request, res: Response) => {
        try {
            // Get product to delete images
            const product = await getProductById(req.params.id);

            if (product && product.images && product.images.length > 0) {
                // Delete all product images from Cloudinary
                await deleteMultipleImages(product.images);
            }

            await deleteProduct(req.params.id);

            res.json({
                success: true,
                message: 'Product deleted successfully',
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
 * PATCH /api/products/admin/:id/stock
 * Update stock for specific size (admin + superadmin)
 */
router.patch(
    '/admin/:id/stock',
    verifyToken,
    requireAdmin,
    async (req: Request, res: Response) => {
        try {
            const { size, quantity } = req.body;

            if (!size || quantity === undefined) {
                res.status(400).json({
                    success: false,
                    error: 'Size and quantity are required',
                });
                return;
            }

            await updateStock(req.params.id, size, quantity);

            res.json({
                success: true,
                message: 'Stock updated successfully',
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