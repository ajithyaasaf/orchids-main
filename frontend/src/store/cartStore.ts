import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductSize, PricingOption, AppliedCombo } from '@tntrends/shared';
import { comboApi, cartApi, ValidationResult } from '@/lib/api';
import { calculateItemTotal } from '@/lib/pricingUtils';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/trackingUtils';

/**
 * Represents an unavailable cart item (out of stock, product deleted, etc.)
 */
export interface UnavailableCartItem {
    productId: string;
    size: string;
    reason: 'PRODUCT_NOT_FOUND' | 'SIZE_OUT_OF_STOCK' | 'INSUFFICIENT_STOCK';
    message: string;
    maxAvailable?: number; // For INSUFFICIENT_STOCK case
}

interface CartStore {
    items: CartItem[];
    unavailableItems: UnavailableCartItem[];
    pricingOption: PricingOption | null;
    isCalculatingCombo: boolean;
    isSanitizing: boolean;
    lastSanitizedAt: number | null;

    // Actions
    addItem: (product: Product, size: ProductSize, quantity?: number) => void;
    removeItem: (productId: string, size: ProductSize) => void;
    updateQuantity: (productId: string, size: ProductSize, quantity: number) => void;
    clearCart: () => void;

    // Getters
    getTotalItems: () => number;
    getTotalPrice: () => number;
    getItemCount: (productId: string, size: ProductSize) => number;
    getValidItems: () => CartItem[];
    hasUnavailableItems: () => boolean;

    // Combo/Pricing
    calculateBestPrice: () => Promise<void>;
    getAppliedCombo: () => AppliedCombo | null;
    getSavings: () => number;

    // Sanitization
    sanitizeCart: () => Promise<UnavailableCartItem[]>;
    clearUnavailableItem: (productId: string, size: string) => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            unavailableItems: [],
            pricingOption: null,
            isCalculatingCombo: false,
            isSanitizing: false,
            lastSanitizedAt: null,

            addItem: (product, size, quantity = 1) => {
                set((state) => {
                    const existingItem = state.items.find(
                        (item) => item.product.id === product.id && item.size === size
                    );

                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.product.id === product.id && item.size === size
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            ),
                        };
                    }

                    return {
                        items: [...state.items, { product, size, quantity }],
                    };
                });

                // Track add to cart event
                trackAddToCart(product, size, quantity);

                // Recalculate combo pricing after adding item
                get().calculateBestPrice();
            },

            removeItem: (productId, size) => {
                // Find item before removing for tracking
                const itemToRemove = get().items.find(
                    (item) => item.product.id === productId && item.size === size
                );

                set((state) => ({
                    items: state.items.filter(
                        (item) => !(item.product.id === productId && item.size === size)
                    ),
                    // Also remove from unavailable items if present
                    unavailableItems: state.unavailableItems.filter(
                        (item) => !(item.productId === productId && item.size === size)
                    ),
                }));

                // Track remove from cart event
                if (itemToRemove) {
                    trackRemoveFromCart(itemToRemove.product, itemToRemove.size, itemToRemove.quantity);
                }

                // Recalculate combo pricing after removing item
                get().calculateBestPrice();
            },

            updateQuantity: (productId, size, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId, size);
                    return;
                }

                set((state) => ({
                    items: state.items.map((item) =>
                        item.product.id === productId && item.size === size
                            ? { ...item, quantity }
                            : item
                    ),
                }));

                // Recalculate combo pricing after quantity change
                get().calculateBestPrice();
            },

            clearCart: () => {
                set({ items: [], unavailableItems: [], pricingOption: null });
            },

            getTotalItems: () => {
                // Only count valid (available) items
                const validItems = get().getValidItems();
                return validItems.reduce((total, item) => total + item.quantity, 0);
            },

            getTotalPrice: () => {
                // Use combo pricing if available, otherwise calculate individual pricing
                const pricingOption = get().pricingOption;

                if (pricingOption) {
                    return pricingOption.total;
                }

                // Fallback: Calculate from valid items only
                const validItems = get().getValidItems();
                return validItems.reduce((total, item) => {
                    return total + calculateItemTotal(item.product, item.quantity);
                }, 0);
            },

            getValidItems: () => {
                const { items, unavailableItems } = get();
                // Filter out items that are marked as unavailable
                return items.filter(item =>
                    !unavailableItems.some(
                        u => u.productId === item.product.id && u.size === item.size
                    )
                );
            },

            hasUnavailableItems: () => {
                return get().unavailableItems.length > 0;
            },

            calculateBestPrice: async () => {
                const validItems = get().getValidItems();

                if (validItems.length === 0) {
                    set({ pricingOption: null });
                    return;
                }

                set({ isCalculatingCombo: true });

                try {
                    const response = await comboApi.calculate(validItems);
                    set({ pricingOption: response.data });
                } catch (error) {
                    console.error('Failed to calculate combo pricing:', error);
                    set({ pricingOption: null });
                } finally {
                    set({ isCalculatingCombo: false });
                }
            },

            getAppliedCombo: () => {
                const pricingOption = get().pricingOption;
                return pricingOption?.appliedCombo || null;
            },

            getSavings: () => {
                const pricingOption = get().pricingOption;
                return pricingOption?.savings || 0;
            },

            getItemCount: (productId, size) => {
                const item = get().items.find(
                    (item) => item.product.id === productId && item.size === size
                );
                return item ? item.quantity : 0;
            },

            /**
             * Validate cart items against database.
             * Marks items as unavailable instead of removing them.
             * Returns list of newly unavailable items.
             */
            sanitizeCart: async () => {
                const items = get().items;

                if (items.length === 0) {
                    set({ lastSanitizedAt: Date.now(), unavailableItems: [] });
                    return [];
                }

                set({ isSanitizing: true });

                try {
                    // Prepare validation request
                    const validationItems = items.map(item => ({
                        productId: item.product.id,
                        size: item.size,
                        quantity: item.quantity,
                    }));

                    // Call validation API
                    const response = await cartApi.validate(validationItems);

                    const newUnavailableItems: UnavailableCartItem[] = [];

                    // Process invalid items - mark as unavailable instead of removing
                    for (const invalid of response.invalid) {
                        newUnavailableItems.push({
                            productId: invalid.productId,
                            size: invalid.size,
                            reason: invalid.status as any,
                            message: invalid.message || 'Item no longer available',
                            maxAvailable: invalid.currentStock,
                        });
                    }

                    set({
                        unavailableItems: newUnavailableItems,
                        lastSanitizedAt: Date.now(),
                    });

                    // Recalculate pricing with only valid items
                    if (newUnavailableItems.length > 0) {
                        await get().calculateBestPrice();
                    }

                    return newUnavailableItems;

                } catch (error) {
                    console.error('Failed to sanitize cart:', error);
                    return [];
                } finally {
                    set({ isSanitizing: false });
                }
            },

            clearUnavailableItem: (productId, size) => {
                // Remove from both items and unavailable list
                set((state) => ({
                    items: state.items.filter(
                        (item) => !(item.product.id === productId && item.size === size)
                    ),
                    unavailableItems: state.unavailableItems.filter(
                        (item) => !(item.productId === productId && item.size === size)
                    ),
                }));
            },
        }),
        {
            name: 'tntrends-cart',
            partialize: (state) => ({
                items: state.items,
                pricingOption: state.pricingOption,
                lastSanitizedAt: state.lastSanitizedAt,
            }),
        }
    )
);

// Export types for compatibility
export type RemovedCartItem = UnavailableCartItem;
