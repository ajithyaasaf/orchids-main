import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WholesaleProduct } from '@tntrends/shared';

/**
 * Wholesale Cart Store
 * Bundle-based shopping cart with dynamic GST fetching
 * Implements duplicate product merge fix
 */

interface BundleCartItem {
    product: WholesaleProduct;
    bundlesOrdered: number;
}

interface CartStore {
    items: BundleCartItem[];
    gstRate: number;
    isLoadingGST: boolean;

    // Cart operations
    addBundle: (product: WholesaleProduct, quantity: number) => void;
    updateBundleQty: (productId: string, quantity: number) => void;
    removeBundle: (productId: string) => void;
    clearCart: () => void;

    // Settings
    fetchGSTRate: () => Promise<void>;

    // Calculations
    getTotalBundles: () => number;
    getTotalPieces: () => number;
    getSubtotal: () => number;
    getGST: () => number;
    getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            gstRate: 0.18, // Default, will be fetched from API
            isLoadingGST: false,

            // Fetch GST rate from settings API
            fetchGSTRate: async () => {
                set({ isLoadingGST: true });
                try {
                    const response = await fetch('/api/settings');
                    const data = await response.json();

                    if (data.success) {
                        const settings = data.data;
                        set({ gstRate: settings.gstEnabled ? settings.gstRate : 0 });
                    }
                } catch (error) {
                    console.error('Failed to fetch GST rate:', error);
                    // Keep default 0.18
                } finally {
                    set({ isLoadingGST: false });
                }
            },

            // Add bundle with duplicate merge fix
            addBundle: (product, quantity) =>
                set((state) => {
                    const existing = state.items.find((i) => i.product.id === product.id);

                    if (existing) {
                        // Merge quantities if product already in cart
                        return {
                            items: state.items.map((i) =>
                                i.product.id === product.id
                                    ? { ...i, bundlesOrdered: i.bundlesOrdered + quantity }
                                    : i
                            ),
                        };
                    }

                    // Add new item
                    return {
                        items: [...state.items, { product, bundlesOrdered: quantity }],
                    };
                }),

            updateBundleQty: (productId, quantity) =>
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product.id === productId
                            ? { ...i, bundlesOrdered: Math.max(1, quantity) }
                            : i
                    ),
                })),

            removeBundle: (productId) =>
                set((state) => ({
                    items: state.items.filter((i) => i.product.id !== productId),
                })),

            clearCart: () => set({ items: [] }),

            getTotalBundles: () => {
                return get().items.reduce((sum, item) => sum + item.bundlesOrdered, 0);
            },

            getTotalPieces: () => {
                return get().items.reduce(
                    (sum, item) => sum + item.bundlesOrdered * item.product.bundleQty,
                    0
                );
            },

            getSubtotal: () => {
                return get().items.reduce(
                    (sum, item) => sum + item.bundlesOrdered * item.product.bundlePrice,
                    0
                );
            },

            getGST: () => {
                return get().getSubtotal() * get().gstRate;
            },

            getTotal: () => {
                return get().getSubtotal() + get().getGST();
            },
        }),
        {
            name: 'wholesale-cart',
            partialize: (state) => ({
                items: state.items,
                gstRate: state.gstRate,
            }),
        }
    )
);

// Initialize GST rate on app load (if running in browser)
if (typeof window !== 'undefined') {
    useCartStore.getState().fetchGSTRate();
}
