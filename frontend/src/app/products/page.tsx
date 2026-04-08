import { Metadata } from 'next';
import Link from 'next/link';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { Breadcrumbs } from '@/components/seo/StructuredData';
import { WholesaleProductCard } from '@/components/products/WholesaleProductCard';
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
        size?: string | string[]; // Can be string or array
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
            
    const sizes = typeof searchParams.size === 'string'
        ? [searchParams.size]
        : Array.isArray(searchParams.size)
            ? searchParams.size
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
            if (tags.length > 0) {
                if (!p.tags) return false;

                const matchesTag = tags.some(tag => p.tags?.includes(tag));

                if (!matchesTag) return false;
            }

            // Size Filter (check if product has ANY of the selected sizes in its bundle composition)
            if (sizes.length > 0) {
                if (!p.bundleComposition) return false;
                
                const productSizes = Object.keys(p.bundleComposition);
                const matchesSize = sizes.some(size => productSizes.includes(size));

                if (!matchesSize) return false;
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

                            {/* Active Filters (Chips) */}
                            {(tags.length > 0 || sizes.length > 0) && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {tags.map(tag => (
                                        <span key={`tag-${tag}`} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                                            {tag.replace(/-/g, ' ')}
                                        </span>
                                    ))}
                                    {sizes.map(size => (
                                        <span key={`size-${size}`} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-sm font-medium">
                                            Size: {size}
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.map((product) => (
                                        <WholesaleProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ProductsClientWrapper>
            </div>
        </main>
    );
}
