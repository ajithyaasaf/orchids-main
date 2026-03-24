import React from 'react';
import { SearchPageClient } from '@/components/pages/SearchPageClient';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { type WholesaleProduct } from '@orchids/shared';

// Server Component for SEO
export default async function SearchPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    const initialQuery = searchParams.q || '';

    // Fetch securely on the server (using our newly minted HttpOnly cookie proxy architecture)
    let initialProducts: WholesaleProduct[] = [];
    try {
        initialProducts = await wholesaleProductsApi.getAll();
    } catch (e) {
        console.error('Failed to load initial search catalog', e);
    }

    return (
        <div className="container-custom section">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Search Products</h1>
            <SearchPageClient initialQuery={initialQuery} initialProducts={initialProducts} />
        </div>
    );
}
