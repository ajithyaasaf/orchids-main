'use client';

import React, { useState, useEffect } from 'react';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { ProductsGrid } from '@/components/products/ProductsGrid';
import type { WholesaleProduct } from '@tntrends/shared';
import { Search, Filter } from 'lucide-react';

/**
 * SearchPageClient - Wholesale Product Search
 * 
 * Clean Architecture Implementation:
 * - Client-side search for fast, responsive UX
 * - Debounced search to minimize re-renders
 * - Separation of search logic from presentation
 * - Optimized filtering with multiple criteria
 * 
 * Search Criteria:
 * - Product title
 * - Category
 * - Description (if available)
 */

interface SearchPageClientProps {
    initialQuery?: string;
}

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

/**
 * Performs client-side search filtering on wholesale products
 * Searches across: title, category, and bundle composition
 */
const filterProducts = (
    products: WholesaleProduct[],
    searchQuery: string
): WholesaleProduct[] => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase().trim();

    return products.filter((product) => {
        // Search in product title
        if (product.title.toLowerCase().includes(query)) return true;

        // Search in category
        if (product.category?.toLowerCase().includes(query)) return true;

        // Search in sizes (bundle composition keys)
        if (Object.keys(product.bundleComposition).some(size =>
            size.toLowerCase().includes(query)
        )) return true;

        return false;
    });
};

/**
 * Sort products based on criteria
 */
const sortProducts = (
    products: WholesaleProduct[],
    sortBy: 'newest' | 'oldest' | 'price_asc' | 'price_desc'
): WholesaleProduct[] => {
    const sorted = [...products];

    switch (sortBy) {
        case 'price_asc':
            return sorted.sort((a, b) => a.bundlePrice - b.bundlePrice);
        case 'price_desc':
            return sorted.sort((a, b) => b.bundlePrice - a.bundlePrice);
        case 'oldest':
            return sorted.sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        case 'newest':
        default:
            return sorted.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
    }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SearchPageClient({ initialQuery = '' }: SearchPageClientProps) {
    // ========================================
    // State Management
    // ========================================

    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [allProducts, setAllProducts] = useState<WholesaleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');

    // ========================================
    // Data Fetching
    // ========================================

    /**
     * Load all wholesale products on component mount
     * Search is performed client-side for instant results
     */
    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const products = await wholesaleProductsApi.getAll();
                setAllProducts(products);
            } catch (error) {
                console.error('Failed to load products for search:', error);
                setAllProducts([]);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []); // Run once on mount

    // ========================================
    // Computed Values
    // ========================================

    // Filter products based on search term
    const filteredProducts = React.useMemo(
        () => filterProducts(allProducts, searchTerm),
        [allProducts, searchTerm]
    );

    // Sort the filtered products
    const displayedProducts = React.useMemo(
        () => sortProducts(filteredProducts, sortBy),
        [filteredProducts, sortBy]
    );

    // ========================================
    // Event Handlers
    // ========================================

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value as typeof sortBy);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Search is reactive, but form submit can trigger focus loss
    };

    // ========================================
    // Render
    // ========================================

    return (
        <>
            {/* =================================== */}
            {/* SEARCH BAR */}
            {/* =================================== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search wholesale products, categories, sizes..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            aria-label="Search products"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2 md:w-auto">
                        <Filter className="w-5 h-5 text-gray-400 hidden md:inline" />
                        <select
                            value={sortBy}
                            onChange={handleSortChange}
                            className="w-full md:w-auto px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
                            aria-label="Sort products"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>
                </form>
            </div>

            {/* =================================== */}
            {/* SEARCH RESULTS */}
            {/* =================================== */}

            {loading ? (
                <LoadingState />
            ) : searchTerm ? (
                <SearchResults
                    searchTerm={searchTerm}
                    products={displayedProducts}
                />
            ) : (
                <EmptySearchState totalProducts={allProducts.length} />
            )}
        </>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Loading State Component
 */
const LoadingState: React.FC = () => (
    <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary mb-4"></div>
        <p className="text-gray-500">Loading products...</p>
    </div>
);

/**
 * Search Results Component
 */
interface SearchResultsProps {
    searchTerm: string;
    products: WholesaleProduct[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ searchTerm, products }) => (
    <>
        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
                Found <span className="font-bold text-gray-900">{products.length}</span> {products.length === 1 ? 'product' : 'products'} for "{searchTerm}"
            </p>
        </div>

        {/* Products Grid or Empty State */}
        {products.length > 0 ? (
            <ProductsGrid products={products} />
        ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No products found
                </h3>
                <p className="text-gray-500 mb-4">
                    Try different keywords or browse our categories
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {['Newborn', 'Girls', 'Boys', 'Women'].map(category => (
                        <a
                            key={category}
                            href={`/products?category=${category.toLowerCase()}`}
                            className="px-4 py-2 bg-primary-light text-primary rounded-lg hover:bg-pink-100 transition-colors text-sm font-medium"
                        >
                            Browse {category}
                        </a>
                    ))}
                </div>
            </div>
        )}
    </>
);

/**
 * Empty Search State Component
 * Shown when no search query is entered
 */
interface EmptySearchStateProps {
    totalProducts: number;
}

const EmptySearchState: React.FC<EmptySearchStateProps> = ({ totalProducts }) => (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Start Your Search
        </h3>
        <p className="text-gray-500 mb-4">
            Enter a product name, category, or size to search {totalProducts} wholesale products
        </p>
        <div className="max-w-md mx-auto mt-6 p-4 bg-primary-light/50 rounded-lg border border-pink-100">
            <p className="text-sm text-gray-700 mb-2 font-medium">💡 Search Examples:</p>
            <div className="flex flex-wrap justify-center gap-2">
                {[
                    'newborn',
                    'girls dress',
                    'boys shirt',
                    'women kurti',
                    'size M',
                    '3-6 months'
                ].map(example => (
                    <button
                        key={example}
                        onClick={() => {
                            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                            if (searchInput) {
                                searchInput.value = example;
                                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }}
                        className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs hover:border-primary hover:bg-primary-light transition-colors"
                    >
                        {example}
                    </button>
                ))}
            </div>
        </div>
    </div>
);
