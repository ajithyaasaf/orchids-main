import { CartItem, ComboOffer, AppliedCombo, PricingOption } from '@tntrends/shared';
import { getAllActiveCombos, isComboActive } from './comboService';
import { getProductById } from './productService';
import { getProductPricing } from '../utils/pricingUtils';

/**
 * Combo Pricing Service - Best price calculation engine
 * 
 * Design Pattern: Strategy Pattern
 * - Each combo type has its own validation strategy
 * - Easy to add new combo types in Path 2
 * - Keeps cart logic clean and focused
 */

/**
 * Calculate final price after individual product discounts
 */
const calculateIndividualPricing = (cartItems: CartItem[]): number => {
    return cartItems.reduce((total, item) => {
        const pricing = getProductPricing(item.product);
        // Use displayPrice which includes shipping buffer and discounts
        return total + (pricing.displayPrice * item.quantity);
    }, 0);
};

/**
 * Calculate original price without any discounts (MRP total)
 */
const calculateOriginalPrice = (cartItems: CartItem[]): number => {
    return cartItems.reduce((total, item) => {
        const pricing = getProductPricing(item.product);
        // Use originalDisplayPrice which includes shipping buffer but no discounts
        return total + (pricing.originalDisplayPrice * item.quantity);
    }, 0);
};


/**
 * Check if cart is eligible for a quantity-based combo
 */
const isEligibleForQuantityCombo = (cartItems: CartItem[], combo: ComboOffer): boolean => {
    // For MVP: Simple quantity check
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return totalItems >= combo.minimumQuantity;
};

/**
 * Validate stock availability for combo
 * Ensures all items in cart have sufficient stock
 */
export const validateComboStock = async (cartItems: CartItem[]): Promise<{
    valid: boolean;
    message?: string;
}> => {
    try {
        for (const item of cartItems) {
            const stockForSize = item.product.stockBySize[item.size];

            if (!stockForSize || stockForSize < item.quantity) {
                return {
                    valid: false,
                    message: `Insufficient stock for ${item.product.title} (Size: ${item.size}). Only ${stockForSize || 0} available.`
                };
            }
        }

        return { valid: true };
    } catch (error: any) {
        return {
            valid: false,
            message: `Stock validation failed: ${error.message}`
        };
    }
};

/**
 * Find all applicable combos for current cart
 */
const findApplicableCombos = async (cartItems: CartItem[]): Promise<ComboOffer[]> => {
    try {
        const activeCombos = await getAllActiveCombos();

        return activeCombos.filter(combo => {
            // MVP: Only handle quantity_based combos
            if (combo.type === 'quantity_based') {
                return isEligibleForQuantityCombo(cartItems, combo);
            }

            // Path 2: Add more combo type handlers here
            // if (combo.type === 'category_based') { ... }
            // if (combo.type === 'bundle') { ... }

            return false;
        });
    } catch (error: any) {
        console.error('Error finding applicable combos:', error);
        return [];
    }
};

/**
 * Calculate best pricing option for cart
 * Compares individual pricing vs all applicable combos
 * Returns the option that saves user the most money
 */
export const calculateBestPrice = async (cartItems: CartItem[]): Promise<PricingOption> => {
    try {
        if (!cartItems || cartItems.length === 0) {
            return {
                type: 'individual',
                total: 0,
                savings: 0,
                breakdown: 'Empty cart'
            };
        }

        // Option 1: Individual pricing (with product discounts)
        const individualTotal = calculateIndividualPricing(cartItems);
        const originalTotal = calculateOriginalPrice(cartItems);

        const individualOption: PricingOption = {
            type: 'individual',
            total: individualTotal,
            savings: originalTotal - individualTotal,
            breakdown: 'Individual product pricing with discounts'
        };

        // Find applicable combos
        const applicableCombos = await findApplicableCombos(cartItems);

        if (applicableCombos.length === 0) {
            return individualOption;
        }

        // Option 2+: Combo pricing
        // For each combo, calculate total and compare
        const comboOptions: PricingOption[] = applicableCombos.map(combo => {
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

            // Calculate how many full combos we can make
            const comboCount = Math.floor(totalItems / combo.minimumQuantity);
            const remainingItems = totalItems % combo.minimumQuantity;

            // Price for combo items
            const comboTotal = comboCount * combo.comboPrice;

            // Price for remaining items (use individual pricing)
            let remainingTotal = 0;
            if (remainingItems > 0) {
                // Take first N items for remaining calculation
                let itemsToPrice = remainingItems;
                for (const item of cartItems) {
                    if (itemsToPrice <= 0) break;

                    const qtyToPrice = Math.min(item.quantity, itemsToPrice);
                    const pricing = getProductPricing(item.product);

                    // Use displayPrice which includes discounts and shipping buffer
                    remainingTotal += pricing.displayPrice * qtyToPrice;
                    itemsToPrice -= qtyToPrice;
                }
            }

            const finalTotal = comboTotal + remainingTotal;

            return {
                type: 'combo' as const,
                total: finalTotal,
                savings: originalTotal - finalTotal,
                appliedCombo: {
                    comboId: combo.id,
                    comboName: combo.name,
                    comboPrice: combo.comboPrice,
                    originalPrice: originalTotal,
                    savings: originalTotal - finalTotal,
                    appliedAt: new Date(),
                    itemCount: comboCount * combo.minimumQuantity
                },
                breakdown: `${combo.name}: ${comboCount} combo(s) + ${remainingItems} individual item(s)`
            };
        });

        // Find best option (lowest total price)
        const allOptions = [individualOption, ...comboOptions];
        const bestOption = allOptions.reduce((best, current) =>
            current.total < best.total ? current : best
        );

        return bestOption;
    } catch (error: any) {
        console.error('Error calculating best price:', error);

        // Fallback to individual pricing on error
        return {
            type: 'individual',
            total: calculateIndividualPricing(cartItems),
            savings: 0,
            breakdown: 'Error calculating combos, using individual pricing'
        };
    }
};

/**
 * Re-validate combo at checkout
 * Ensures combo is still active and stock is available
 */
export const validateComboAtCheckout = async (
    cartItems: CartItem[],
    comboId: string
): Promise<{
    valid: boolean;
    recalculatedPrice?: PricingOption;
    message?: string;
}> => {
    try {
        const { getComboById } = await import('./comboService');
        const combo = await getComboById(comboId);

        // Check if combo still exists and is active
        if (!combo || !isComboActive(combo)) {
            const newPricing = await calculateBestPrice(cartItems);
            return {
                valid: false,
                recalculatedPrice: newPricing,
                message: 'This combo offer has expired or is no longer available.'
            };
        }

        // Validate stock
        const stockValidation = await validateComboStock(cartItems);
        if (!stockValidation.valid) {
            const newPricing = await calculateBestPrice(cartItems);
            return {
                valid: false,
                recalculatedPrice: newPricing,
                message: stockValidation.message
            };
        }

        return { valid: true };
    } catch (error: any) {
        return {
            valid: false,
            message: `Validation failed: ${error.message}`
        };
    }
};
