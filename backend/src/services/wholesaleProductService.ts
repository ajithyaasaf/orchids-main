import { collections } from '../config/firebase';
import { WholesaleProduct } from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';

/**
 * Wholesale Product Service
 * Handles CRUD operations for wholesale products
 * Enforces bundle validation and price locking
 */

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

    const newProduct = {
        ...productData,
        totalPieces: productData.availableBundles * productData.bundleQty,
        inStock: productData.availableBundles > 0,
        isLocked: false,
        mixedColors: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await collections.products.add(newProduct);
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
    const productDoc = await collections.products.doc(id).get();

    if (!productDoc.exists) {
        throw new AppError('Product not found', 404);
    }

    const product = productDoc.data() as WholesaleProduct;

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

    await collections.products.doc(id).update({
        ...updates,
        updatedAt: new Date(),
    });
};

/**
 * Get wholesale product by ID
 */
export const getWholesaleProductById = async (id: string): Promise<WholesaleProduct> => {
    const doc = await collections.products.doc(id).get();

    if (!doc.exists) {
        throw new AppError('Product not found', 404);
    }

    return { id: doc.id, ...doc.data() } as WholesaleProduct;
};

/**
 * Get all wholesale products
 * Returns only products with wholesale schema structure
 */
export const getAllWholesaleProducts = async (): Promise<WholesaleProduct[]> => {
    const snapshot = await collections.products
        .where('bundleQty', '>=', 1) // Filter for wholesale products
        .orderBy('createdAt', 'desc') // Sort by newest first
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

    await collections.products.doc(id).delete();
};
