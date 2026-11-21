'use client';

import { useEffect } from 'react';
import { WholesaleProduct } from '@orchids/shared';
import { trackViewItem } from '@/lib/trackingUtils';

interface ProductViewTrackerProps {
    product: WholesaleProduct;
}

/**
 * ProductViewTracker Component
 * 
 * A silent Client Component that triggers ViewContent (Meta Pixel)
 * and view_item (GA4 / GTM) on mount without forcing parent Server Components
 * to convert to Client Components.
 */
export function ProductViewTracker({ product }: ProductViewTrackerProps) {
    useEffect(() => {
        if (product && product.id) {
            trackViewItem(product);
        }
    }, [product?.id]);

    return null;
}

