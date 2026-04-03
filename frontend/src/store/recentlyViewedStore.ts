import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RecentlyViewedStore {
    productIds: string[];
    addView: (productId: string) => void;
    clearHistory: () => void;
}

/**
 * Recently Viewed Products Store
 * 
 * Uses Zustand with Persistence Middleware to store the last 12 viewed products
 * in the user's browser localStorage.
 */
export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
    persist(
        (set) => ({
            productIds: [],

            /**
             * Adds a product ID to the recently viewed list.
             * Implements deduplication (moves existing to front) 
             * and a strict capacity limit of 12 items.
             */
            addView: (productId: string) => {
                set((state) => {
                    // Filter out the ID if it already exists (to move it to the front)
                    const filtered = state.productIds.filter((id) => id !== productId);
                    
                    // Add to the beginning and keep only the latest 12
                    const newIds = [productId, ...filtered].slice(0, 12);
                    
                    return { productIds: newIds };
                });
            },

            /**
             * Clears the entire browsing history (Privacy best practice)
             */
            clearHistory: () => set({ productIds: [] }),
        }),
        {
            name: 'orchids-recently-viewed',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
