import React from 'react';
import { SearchPageClient } from '@/components/pages/SearchPageClient';

// Server Component for SEO
export default async function SearchPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    const initialQuery = searchParams.q || '';

    return (
        <div className="container-custom section">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Search Products</h1>
            <SearchPageClient initialQuery={initialQuery} />
        </div>
    );
}
