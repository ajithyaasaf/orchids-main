import express, { Request, Response, NextFunction } from 'express';
import { collections } from '../config/firebase';
import { AppError } from '../middleware/errorHandler';

const router = express.Router();

/**
 * Cart Item for validation request
 */
interface CartValidationItem {
    productId: string;
    size: string;
    quantity: number;
}

/**
 * Validation result for each item
 */
interface ValidationResult {
    productId: string;
    size: string;
    status: 'VALID' | 'PRODUCT_NOT_FOUND' | 'SIZE_OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'PRICE_CHANGED';
    message?: string;
    currentStock?: number;
    requestedQuantity?: number;
    currentPrice?: number;
    currentBasePrice?: number;
}

/**
 * @route   POST /api/cart/validate
 * @desc    Validate cart items against database (product existence, stock, price)
 * @access  Public
 * @body    { items: CartValidationItem[] }
 * @returns { valid: ValidationResult[], invalid: ValidationResult[] }
 */
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { items } = req.body as { items: CartValidationItem[] };

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(200).json({
                valid: [],
                invalid: [],
                message: 'No items to validate'
            });
        }

        const validItems: ValidationResult[] = [];
        const invalidItems: ValidationResult[] = [];

        // Batch fetch all products at once for efficiency
        const productIds = [...new Set(items.map(item => item.productId))];
        const productMap = new Map<string, any>();

        // Fetch products in parallel (batches of 10 for Firestore limits)
        const batchSize = 10;
        for (let i = 0; i < productIds.length; i += batchSize) {
            const batch = productIds.slice(i, i + batchSize);
            const promises = batch.map(async (productId) => {
                try {
                    const doc = await collections.products.doc(productId).get();
                    if (doc.exists) {
                        productMap.set(productId, { id: doc.id, ...doc.data() });
                    }
                } catch (error) {
                    console.error(`Failed to fetch product ${productId}:`, error);
                }
            });
            await Promise.all(promises);
        }

        // Validate each cart item
        for (const item of items) {
            const product = productMap.get(item.productId);

            // 1. Check if product exists
            if (!product) {
                invalidItems.push({
                    productId: item.productId,
                    size: item.size,
                    status: 'PRODUCT_NOT_FOUND',
                    message: 'This product is no longer available',
                    requestedQuantity: item.quantity
                });
                continue;
            }

            // 2. Check stock for specific size
            const stockBySize = product.stockBySize || {};
            const availableStock = stockBySize[item.size] ?? 0;

            if (availableStock === 0) {
                invalidItems.push({
                    productId: item.productId,
                    size: item.size,
                    status: 'SIZE_OUT_OF_STOCK',
                    message: `Size ${item.size} is out of stock`,
                    currentStock: 0,
                    requestedQuantity: item.quantity
                });
                continue;
            }

            // 3. Check if requested quantity exceeds available stock
            if (item.quantity > availableStock) {
                invalidItems.push({
                    productId: item.productId,
                    size: item.size,
                    status: 'INSUFFICIENT_STOCK',
                    message: `Only ${availableStock} units available`,
                    currentStock: availableStock,
                    requestedQuantity: item.quantity
                });
                continue;
            }

            // 4. Item is valid - return current price for sync
            validItems.push({
                productId: item.productId,
                size: item.size,
                status: 'VALID',
                currentStock: availableStock,
                currentPrice: product.price,
                currentBasePrice: product.basePrice
            });
        }

        res.status(200).json({
            valid: validItems,
            invalid: invalidItems,
            totalValid: validItems.length,
            totalInvalid: invalidItems.length
        });

    } catch (error) {
        next(error);
    }
});

export default router;
