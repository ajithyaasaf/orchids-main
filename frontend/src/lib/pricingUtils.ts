import { Product, DiscountType } from '@tntrends/shared';
import { STANDARD_SHIPPING_BUFFER } from '@/lib/constants';

/**
 * Frontend Pricing Utilities
 * 
 * Mirror of backend pricing logic for client-side calculations.
 * Ensures consistency between frontend and backend pricing.
 */

export interface PricingBreakdown {
    basePrice: number;
    discountedBasePrice: number;
    displayPrice: number;
    originalDisplayPrice: number;
    discount: number;
    hasDiscount: boolean;
}

/**
 * Calculate discounted display price (discount applies to FULL display price)
 * 
 * IMPORTANT: Discount percentages/amounts apply to the final display price
 * (basePrice + shipping buffer), NOT just the basePrice. This ensures the
 * discount badge customers see matches the actual savings they receive.
 * 
 * Example: 10% discount on product with basePrice ₹100:
 * - Display price: ₹100 + ₹79 = ₹179
 * - 10% discount: ₹179 × 0.1 = ₹17.90
 * - Final price: ₹179 - ₹17.90 = ₹161.10
 */
export function calculateDiscountedDisplayPrice(
    displayPrice: number,
    discountType: DiscountType,
    discountValue: number
): number {
    if (discountType === 'percentage') {
        return displayPrice * (1 - discountValue / 100);
    } else if (discountType === 'flat') {
        return Math.max(0, displayPrice - discountValue);
    }
    return displayPrice;
}

/**
 * Calculate display price (base + shipping buffer)
 */
export function calculateDisplayPrice(basePrice: number): number {
    return basePrice + STANDARD_SHIPPING_BUFFER;
}

/**
 * Get complete pricing breakdown for a product
 * 
 * NEW BEHAVIOR: Discounts now apply to the display price (basePrice + ₹79)
 * instead of just the basePrice. This ensures discount badges accurately
 * reflect the percentage off the final customer price.
 */
export function getProductPricing(product: Product): PricingBreakdown {
    const basePrice = product.basePrice || product.price || 0;

    // Calculate original display price (before discount)
    const originalDisplayPrice = calculateDisplayPrice(basePrice);

    // Apply discount to FULL display price
    const displayPrice = calculateDiscountedDisplayPrice(
        originalDisplayPrice,
        product.discountType || 'none',
        product.discountValue || 0
    );

    // Calculate the actual discount amount
    const discountAmount = originalDisplayPrice - displayPrice;

    // For backwards compatibility, calculate what the basePrice would be
    // after removing the shipping buffer from the discounted display price
    const discountedBasePrice = displayPrice - STANDARD_SHIPPING_BUFFER;

    return {
        basePrice,
        discountedBasePrice,
        displayPrice,
        originalDisplayPrice,
        discount: discountAmount,
        hasDiscount: displayPrice < originalDisplayPrice,
    };
}

/**
 * Calculate total for cart item
 */
export function calculateItemTotal(product: Product, quantity: number): number {
    const pricing = getProductPricing(product);
    return pricing.displayPrice * quantity;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
    return `₹${Math.round(price)}`;
}

/**
 * Check if product has ANY size in stock
 * Computes from stockBySize instead of relying on inStock field
 */
export function isProductInStock(product: Product): boolean {
    if (!product.stockBySize) return false;

    return Object.values(product.stockBySize).some(stock => stock > 0);
}

/**
 * Get total stock across all sizes
 */
export function getTotalStock(product: Product): number {
    if (!product.stockBySize) return 0;

    return Object.values(product.stockBySize).reduce((sum, stock) => sum + stock, 0);
}

/**
 * Get count of available sizes (sizes with stock > 0)
 */
export function getAvailableSizesCount(product: Product): number {
    if (!product.stockBySize) return 0;

    return Object.values(product.stockBySize).filter(stock => stock > 0).length;
}
