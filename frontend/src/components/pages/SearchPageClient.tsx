'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { WholesaleProductCard } from '@/components/products/WholesaleProductCard';
import { type WholesaleProduct, PRODUCT_CATEGORIES } from '@orchids/shared';
import { Search, Filter } from 'lucide-react';
import Fuse from 'fuse.js';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * SearchPageClient - Wholesale Product Search
 * 
 * Clean Architecture Implementation:
 * - Client-side search for fast, responsive UX
 * - Debounced search to minimize CPU re-renders on mobile
 * - Fuzzy search (Fuse.js) for typo tolerance and relevance ranking
 * - URL Synchronization for deep linking and browser history
 */

interface SearchPageClientProps {
    initialQuery?: string;
    initialProducts: WholesaleProduct[];
}

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

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

export function SearchPageClient({ initialQuery = '', initialProducts = [] }: SearchPageClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize search term from URL query if available, otherwise fallback to prop
    const urlQuery = searchParams.get('q') || initialQuery;

    // ========================================
    // State Management
    // ========================================
    const [searchTerm, setSearchTerm] = useState(urlQuery);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest');
    const [isSearching, setIsSearching] = useState(false);

    // Pagination state
    const ITEMS_PER_PAGE = 12;
    const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);

    // Apply 300ms debounce to the search input
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Reset pagination when search term changes
    useEffect(() => {
        setVisibleItems(ITEMS_PER_PAGE);
    }, [debouncedSearchTerm, sortBy]);

    // ========================================
    // Fuse.js Initialization (Fuzzy Search)
    // ========================================
    const fuse = useMemo(() => {
        return new Fuse(initialProducts, {
            keys: [
                { name: 'title', weight: 2 },           // Title matches are most important
                { name: 'category', weight: 1.5 },      // Category matches
                { name: 'description', weight: 1 },     // Description matches
                // Search within sizes (bundle composition keys like 'S', 'M', 'L')
                {
                    name: 'sizes',
                    weight: 1,
                    getFn: (product: any) => Object.keys(product.bundleComposition)
                }
            ],
            threshold: 0.3,         // How fuzzy the match can be (0.0 = perfect, 1.0 = anything)
            ignoreLocation: true,   // Match anywhere in the string
            useExtendedSearch: true,
        });
    }, [initialProducts]);

    // ========================================
    // URL Synchronization Effect
    // ========================================
    useEffect(() => {
        // Only update the URL after the user finishes typing (using the debounced value)
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedSearchTerm) {
            params.set('q', debouncedSearchTerm);
        } else {
            params.delete('q');
        }

        // Push to router silently (scroll: false prevents jumping to top of page)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        setIsSearching(false);
    }, [debouncedSearchTerm, pathname, router, searchParams]);

    // Update local state if URL changes externally (like clicking "Back")
    useEffect(() => {
        const query = searchParams.get('q');
        if (query !== null && query !== debouncedSearchTerm) {
            setSearchTerm(query);
        }
    }, [searchParams, debouncedSearchTerm]);


    // ========================================
    // Computed Values
    // ========================================

    // Filter products using Fuse.js
    const filteredProducts = useMemo(() => {
        if (!debouncedSearchTerm.trim()) return initialProducts;

        // Fuse returns an array of { item: Product, refIndex: number, ... }
        const results = fuse.search(debouncedSearchTerm);
        return results.map((result: any) => result.item);
    }, [initialProducts, debouncedSearchTerm, fuse]);

    // Sort the filtered products
    const displayedProducts = useMemo(
        () => sortProducts(filteredProducts, sortBy),
        [filteredProducts, sortBy]
    );

    // ========================================
    // Event Handlers
    // ========================================

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsSearching(true); // Show a slight loading indication while typing
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value as typeof sortBy);
    };

    const handleLoadMore = () => {
        setVisibleItems(prev => prev + ITEMS_PER_PAGE);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Prevent form submission from reloading page, handled by reactivity
    };

    // ========================================
    // Render
    // ========================================

    return (
        <>
            {/* =================================== */}
            {/* SEARCH BAR */}
            {/* =================================== */}
            <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
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
                        {/* Loading Spinner for Debounce Feedback */}
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary"></div>
                            </div>
                        )}
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

            {debouncedSearchTerm ? (
                <SearchResults
                    searchTerm={debouncedSearchTerm}
                    products={displayedProducts}
                    visibleItems={visibleItems}
                    onLoadMore={handleLoadMore}
                />
            ) : (
                <EmptySearchState totalProducts={initialProducts.length} />
            )}
        </>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Search Results Component
 */
interface SearchResultsProps {
    searchTerm: string;
    products: WholesaleProduct[];
    visibleItems: number;
    onLoadMore: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ searchTerm, products, visibleItems, onLoadMore }) => {
    const paginatedProducts = useMemo(() => {
        return products.slice(0, visibleItems);
    }, [products, visibleItems]);

    const hasMore = visibleItems < products.length;

    return (
        <>
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
                <p className="text-gray-600">
                    Found <span className="font-bold text-gray-900">{products.length}</span> {products.length === 1 ? 'product' : 'products'} for "{searchTerm}"
                </p>
            </div>

            {/* Products Grid or Empty State */}
            {products.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedProducts.map((product) => (
                            <WholesaleProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="mt-12 text-center">
                            <button
                                onClick={onLoadMore}
                                className="inline-flex items-center justify-center px-8 py-3 border border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all duration-300"
                            >
                                Load More Results
                            </button>
                            <p className="text-sm text-gray-400 mt-4">
                                Showing {paginatedProducts.length} of {products.length} bundles
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No products found
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Try different keywords, check your spelling, or browse our categories.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        {PRODUCT_CATEGORIES.map(category => (
                            <a
                                key={category.id}
                                href={`/products?category=${category.id}`}
                                className="px-4 py-2 bg-primary-light text-primary rounded-lg hover:bg-pink-100 transition-colors text-sm font-medium"
                            >
                                Browse {category.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

/**
 * Empty Search State Component
 * Shown when no search query is entered
 */
interface EmptySearchStateProps {
    totalProducts: number;
}

const EmptySearchState: React.FC<EmptySearchStateProps> = ({ totalProducts }) => (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
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
                    PRODUCT_CATEGORIES[0]?.label.split(' ')[0].toLowerCase() || 'newborn',
                    (PRODUCT_CATEGORIES[1]?.label.split(' ')[0].toLowerCase() || 'girls') + ' ' + (PRODUCT_CATEGORIES[1]?.subcategories[0]?.label.split(' ')[0].toLowerCase() || 'dress'),
                    (PRODUCT_CATEGORIES[2]?.label.split(' ')[0].toLowerCase() || 'boys') + ' ' + (PRODUCT_CATEGORIES[2]?.subcategories[0]?.label.split(' ')[0].toLowerCase() || 'shirt'),
                    (PRODUCT_CATEGORIES[3]?.label.split(' ')[0].toLowerCase() || 'women') + ' ' + (PRODUCT_CATEGORIES[3]?.subcategories[0]?.label.split(' ')[0].toLowerCase() || 'kurti'),
                    'size M',
                    '3-6 months'
                ].filter(Boolean).map((example, index) => (
                    <button
                        key={`${example}-${index}`}
                        onClick={() => {
                            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                            if (searchInput) {
                                searchInput.value = example;
                                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }}
                        className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs hover:border-primary hover:bg-primary-light transition-colors shadow-sm"
                    >
                        {example}
                    </button>
                ))}
            </div>
        </div>
    </div>
);