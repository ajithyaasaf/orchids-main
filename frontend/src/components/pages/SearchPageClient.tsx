'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { productApi } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import { Product, ProductSortBy, tagToSlug } from '@tntrends/shared';
import { Search, Tag } from 'lucide-react';
import { trackViewItemList } from '@/lib/trackingUtils';

interface SearchPageClientProps {
    initialQuery?: string;
}

export function SearchPageClient({ initialQuery = '' }: SearchPageClientProps) {
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState<ProductSortBy>('newest');

    useEffect(() => {
        if (searchTerm) {
            handleSearch();
        }
    }, [searchTerm, sortBy]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const { data } = await productApi.getAll({
                search: searchTerm,
                sortBy,
                limit: 100,
            });
            setProducts(data);

            // Track search results view
            if (data && data.length > 0) {
                trackViewItemList(data, `Search Results: "${searchTerm}"`);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch();
    };

    // Helper to find which tags matched the search query
    const getMatchedTags = (product: Product): string[] => {
        if (!product.tags || !searchTerm) return [];
        const searchLower = searchTerm.toLowerCase();
        return product.tags.filter(tag => tag.toLowerCase().includes(searchLower));
    };

    return (
        <>
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-soft p-6 mb-8">
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search for products, categories, or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as ProductSortBy)}
                        className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                    </select>
                </form>
            </div>

            {/* Results */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-text-secondary">Searching...</p>
                </div>
            ) : searchTerm ? (
                <>
                    <p className="text-text-secondary mb-6">
                        Found <span className="font-semibold text-text-primary">{products.length}</span> results for "{searchTerm}"
                    </p>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((product) => {
                                const matchedTags = getMatchedTags(product);
                                return (
                                    <div key={product.id} className="relative">
                                        <ProductCard product={product} />

                                        {/* Show matched tags if any */}
                                        {matchedTags.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Tag className="w-3 h-3" />
                                                    <span>Found in:</span>
                                                </div>
                                                {matchedTags.map(tag => (
                                                    <Link
                                                        key={tag}
                                                        href={`/shop/${tagToSlug(tag)}`}
                                                        className="text-xs bg-cyan-50 text-primary px-2 py-1 rounded-full border border-cyan-200 hover:bg-cyan-100 transition-colors"
                                                    >
                                                        {tag}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl shadow-soft">
                            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-text-primary mb-2">
                                No products found
                            </h3>
                            <p className="text-text-secondary">
                                Try different keywords or browse our categories
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-soft">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                        Start searching
                    </h3>
                    <p className="text-text-secondary mb-4">
                        Enter a product name, category, or tag to start searching
                    </p>
                    <p className="text-xs text-gray-400">
                        💡 Try searching: "Shirts", "Formal", "Cotton", "Winter"
                    </p>
                </div>
            )}
        </>
    );
}
