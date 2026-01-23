import { collections } from '../config/firebase';
import {
    CheckoutItem,
    CheckoutCalculatedItem,
    CheckoutCalculationResponse,
    ShippingCheckResponse,
    Product,
    Order,
} from '@tntrends/shared';
import {
    TIER_1_PREFIXES,
    SHIPPING_RATES,
    STANDARD_SHIPPING_BUFFER,
    ShippingTier,
} from '../config/shippingConfig';
import { getProductById } from './productService';
import { AppError } from '../middleware/errorHandler';
import {
    validateIndianPincode,
    isSouthIndiaPincode,
    sanitizePincode,
} from '../utils/pincodeValidator';
import { getProductPricing } from '../utils/pricingUtils';

/**
 * Shipping Service
 * 
 * Handles all shipping-related calculations for the Hybrid Bundled + Location-Based strategy
 * with FREE delivery above ₹1499 for non-South India regions
 * 
 * Key Principles:
 * - Never trust client-provided prices
 * - Always compute displayPrice from basePrice server-side
 * - Validate stock before calculating prices
 * - Block international orders (India-only delivery)
 * - Discounts handled via coupon codes (code-only system)
 * 
 * Shipping Logic:
 * - South India: Always FREE
 * - Rest of India: FREE above ₹1499, else ₹60
 * - International: BLOCKED
 */

export class ShippingService {
    // FREE shipping threshold for non-South India (configurable)
    private readonly FREE_SHIPPING_THRESHOLD = 1499;

    /**
     * Determine shipping tier based on pincode
     */
    private getTier(pincode: string): ShippingTier {
        if (!pincode || pincode.length < 3) {
            return 'TIER_2'; // Default to Tier 2 for invalid pincodes
        }

        const prefix = pincode.substring(0, 3);
        return TIER_1_PREFIXES.includes(prefix) ? 'TIER_1' : 'TIER_2';
    }

    /**
     * Validate pincode and check if it's Indian
     * @throws AppError if pincode is invalid or international
     */
    private validatePincode(pincode: string): void {
        // Sanitize input
        const sanitized = sanitizePincode(pincode);

        // Validate Indian pincode
        const validation = validateIndianPincode(sanitized);

        if (!validation.isValid || !validation.isIndian) {
            throw new AppError(validation.message, 400);
        }
    }

    /**
     * Get display price for a product
     * Now uses centralized pricing utility to ensure consistency
     */
    private getDisplayPrice(product: Product): number {
        const pricing = getProductPricing(product);
        return pricing.displayPrice;
    }

    /**
     * Check pincode and return shipping information
     * Used for product page pincode checker
     */
    async checkPincode(pincode: string): Promise<ShippingCheckResponse> {
        // Validate pincode (throws error if invalid/international)
        this.validatePincode(pincode);

        const tier = this.getTier(pincode);
        const rate = SHIPPING_RATES[tier];

        return {
            pincode,
            tier,
            shippingFee: rate.SURCHARGE,
            shippingLabel: rate.LABEL,
            estimatedDays: rate.ESTIMATED_DAYS,
            isServiceable: true, // MVP: All Indian pincodes are serviceable
        };
    }

    /**
     * Calculate cart total with shipping and discounts
     * This is the authoritative pricing calculation - never trust client data
     */
    async calculateCartTotal(
        items: CheckoutItem[],
        pincode: string,
        userId: string
    ): Promise<CheckoutCalculationResponse> {
        // 1. Validate pincode (throws error if invalid/international)
        this.validatePincode(pincode);

        // 2. Fetch all products and validate stock
        const calculatedItems: CheckoutCalculatedItem[] = [];
        let subtotal = 0;

        for (const item of items) {
            // Fetch product from database
            const product = await getProductById(item.productId);

            if (!product) {
                throw new AppError(`Product not found: ${item.productId}`, 404);
            }

            // Validate stock availability
            const availableStock = product.stockBySize[item.size] || 0;

            if (availableStock < item.quantity) {
                throw new AppError(
                    `Insufficient stock for ${product.title} (Size: ${item.size}). Available: ${availableStock}, Requested: ${item.quantity}`,
                    400
                );
            }

            // Calculate display price (server-side, never trust client)
            const displayPrice = this.getDisplayPrice(product);
            const lineTotal = displayPrice * item.quantity;

            calculatedItems.push({
                productId: product.id,
                title: product.title,
                size: item.size,
                color: item.color || product.color,
                displayPrice,
                quantity: item.quantity,
                lineTotal,
            });

            subtotal += lineTotal;
        }

        // 3. Determine shipping tier and calculate fee
        const tier = this.getTier(pincode);
        const rate = SHIPPING_RATES[tier];

        // Apply FREE shipping logic:
        // - South India (Tier 1): Always FREE
        // - Rest of India (Tier 2): FREE if subtotal >= ₹1499, else ₹60
        let shippingFee = 0;

        if (tier === 'TIER_1') {
            // South India: Always FREE
            shippingFee = 0;
        } else {
            // Rest of India: Check threshold
            if (subtotal >= this.FREE_SHIPPING_THRESHOLD) {
                shippingFee = 0; // FREE delivery
            } else {
                shippingFee = rate.SURCHARGE; // ₹60
            }
        }

        // 4. Calculate final total (no auto-discount - use coupon codes instead)
        const discount = 0;  // Discounts now handled via coupon codes
        const finalTotal = Math.max(0, subtotal + shippingFee - discount);

        // 5. Determine shipping label
        let shippingLabel = rate.LABEL;
        if (tier === 'TIER_2' && shippingFee === 0) {
            // FREE delivery achieved via threshold
            shippingLabel = 'FREE Delivery (Order above ₹1499)';
        }

        return {
            items: calculatedItems,
            subtotal,
            shippingFee,
            shippingLabel,
            discount,
            discountLabel: null,  // No auto-discount
            finalTotal,
            isTier1: tier === 'TIER_1',
            couponCode: undefined,  // Coupons applied separately
        };
    }
}

// Export singleton instance
export const shippingService = new ShippingService();
