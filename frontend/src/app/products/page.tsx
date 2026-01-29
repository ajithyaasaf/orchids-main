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
                <div className="flex flex-col items-center text-center mb-12 max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4 tracking-tight">
                        {selectedCategory
                            ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Collection`
                            : 'Wholesale Collection'}
                    </h1>
                    <p className="text-lg text-gray-500 leading-relaxed">
                        Curated bundles for the modern retailer. Premium quality, GST included, and designed for high margin.
                    </p>
                </div>

                {/* Category Filter - Premium Tabs */}
                <div className="mb-10">
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            href="/products"
                            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 border ${!selectedCategory
                                ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/20'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                                }`}
                        >
                            All Products
                        </Link>
                        {categories.map((cat) => (
                            <Link
                                key={cat.value}
                                href={`/products?category=${cat.value}`}
                                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 border ${selectedCategory === cat.value
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                                    }`}
                            >
                                {cat.label}
                            </Link>
                        ))}
                    </div>

                    {/* Results Count (Subtle) */}
                    <p className="text-center text-xs text-gray-400 mt-6 uppercase tracking-widest font-medium">
                        Showing {products.length} {products.length === 1 ? 'Style' : 'Styles'}
                    </p>
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
