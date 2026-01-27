import { collections } from '../config/firebase';
import {
    Product,
    ProductFilters,
    ProductSortBy,
    StockBySize,
    ProductSize,
    MAX_TAGS_PER_PRODUCT,
    MAX_TAG_LENGTH,
} from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';
import { getProductPricing } from '../utils/pricingUtils';

/**
 * Product Service
 * 
 * Handles all product-related database operations with pricing integration
 */

/**
 * Enrich product data with pricing calculations
 * Applies discounts to basePrice, then adds shipping buffer
 */
const enrichProductWithPricing = (rawData: any): any => {
    // Create temp product object for pricing calculation
    const tempProduct = {
        ...rawData,
        basePrice: rawData.basePrice || rawData.price || 0,
    } as Product;

    // Get comprehensive pricing breakdown
    const pricing = getProductPricing(tempProduct);

    // Return enriched product data
    return {
        ...rawData,
        basePrice: pricing.basePrice,
        price: pricing.displayPrice,  // Backward compatibility
        displayPrice: pricing.displayPrice,
        originalDisplayPrice: pricing.originalDisplayPrice,
        discountedBasePrice: pricing.discountedBasePrice,
    };
};

/**
 * Normalize tags for consistency
 * - Capitalizes first letter of each word
 * - Trims whitespace
 * - Removes duplicates (case-insensitive)
 * - Limits to MAX_TAGS_PER_PRODUCT
 */
export const normalizeTags = (tags: string[]): string[] => {
    if (!tags || tags.length === 0) return [];

    const normalized = tags
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length <= MAX_TAG_LENGTH)
        .map(tag => {
            // Capitalize first letter of each word while preserving hyphens
            return tag.replace(/\b\w/g, char => char.toUpperCase());
        });

    // Remove duplicates (case-insensitive) and limit to max
    const uniqueTags = [...new Map(
        normalized.map(tag => [tag.toLowerCase(), tag])
    ).values()];

    return uniqueTags.slice(0, MAX_TAGS_PER_PRODUCT);
};

/**
 * Get all products with optional filtering and sorting
 */
export const getAllProducts = async (
    filters?: ProductFilters,
    sortBy?: ProductSortBy,
    limit: number = 50
): Promise<Product[]> => {
    try {
        let query: any = collections.products;

        // Apply Firestore filters (indexed fields only)
        if (filters?.category) {
            query = query.where('category', '==', filters.category);
        }

        if (filters?.inStock !== undefined) {
            query = query.where('inStock', '==', filters.inStock);
        }

        // Filter by styleCode (for color variants)
        const styleCode = (filters as any)?.styleCode;
        if (styleCode) {
            query = query.where('styleCode', '==', styleCode);
        }

        // Execute query
        const snapshot = await query.limit(limit).get();

        let products: Product[] = snapshot.docs.map((doc: any) => {
            const rawData = doc.data();
            const enrichedProduct = enrichProductWithPricing(rawData);

            return {
                id: doc.id,
                ...enrichedProduct,
                createdAt: rawData.createdAt?.toDate(),
            };
        });

        // Apply client-side filters (guarantees consistency across all filter combinations)

        // Tag filtering
        if (filters?.tags && filters.tags.length > 0) {
            products = products.filter(p =>
                filters.tags!.some(tag => p.tags?.includes(tag))
            );
        }

        // Price range
        if (filters?.minPrice !== undefined) {
            products = products.filter((p) => p.price >= filters.minPrice!);
        }

        if (filters?.maxPrice !== undefined) {
            products = products.filter((p) => p.price <= filters.maxPrice!);
        }

        // Size filtering
        if (filters?.sizes && filters.sizes.length > 0) {
            products = products.filter((p) =>
                filters.sizes!.some((size) => p.sizes.includes(size))
            );
        }

        // Search filtering (includes tags)
        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            products = products.filter(
                (p) =>
                    p.title.toLowerCase().includes(searchLower) ||
                    p.description.toLowerCase().includes(searchLower) ||
                    p.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
                    false
            );
        }

        // Exclude specific product ID
        const excludeId = (filters as any)?.excludeId;
        if (excludeId) {
            products = products.filter((p) => p.id !== excludeId);
        }

        // Apply sorting
        if (sortBy) {
            switch (sortBy) {
                case 'price_asc':
                    products.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    products.sort((a, b) => b.price - a.price);
                    break;
                case 'newest':
                    products.sort(
                        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                    );
                    break;
                case 'oldest':
                    products.sort(
                        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                    );
                    break;
            }
        }

        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new AppError('Failed to fetch products', 500);
    }
};

/**
 * Get single product by ID
 */
export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const doc = await collections.products.doc(id).get();

        if (!doc.exists) {
            return null;
        }

        const rawData = doc.data();
        const enrichedProduct = enrichProductWithPricing(rawData);

        return {
            id: doc.id,
            ...enrichedProduct,
            createdAt: rawData?.createdAt?.toDate(),
        } as Product;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw new AppError('Failed to fetch product', 500);
    }
};

/**
 * Create new product
 */
export const createProduct = async (
    productData: Omit<Product, 'id' | 'createdAt'>
): Promise<Product> => {
    try {
        const newProduct = {
            ...productData,
            tags: normalizeTags(productData.tags || []), // Normalize tags
            createdAt: new Date(),
        };

        const docRef = await collections.products.add(newProduct);
        const product = await getProductById(docRef.id);

        if (!product) {
            throw new AppError('Failed to create product', 500);
        }

        return product;
    } catch (error) {
        console.error('Error creating product:', error);
        throw new AppError('Failed to create product', 500);
    }
};

/**
 * Update existing product
 */
export const updateProduct = async (
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<Product> => {
    try {
        const productRef = collections.products.doc(id);
        const doc = await productRef.get();

        if (!doc.exists) {
            throw new AppError('Product not found', 404);
        }

        // Normalize tags if provided
        const normalizedUpdates = {
            ...updates,
            ...(updates.tags && { tags: normalizeTags(updates.tags) })
        };

        await productRef.update(normalizedUpdates);
        const updatedProduct = await getProductById(id);

        if (!updatedProduct) {
            throw new AppError('Failed to update product', 500);
        }

        return updatedProduct;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error updating product:', error);
        throw new AppError('Failed to update product', 500);
    }
};

/**
 * Delete product
 */
export const deleteProduct = async (id: string): Promise<void> => {
    try {
        const productRef = collections.products.doc(id);
        const doc = await productRef.get();

        if (!doc.exists) {
            throw new AppError('Product not found', 404);
        }

        await productRef.delete();
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error deleting product:', error);
        throw new AppError('Failed to delete product', 500);
    }
};

/**
 * Update stock for a specific size
 */
export const updateStock = async (
    productId: string,
    size: ProductSize,
    quantity: number
): Promise<void> => {
    try {
        const product = await getProductById(productId);

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const updatedStockBySize: StockBySize = {
            ...product.stockBySize,
            [size]: quantity,
        };

        // Check if any size has stock
        const hasStock = Object.values(updatedStockBySize).some((qty) => qty > 0);

        await updateProduct(productId, {
            stockBySize: updatedStockBySize,
            inStock: hasStock,
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error updating stock:', error);
        throw new AppError('Failed to update stock', 500);
    }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (
    category: string
): Promise<Product[]> => {
    return getAllProducts({ category });
};

/**
 * Get color variants for a specific product style (H&M Logic)
 */
export const getProductVariants = async (
    styleCode: string,
    excludeId: string,
    limit: number = 10
): Promise<Product[]> => {
    return getAllProducts({
        // @ts-ignore - styleCode and excludeId are dynamic filters
        styleCode,
        excludeId,
    } as any, undefined, limit);
};

/**
 * Get all unique tags grouped by category
 * Simple implementation - scans products (fine for < 1000 products)
 * TODO: Replace with tag cache collection when products > 1000
 */
export const getTagsByCategory = async (): Promise<Record<string, string[]>> => {
    try {
        const snapshot = await collections.products.get();
        const tagsByCategory: Record<string, Set<string>> = {
            Men: new Set(),
            Women: new Set(),
            Kids: new Set(),
        };

        snapshot.docs.forEach(doc => {
            const product = doc.data();
            const category = product.category;

            if (tagsByCategory[category] && product.tags) {
                product.tags.forEach((tag: string) => {
                    // Exclude gender tags from menu
                    if (!['Men', 'Women', 'Kids'].includes(tag)) {
                        tagsByCategory[category].add(tag);
                    }
                });
            }
        });

        return {
            Men: Array.from(tagsByCategory.Men).sort(),
            Women: Array.from(tagsByCategory.Women).sort(),
            Kids: Array.from(tagsByCategory.Kids).sort(),
        };
    } catch (error) {
        console.error('Error fetching tags by category:', error);
        return { Men: [], Women: [], Kids: [] };
    }
}; 
 