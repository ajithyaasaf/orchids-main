'use client';

import React, { useState, useEffect } from 'react';
import { productApi } from '@/lib/api';
import type { Product, ProductSortBy } from '@tntrends/shared';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFiltersSidebar } from '@/components/products/ProductFilters';
import { ProductSortDropdown } from '@/components/products/ProductSortDropdown';
import { Filter } from 'lucide-react';
import { trackViewItemList } from '@/lib/trackingUtils';

interface CategoryPageClientProps {
    category: string;
    initialProducts: Product[];
}

export const CategoryPageClient: React.FC<CategoryPageClientProps> = ({
    category,
    initialProducts,
}) => {
    const [products, setProducts] = useState(initialProducts);
    const [sortBy, setSortBy] = useState<ProductSortBy>('newest');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        productApi.getTagsByCategory()
            .then(({ data }) => {
                const catKey = category.charAt(0).toUpperCase() + category.slice(1);
                setAvailableTags(data[catKey] || []);
            })
            .catch(() => { });
    }, [category]);

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    // Track view_item_list when products are displayed
    useEffect(() => {
        if (products.length > 0) {
            trackViewItemList(products, `${categoryName} Category`);
        }
    }, [products, categoryName]);

    // Client-side filtering and sorting
    const filteredProducts = products
        .filter(p => {
            // Price filter
            if (p.price < priceRange.min || p.price > priceRange.max) return false;

            // Size filter
            if (selectedSizes.length > 0) {
                if (!selectedSizes.some(size => p.sizes.includes(size as any))) return false;
            }

            // Tag filter
            if (selectedTags.length > 0) {
                if (!p.tags || !p.tags.some(t => selectedTags.includes(t))) return false;
            }

            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                default:
                    return 0;
            }
        });

    const toggleSize = (size: string) => {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setSelectedSizes([]);
        setSelectedTags([]);
        setPriceRange({ min: 0, max: 10000 });
    };

    return (
        <div className="container-custom section">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">{categoryName} Collection</h1>
                    <p className="text-text-secondary mt-2">{filteredProducts.length} products</p>
                </div>

                <div className="flex gap-4">
                    <ProductSortDropdown value={sortBy} onChange={setSortBy} />

                    {/* Filter Toggle (Mobile) */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="lg:hidden px-4 py-2 border border-border rounded-lg hover:border-primary transition"
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <ProductFiltersSidebar
                    selectedSizes={selectedSizes}
                    priceRange={priceRange}
                    onSizeToggle={toggleSize}
                    onPriceChange={setPriceRange}
                    onClearFilters={clearFilters}
                    showFilters={showFilters}
                    selectedTags={selectedTags}
                    onTagToggle={toggleTag}
                    availableTags={availableTags}
                />

                {/* Products Grid */}
                <div className="lg:col-span-3">
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-text-secondary text-lg">No products found matching your filters.</p>
                            <button
                                onClick={clearFilters}
                                className="text-primary hover:text-primary-dark mt-4"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
