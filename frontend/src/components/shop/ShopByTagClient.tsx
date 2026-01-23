'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Product, ProductSortBy } from '@tntrends/shared';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFiltersSidebar } from '@/components/products/ProductFilters';
import { ProductSortDropdown } from '@/components/products/ProductSortDropdown';
import { Filter } from 'lucide-react';
import { slugToTag, tagToSlug } from '@tntrends/shared';
import { trackViewItemList } from '@/lib/trackingUtils';

interface ShopByTagClientProps {
    tagSlug: string;
    initialProducts: Product[];
    initialCategory?: string;
}

export const ShopByTagClient: React.FC<ShopByTagClientProps> = ({
    tagSlug,
    initialProducts,
    initialCategory,
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [products] = useState(initialProducts);
    const [sortBy, setSortBy] = useState<ProductSortBy>('newest');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        initialCategory ? [initialCategory] : []
    );
    const [showFilters, setShowFilters] = useState(false);

    const tagName = slugToTag(tagSlug);

    // Track view_item_list when products are displayed
    useEffect(() => {
        if (products.length > 0) {
            const listName = initialCategory
                ? `${tagName} for ${initialCategory}`
                : `Shop ${tagName}`;
            trackViewItemList(products, listName);
        }
    }, [products, tagName, initialCategory]);

    // Client-side filtering and sorting
    const filteredProducts = products
        .filter(p => {
            // Price filter
            if (p.price < priceRange.min || p.price > priceRange.max) return false;

            // Size filter
            if (selectedSizes.length > 0) {
                if (!selectedSizes.some(size => p.sizes.includes(size as any))) return false;
            }

            // Category (Gender) filter
            if (selectedCategories.length > 0) {
                if (!selectedCategories.includes(p.category)) return false;
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

    const toggleCategory = (category: string) => {
        setSelectedCategories(prev => {
            const newCategories = prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category];

            // Update URL when category filter changes
            const params = new URLSearchParams(searchParams.toString());
            if (newCategories.length === 1) {
                params.set('category', newCategories[0]);
            } else {
                params.delete('category');
            }
            router.replace(`/shop/${tagSlug}${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });

            return newCategories;
        });
    };

    const clearFilters = () => {
        setSelectedSizes([]);
        setSelectedCategories([]);
        setPriceRange({ min: 0, max: 10000 });
    };

    return (
        <div className="container-custom section">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">
                        {initialCategory ? `${tagName} for ${initialCategory}` : `Shop ${tagName}`}
                    </h1>
                    <p className="text-text-secondary mt-2">
                        {filteredProducts.length} products found
                    </p>
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
                    // Gender Filter Props
                    selectedCategories={selectedCategories}
                    onCategoryToggle={toggleCategory}
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
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <p className="text-text-secondary text-lg">
                                No products found matching your filters.
                            </p>
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-primary font-medium hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
