import { ComboOffer, AppliedCombo, WholesaleProduct } from '@orchids/shared';
import { getAllActiveCombos, isComboActive } from './comboService';

export interface WholesaleCheckoutBundle {
    productId: string;
    product: WholesaleProduct;
    bundlesOrdered: number;
}

export interface PricingOption {
    type: 'individual' | 'combo';
    total: number;
    savings: number;
    appliedCombo?: AppliedCombo;
    breakdown?: string;
}

const calculateIndividualPricing = (items: WholesaleCheckoutBundle[]): number => {
    return items.reduce((total, item) => {
        return total + (item.product.bundlePrice * item.bundlesOrdered);
    }, 0);
};

const isEligibleForQuantityCombo = (items: WholesaleCheckoutBundle[], combo: ComboOffer): boolean => {
    const totalBundles = items.reduce((sum, item) => sum + item.bundlesOrdered, 0);
    return totalBundles >= combo.minimumQuantity;
};

export const validateComboStock = async (items: WholesaleCheckoutBundle[]): Promise<{
    valid: boolean;
    message?: string;
}> => {
    try {
        for (const item of items) {
            if (item.product.availableBundles < item.bundlesOrdered) {
                return {
                    valid: false,
                    message: `Insufficient stock for ${item.product.title}. Only ${item.product.availableBundles} bundles available.`
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

const findApplicableCombos = async (items: WholesaleCheckoutBundle[]): Promise<ComboOffer[]> => {
    try {
        const activeCombos = await getAllActiveCombos();

        return activeCombos.filter(combo => {
            if (combo.type === 'quantity_based') {
                return isEligibleForQuantityCombo(items, combo);
            }
            return false;
        });
    } catch (error: any) {
        console.error('Error finding applicable combos:', error);
        return [];
    }
};

export const calculateBestPrice = async (items: WholesaleCheckoutBundle[]): Promise<PricingOption> => {
    try {
        if (!items || items.length === 0) {
            return {
                type: 'individual',
                total: 0,
                savings: 0,
                breakdown: 'Empty cart'
            };
        }

        const originalTotal = calculateIndividualPricing(items);

        const individualOption: PricingOption = {
            type: 'individual',
            total: originalTotal,
            savings: 0,
            breakdown: 'Individual bundle pricing'
        };

        const applicableCombos = await findApplicableCombos(items);

        if (applicableCombos.length === 0) {
            return individualOption;
        }

        const comboOptions: PricingOption[] = applicableCombos.map(combo => {
            const totalBundles = items.reduce((sum, item) => sum + item.bundlesOrdered, 0);

            const comboCount = Math.floor(totalBundles / combo.minimumQuantity);
            const remainingBundles = totalBundles % combo.minimumQuantity;

            const comboTotal = comboCount * combo.comboPrice;

            let remainingTotal = 0;
            if (remainingBundles > 0) {
                let itemsToPrice = remainingBundles;
                for (const item of items) {
                    if (itemsToPrice <= 0) break;

                    const qtyToPrice = Math.min(item.bundlesOrdered, itemsToPrice);
                    remainingTotal += item.product.bundlePrice * qtyToPrice;
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
                breakdown: `${combo.name}: ${comboCount} combo(s) + ${remainingBundles} individual bundle(s)`
            };
        });

        const allOptions = [individualOption, ...comboOptions];
        return allOptions.reduce((best, current) =>
            current.total < best.total ? current : best
        );
    } catch (error: any) {
        console.error('Error calculating best price:', error);
        return {
            type: 'individual',
            total: calculateIndividualPricing(items),
            savings: 0,
            breakdown: 'Error calculating combos, using individual pricing'
        };
    }
};

export const validateComboAtCheckout = async (
    items: WholesaleCheckoutBundle[],
    comboId: string
): Promise<{
    valid: boolean;
    recalculatedPrice?: PricingOption;
    message?: string;
}> => {
    try {
        const { getComboById } = await import('./comboService');
        const combo = await getComboById(comboId);

        if (!combo || !isComboActive(combo)) {
            const newPricing = await calculateBestPrice(items);
            return {
                valid: false,
                recalculatedPrice: newPricing,
                message: 'This combo offer has expired or is no longer available.'
            };
        }

        const stockValidation = await validateComboStock(items);
        if (!stockValidation.valid) {
            const newPricing = await calculateBestPrice(items);
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
