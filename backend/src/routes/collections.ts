import { Router, Request, Response } from 'express';
import { collectionService } from '../services/collectionService';
import { verifyToken, requireSuperAdmin } from '../middleware/auth';
import { Collection } from '@tntrends/shared';

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * GET /api/collections
 * Get all active collections for homepage showcase
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const collections = await collectionService.getActiveCollections();

        res.json({
            success: true,
            data: collections
        });
    } catch (error: any) {
        console.error('Error fetching active collections:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch collections'
        });
    }
});

/**
 * GET /api/collections/:slug
 * Get collection details with resolved products by slug
 */
router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;

        const collection = await collectionService.getCollectionBySlug(slug);

        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found or not active'
            });
        }

        // Track view (async, non-blocking)
        collectionService.trackView(collection.id).catch(err => {
            console.error('Failed to track view:', err);
        });

        res.json({
            success: true,
            data: collection
        });
    } catch (error: any) {
        console.error('Error fetching collection:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch collection'
        });
    }
});

// ============================================================================
// ADMIN ROUTES (Protected)
// ============================================================================

/**
 * GET /api/collections/admin/all
 * Get all collections with optional filters (admin only)
 */
router.get('/admin/all', verifyToken, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
        const { status, showOnHomepage, limit } = req.query;

        const collections = await collectionService.getAllCollections({
            status: status as any,
            showOnHomepage: showOnHomepage === 'true' ? true : showOnHomepage === 'false' ? false : undefined,
            limit: limit ? parseInt(limit as string) : undefined
        });

        res.json({
            success: true,
            data: collections
        });
    } catch (error: any) {
        console.error('Error fetching all collections:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch collections'
        });
    }
});

/**
 * GET /api/collections/admin/:id
 * Get collection by ID (admin only)
 */
router.get('/admin/:id', verifyToken, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const collection = await collectionService.getCollectionById(id);

        if (!collection) {
            return res.status(404).json({
                success: false,
                error: 'Collection not found'
            });
        }

        res.json({
            success: true,
            data: collection
        });
    } catch (error: any) {
        console.error('Error fetching collection:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch collection'
        });
    }
});

/**
 * POST /api/collections/admin
 * Create new collection (admin only)
 */
router.post('/admin', verifyToken, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
        const adminId = req.user!.uid;
        const collectionData = req.body as Partial<Collection>;

        // Validate required fields
        if (!collectionData.name || !collectionData.slug) {
            return res.status(400).json({
                success: false,
                error: 'Name and slug are required'
            });
        }

        const collectionId = await collectionService.createCollection(collectionData, adminId);

        res.status(201).json({
            success: true,
            data: { id: collectionId }
        });
    } catch (error: any) {
        console.error('Error creating collection:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to create collection'
        });
    }
});

/**
 * PUT /api/collections/admin/:id
 * Update existing collection (admin only)
 */
router.put('/admin/:id', verifyToken, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user!.uid;
        const updates = req.body as Partial<Collection>;

        await collectionService.updateCollection(id, updates, adminId);

        res.json({
            success: true,
            message: 'Collection updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating collection:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to update collection'
        });
    }
});

/**
 * DELETE /api/collections/admin/:id
 * Archive collection (soft delete, admin only)
 */
router.delete('/admin/:id', verifyToken, requireSuperAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user!.uid;

        await collectionService.deleteCollection(id, adminId);

        res.json({
            success: true,
            message: 'Collection archived successfully'
        });
    } catch (error: any) {
        console.error('Error deleting collection:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Failed to delete collection'
        });
    }
});

export default router;
