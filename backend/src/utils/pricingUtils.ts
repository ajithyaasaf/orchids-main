import { Product, DiscountType } from '@tntrends/shared';
import { STANDARD_SHIPPING_BUFFER } from '../config/shippingConfig';

/**
 * Pricing Utilities (UPDATED)
 * 
 * Centralized pricing logic to ensure consistency across the application.
 * 
 * NEW BEHAVIOR: Discounts now apply to the FULL display price (basePrice + shipping buffer),
 * not just the basePrice. This ensures discount badges match actual customer savings.
 * 
 * Formula: finalPrice = (basePrice + shippingBuffer) × (1 - discount%)
 */

/**
 * Calculate discounted display price (discount applies to FULL display price)
 * 
 * IMPORTANT: Discount percentages/amounts apply to the final display price
 * (basePrice + shipping buffer), NOT just the basePrice. This ensures the
 * discount badge customers see matches the actual savings they receive.
 * 
 * @param displayPrice - The full display price (basePrice + shipping buffer)
 * @param discountType - Type of discount
 * @param discountValue - Value of discount
 * @returns Discounted display price
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
    return displayPrice; // 'none' or invalid
}

/**
 * Calculate final display price (basePrice + shipping buffer)
 * @param basePrice - The base product price
 * @returns Display price including shipping buffer
 */
export function calculateDisplayPrice(basePrice: number): number {
    return basePrice + STANDARD_SHIPPING_BUFFER;
}

/**
 * Get comprehensive pricing breakdown for a product
 * 
 * NEW BEHAVIOR: Discounts now apply to the display price (basePrice + shipping buffer)
 * instead of just the basePrice. This ensures discount badges accurately
 * reflect the percentage off the final customer price.
 * 
 * @param product - Product with pricing data
 * @returns Complete pricing breakdown
 */
export interface PricingBreakdown {
    basePrice: number;              // Original base price
    discountedBasePrice: number;    // Base price equivalent after discount
    displayPrice: number;           // Final price (after discount)
    originalDisplayPrice: number;   // Display price without discount
    discount: number;               // Actual discount amount
    hasDiscount: boolean;          // Whether discount is applied
}

export function getProductPricing(product: Product): PricingBreakdown {
    // Get base price (backward compatible)
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
 * Calculate item total for cart/checkout
 * @param product - Product
 * @param quantity - Quantity
 * @returns Total price for the item
 */
export function calculateItemTotal(product: Product, quantity: number): number {
    const pricing = getProductPricing(product);
    return pricing.displayPrice * quantity;
}

/**
 * Format price for display
 * @param price - Price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
    return `₹${Math.round(price)}`;
}
