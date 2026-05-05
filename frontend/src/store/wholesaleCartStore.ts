import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WholesaleProduct } from '@orchids/shared';

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
            gstRate: 0.05, // Default changed from 0.18
            isLoadingGST: false,
 
            // Fetch GST rate from settings API
            fetchGSTRate: async () => {
                set({ isLoadingGST: true });
                try {
                    // Use consistent API base for all settings calls
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
                    const response = await fetch(`${apiUrl}/settings`);
                    const data = await response.json();
 
                    if (data.success) {
                        const settings = data.data;
                        // Still set global rate for fallback, but main logic is now dynamic
                        set({ gstRate: settings.gstEnabled ? (settings.gstRate || 0.05) : 0 });
                    }
                } catch (error) {
                    console.error('Failed to fetch GST rate:', error);
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
                const items = get().items;
                return items.reduce((sum, item) => {
                    const pricePerPiece = item.product.bundlePrice / item.product.bundleQty;
                    const itemGstRate = pricePerPiece > 2500 ? 0.18 : 0.05;
                    return sum + (item.bundlesOrdered * item.product.bundlePrice * itemGstRate);
                }, 0);
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
