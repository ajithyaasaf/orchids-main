'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { CollectionWithProducts, ProductSortBy } from '@tntrends/shared';
import { ProductCard } from '@/components/products/ProductCard';
import { Clock, Sparkles } from 'lucide-react';

interface CollectionPageClientProps {
    collection: CollectionWithProducts;
}

/**
 * Calculate time remaining until collection expires
 */
function calculateTimeRemaining(endDate: Date): { hours: number; minutes: number; seconds: number } | null {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
}

/**
 * Sort products based on selected criteria
 */
function sortProducts(products: CollectionWithProducts['products'], sortBy: ProductSortBy) {
    const sorted = [...products];

    switch (sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => (a.basePrice || a.price) - (b.basePrice || b.price));
        case 'price-high':
            return sorted.sort((a, b) => (b.basePrice || b.price) - (a.basePrice || a.price));
        case 'newest':
            return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        case 'popular':
            // TODO: Implement popularity metric (views, purchases, etc.)
            return sorted;
        default:
            return sorted;
    }
}

/**
 * Client-side collection page component
 * Handles interactivity: sorting, filtering, countdown timer
 */
export const CollectionPageClient: React.FC<CollectionPageClientProps> = ({ collection }) => {
    const [sortBy, setSortBy] = useState<ProductSortBy>('newest');
    const [timeRemaining, setTimeRemaining] = useState(
        collection.displaySettings.showCountdown && collection.endDate
            ? calculateTimeRemaining(collection.endDate)
            : null
    );

    // Memoize sorted products for performance
    const sortedProducts = useMemo(
        () => sortProducts(collection.products, sortBy),
        [collection.products, sortBy]
    );

    // Update countdown timer every second
    React.useEffect(() => {
        if (!collection.displaySettings.showCountdown || !collection.endDate) return;

        const interval = setInterval(() => {
            const remaining = calculateTimeRemaining(collection.endDate!);
            setTimeRemaining(remaining);

            if (!remaining) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [collection.displaySettings.showCountdown, collection.endDate]);

    // Get theme-specific classes
    const getThemeClasses = () => {
        switch (collection.displaySettings.theme) {
            case 'winter':
                return 'from-blue-600 to-cyan-600';
            case 'summer':
                return 'from-orange-500 to-yellow-500';
            case 'flash':
                return 'from-red-600 to-pink-600';
            case 'clearance':
                return 'from-purple-600 to-indigo-600';
            default:
                return 'from-primary to-primary-dark';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner */}
            <section
                className={`relative h-[400px] md:h-[500px] bg-gradient-to-r ${getThemeClasses()}`}
            >
                {collection.bannerImage && (
                    <>
                        <Image
                            src={collection.bannerImage.url}
                            alt={collection.bannerImage.alt || collection.name}
                            fill
                            priority
                            className="object-cover opacity-80"
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                    </>
                )}

                <div className="relative container-custom h-full flex flex-col justify-center text-white z-10">
                    <div className="max-w-3xl">
                        {/* Collection Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">Collection</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
                            {collection.name}
                        </h1>

                        {/* Tagline */}
                        {collection.tagline && (
                            <p className="text-xl md:text-2xl lg:text-3xl mb-6 text-white/90">
                                {collection.tagline}
                            </p>
                        )}

                        {/* Description */}
                        {collection.description && (
                            <p className="text-base md:text-lg text-white/80 max-w-2xl mb-8">
                                {collection.description}
                            </p>
                        )}

                        {/* Countdown Timer */}
                        {timeRemaining && (
                            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-4 rounded-full">
                                <Clock className="w-5 h-5" />
                                <div className="flex items-center gap-2 font-mono text-lg font-semibold">
                                    <span>{String(timeRemaining.hours).padStart(2, '0')}</span>
                                    <span>:</span>
                                    <span>{String(timeRemaining.minutes).padStart(2, '0')}</span>
                                    <span>:</span>
                                    <span>{String(timeRemaining.seconds).padStart(2, '0')}</span>
                                </div>
                                <span className="text-sm">left</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="section py-12">
                <div className="container-custom">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <p className="text-lg font-medium text-gray-900">
                                {sortedProducts.length} {sortedProducts.length === 1 ? 'Product' : 'Products'}
                            </p>
                            <p className="text-sm text-gray-600">
                                Showing all available items
                            </p>
                        </div>

                        {/* Sorting temporarily disabled for wholesale */}
                        {/* <ProductSort sortBy={sortBy} onSortChange={setSortBy} /> */}
                    </div>

                    {/* Empty State */}
                    {sortedProducts.length === 0 && (
                        <div className="text-center py-16">
                            <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                                <Sparkles className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No Products Available
                            </h3>
                            <p className="text-gray-600">
                                This collection doesn't have any products yet. Check back soon!
                            </p>
                        </div>
                    )}

                    {/* Products Grid */}
                    {sortedProducts.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {sortedProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Associated Coupon Banner */}
            {collection.associatedCoupon && (
                <section className="section py-8 bg-gradient-to-r from-primary/10 to-primary-dark/10">
                    <div className="container-custom">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white rounded-2xl shadow-sm border border-primary/20">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    💰 Exclusive Discount Available!
                                </h3>
                                <p className="text-gray-600">
                                    Use code <span className="font-mono font-bold text-primary">{collection.associatedCoupon}</span> at checkout
                                </p>
                            </div>
                            <button
                                onClick={() => navigator.clipboard.writeText(collection.associatedCoupon!)}
                                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                            >
                                Copy Code
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
