'use client';

import { useEffect } from 'react';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';

interface RecentlyViewedTrackerProps {
    productId: string;
}

/**
 * RecentlyViewedTracker Component
 * 
 * A "silent" Client Component responsible for recording a product view.
 * Kept separate to maintain the parent Product Page as a Server Component.
 */
export const RecentlyViewedTracker: React.FC<RecentlyViewedTrackerProps> = ({ productId }) => {
    const addView = useRecentlyViewedStore((state) => state.addView);

    useEffect(() => {
        if (productId) {
            addView(productId);
        }
    }, [productId, addView]);

    // This component is functional only, renders nothing
    return null;
};
