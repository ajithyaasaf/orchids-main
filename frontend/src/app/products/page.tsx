import { Metadata } from 'next';
import Link from 'next/link';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { Breadcrumbs } from '@/components/seo/StructuredData';
import { ProductsGrid } from '@/components/products/ProductsGrid';
import { Button } from '@/components/ui/Button';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { FilterSidebarClient } from './FilterSidebarClient';
import { ProductsClientWrapper } from './ProductsClientWrapper';

/**
 * Products Browse Page - SEO Optimized
 * Server-side rendered product catalog with sidebar filtering
 */

export const metadata: Metadata = {
    title: 'Wholesale Clothing Products',
    description: 'Browse our complete selection of wholesale clothing bundles. Baby wear, kids clothing, women\'s apparel from Tirupur. Bundle pricing for bulk orders.',
};

interface ProductsPageProps {
    searchParams: {
        category?: string;
        tag?: string | string[]; // Can be string or array
    };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    // 1. Parse Search Params
    const selectedCategory = searchParams.category;
    const tags = typeof searchParams.tag === 'string'
        ? [searchParams.tag]
        : Array.isArray(searchParams.tag)
            ? searchParams.tag
            : [];

    // 2. Fetch Data
    let products: Awaited<ReturnType<typeof wholesaleProductsApi.getAll>> = [];

    try {
        const allProducts = await wholesaleProductsApi.getAll();

        // 3. Filter Data
        products = allProducts.filter((p) => {
            // Category Filter
            if (selectedCategory && p.category !== selectedCategory) {
                return false;
            }

            // Tag Filter (check if product has ANY of the selected tags)
            // Ideally: AND logic or OR logic? 
            // Usually "Red" OR "Blue" (OR logic for same group), but we are doing global tags.
            // Let's implement OR logic: if any selected tag matches any product tag
            if (tags.length > 0) {
                if (!p.tags) return false;

                // We need to normalize tags for comparison (jubba-sets vs Jubba Sets)
                // Assuming API returns slugs or we normalize here.
                // The FilterSidebar sends values like 'jubba', 'rompers'.
                // The product tags might be 'Jubba Sets'.
                // We need a robust matching strategy. For MVP, simple substring/includes check.

                const lowerProductTags = p.tags.map(t => t.toLowerCase());
                const matchesTag = tags.some(tag =>
                    lowerProductTags.some(pt => pt.includes(tag.toLowerCase()))
                );

                if (!matchesTag) return false;
            }

            return true;
        });

    } catch (error) {
        console.error('Failed to fetch products:', error);
        products = [];
    }

    const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
    ];

    if (selectedCategory) {
        breadcrumbItems.push({
            name: selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1),
            url: `/products?category=${selectedCategory}`,
        });
    }

    return (
        <main className="min-h-screen bg-white">
            <div className="border-b border-gray-100 bg-gray-50/50">
                <div className="container-custom py-4">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
            </div>

            <div className="container-custom py-8">
                <ProductsClientWrapper>
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* FILTER SIDEBAR - Handles mobile/desktop internally */}
                        <FilterSidebarClient />

                        {/* MAIN CONTENT */}
                        <div className="flex-1">

                            {/* Header */}
                            <div className="mb-8">
                                <h1 className="text-3xl font-heading font-bold text-gray-900">
                                    {selectedCategory
                                        ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Collection`
                                        : 'All Products'}
                                </h1>
                                <p className="text-gray-500 mt-1">
                                    {products.length} {products.length === 1 ? 'Result' : 'Results'} found
                                </p>
                            </div>

                            {/* Active Filters (Chips) - Optional: visual confirmation */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                                            {tag.replace('-', ' ')}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Products Grid */}
                            {products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                                        <Filter className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                                        Try adjusting your filters or browsing a different category to find what you're looking for.
                                    </p>
                                    <Link href="/products">
                                        <Button variant="outline">Clear Filters</Button>
                                    </Link>
                                </div>
                            ) : (
                                <ProductsGrid products={products} />
                            )}
                        </div>
                    </div>
                </ProductsClientWrapper>
            </div>
        </main>
    );
}
