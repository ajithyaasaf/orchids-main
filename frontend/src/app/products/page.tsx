import { Metadata } from 'next';
import Link from 'next/link';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { Breadcrumbs } from '@/components/seo/StructuredData';
import { ProductsGrid } from '@/components/products/ProductsGrid';
import { Filter } from 'lucide-react';

/**
 * Products Browse Page - SEO Optimized
 * Server-side rendered product catalog with category filtering
 * 
 * Features:
 * - Server-side rendering for SEO crawlers
 * - Category-based filtering
 * - Automatic sorting (newest first)
 * - Responsive grid layout
 * - Breadcrumb navigation
 */

export const metadata: Metadata = {
    title: 'Wholesale Clothing Products',
    description: 'Browse our complete selection of wholesale clothing bundles. Baby wear, kids clothing, women\'s apparel from Tirupur. Bundle pricing for bulk orders. GST included.',
    keywords: [
        'wholesale clothing products',
        'buy wholesale clothing',
        'bulk apparel',
        'Tirupur wholesale catalog',
    ],
    openGraph: {
        title: 'Wholesale Clothing Catalog | ORCHID',
        description: 'Browse wholesale clothing bundles - Baby wear, kids clothing, women\'s apparel',
    },
};

interface ProductsPageProps {
    searchParams: {
        category?: string;
    };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    // Fetch products on server for SEO
    let products: Awaited<ReturnType<typeof wholesaleProductsApi.getAll>> = [];
    const selectedCategory = searchParams.category;

    try {
        const allProducts = await wholesaleProductsApi.getAll();

        // Filter by category if specified
        products = selectedCategory
            ? allProducts.filter((p) => p.category === selectedCategory)
            : allProducts;
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

    // Category filter options (based on ORCHID clothing categories)
    const categories = [
        { value: 'newborn', label: 'Newborn Collection' },
        { value: 'girls', label: 'Girls Wear' },
        { value: 'boys', label: 'Boys Wear' },
        { value: 'women', label: 'Women\'s Apparel' },
    ];

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-6 py-8">
                {/* Breadcrumbs */}
                <Breadcrumbs items={breadcrumbItems} />

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {selectedCategory
                            ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Collection`
                            : 'All Wholesale Products'}
                    </h1>
                    <p className="text-lg text-gray-600">
                        Browse our complete selection of wholesale clothing bundles. All prices include
                        GST. Minimum order: 1 bundle.
                    </p>
                </div>

                {/* Category Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Filter by Category</h2>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/products"
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${!selectedCategory
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Products
                        </Link>
                        {categories.map((cat) => (
                            <Link
                                key={cat.value}
                                href={`/products?category=${cat.value}`}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === cat.value
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.label}
                            </Link>
                        ))}
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Showing{' '}
                            <span className="font-semibold text-gray-900">{products.length}</span>{' '}
                            {products.length === 1 ? 'product' : 'products'}
                            {selectedCategory && (
                                <span>
                                    {' '}
                                    in{' '}
                                    <span className="font-semibold">
                                        {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                                    </span>
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Products Grid */}
                {products.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">
                            No products found{selectedCategory && ` in ${selectedCategory} category`}
                        </p>
                        {selectedCategory && (
                            <Link
                                href="/products"
                                className="text-primary font-semibold hover:underline"
                            >
                                View all products
                            </Link>
                        )}
                    </div>
                ) : (
                    <ProductsGrid products={products} />
                )}
            </div>
        </main>
    );
}
