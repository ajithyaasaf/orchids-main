import { collections } from '../config/firebase';
import admin from 'firebase-admin';
import { WholesaleProduct } from '@orchids/shared';
import { AppError } from '../middleware/errorHandler';

/**
 * Wholesale Product Service
 * Handles CRUD operations for wholesale products
 * Enforces bundle validation and price locking
 */

/**
 * Generate URL-friendly slug from title and document ID
 * Enterprise Pattern: Appends a short hash (last 5 chars of ID) to guarantee uniqueness without DB reads
 */
const generateSlug = (title: string, id: string): string => {
    const baseSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove non-word characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '')   // Trim hyphens from ends
        .substring(0, 50);         // Truncate to keep URLs reasonable

    const shortHash = id.substring(id.length - 5).toLowerCase();

    return `${baseSlug}-${shortHash}`;
};

/**
 * Create new wholesale product
 * Validates bundle composition and initializes with unlocked status
 */
export const createWholesaleProduct = async (
    productData: Omit<WholesaleProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WholesaleProduct> => {
    // Validate bundle composition sums correctly
    const totalPcs = Object.values(productData.bundleComposition).reduce(
        (a, b) => a + b,
        0
    );

    if (totalPcs !== productData.bundleQty) {
        throw new AppError(
            `Bundle composition (${totalPcs}) must equal bundleQty (${productData.bundleQty})`,
            400
        );
    }

    // Pre-allocate Document Reference to get ID for slug generation
    const docRef = collections.wholesaleProducts.doc();

    const newProduct = {
        ...productData,
        slug: productData.slug || generateSlug(productData.title, docRef.id),
        totalPieces: productData.availableBundles * productData.bundleQty,
        inStock: productData.availableBundles > 0,
        isLocked: false,
        mixedColors: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await docRef.set(newProduct);
    return { id: docRef.id, ...newProduct } as WholesaleProduct;
};

/**
 * Update wholesale product
 * Prevents price changes on locked products (accounting integrity)
 */
export const updateWholesaleProduct = async (
    id: string,
    updates: Partial<WholesaleProduct>
): Promise<void> => {
    const productDoc = await collections.wholesaleProducts.doc(id).get();

    if (!productDoc.exists) {
        throw new AppError('Product not found', 404);
    }

    const product = productDoc.data() as WholesaleProduct;

    // Prevent admin form updates from accidentally overwriting live reservations
    if ('reservedBundles' in updates) {
        delete updates.reservedBundles;
    }

    // Accounting lock enforcement
    if (product.isLocked && updates.bundlePrice !== undefined) {
        if (updates.bundlePrice !== product.bundlePrice) {
            throw new AppError(
                'Cannot change price of locked product. Please create a new product for price changes.',
                403
            );
        }
    }

    // Validate bundle composition if being updated
    if (updates.bundleComposition && updates.bundleQty) {
        const totalPcs = Object.values(updates.bundleComposition).reduce((a, b) => a + b, 0);
        if (totalPcs !== updates.bundleQty) {
            throw new AppError(
                `Bundle composition (${totalPcs}) must equal bundleQty (${updates.bundleQty})`,
                400
            );
        }
    }

    // Calculate totalPieces if stock changes
    if (updates.availableBundles !== undefined) {
        const bundleQty = updates.bundleQty || product.bundleQty;
        updates.totalPieces = updates.availableBundles * bundleQty;
        updates.inStock = updates.availableBundles > 0;
    }

    // Auto-update slug if title changes and no custom slug provided
    if (updates.title && !updates.slug) {
        updates.slug = generateSlug(updates.title, id);
    }

    await collections.wholesaleProducts.doc(id).update({
        ...updates,
        updatedAt: new Date(),
    });
};

/**
 * Get wholesale product by ID
 */
export const getWholesaleProductById = async (id: string): Promise<WholesaleProduct> => {
    const doc = await collections.wholesaleProducts.doc(id).get();

    if (!doc.exists) {
        throw new AppError('Product not found', 404);
    }

    return { id: doc.id, ...doc.data() } as WholesaleProduct;
};

/**
 * Get wholesale product by Slug
 */
export const getWholesaleProductBySlug = async (slug: string): Promise<WholesaleProduct> => {
    const snapshot = await collections.wholesaleProducts
        .where('slug', '==', slug)
        .limit(1)
        .get();

    if (snapshot.empty) {
        throw new AppError('Product not found', 404);
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WholesaleProduct;
};

/**
 * Get multiple wholesale products by IDs (for collections)
 */
export const getWholesaleProductsByIds = async (ids: string[]): Promise<WholesaleProduct[]> => {
    if (!ids || ids.length === 0) {
        return [];
    }

    // Firestore 'in' query limit is 10, so batch if needed
    const chunkSize = 10;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
        chunks.push(ids.slice(i, i + chunkSize));
    }

    const allProducts: WholesaleProduct[] = [];

    for (const chunk of chunks) {
        const snapshot = await collections.wholesaleProducts
            .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
            .get();

        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() } as WholesaleProduct);
        });
    }

    // Maintain order of input IDs
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    return ids.map(id => productMap.get(id)).filter(Boolean) as WholesaleProduct[];
};


/**
 * Get wholesale products by category
 */
export const getWholesaleProductsByCategory = async (
    category: string,
    limit: number = 10
): Promise<WholesaleProduct[]> => {
    const snapshot = await collections.wholesaleProducts
        .where('category', '==', category)
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as WholesaleProduct[];
};

/**
 * Get wholesale products by style code (color variants)
 */
export const getWholesaleProductsByStyleCode = async (
    styleCode: string
): Promise<WholesaleProduct[]> => {
    const snapshot = await collections.wholesaleProducts
        .where('styleCode', '==', styleCode)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as WholesaleProduct[];
};

/**
 * Get all wholesale products
 * Returns only products with wholesale schema structure
 */
export const getAllWholesaleProducts = async (): Promise<WholesaleProduct[]> => {
    // Simple query - no composite index needed
    const snapshot = await collections.wholesaleProducts
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as WholesaleProduct[];
};

/**
 * Delete wholesale product
 * Only allowed if product is not locked
 */
export const deleteWholesaleProduct = async (id: string): Promise<void> => {
    const product = await getWholesaleProductById(id);

    if (product.isLocked) {
        throw new AppError(
            'Cannot delete locked product. Product has been used in orders.',
            403
        );
    }

    await collections.wholesaleProducts.doc(id).delete();
};
