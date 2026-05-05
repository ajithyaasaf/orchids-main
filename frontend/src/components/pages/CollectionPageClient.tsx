'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Collection, WholesaleProduct } from '@orchids/shared';
import { WholesaleProductCard } from '@/components/products/WholesaleProductCard';
import { Clock, Sparkles } from 'lucide-react';
import { getCloudinaryUrl } from '@/lib/cloudinaryImage';

interface CollectionPageClientProps {
    collection: Collection;
    products: WholesaleProduct[];
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
 * Client-side collection page component
 * Handles interactivity: sorting, filtering, countdown timer
 */
export const CollectionPageClient: React.FC<CollectionPageClientProps> = ({ collection, products }) => {
    // Note: Re-enabled basic sorting if needed later, but simplified for now
    const [timeRemaining, setTimeRemaining] = useState(
        collection.displaySettings.showCountdown && collection.endDate
            ? calculateTimeRemaining(collection.endDate)
            : null
    );

    // Pagination state
    const ITEMS_PER_PAGE = 12;
    const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);

    const paginatedProducts = useMemo(() => {
        return products.slice(0, visibleItems);
    }, [products, visibleItems]);

    const hasMore = visibleItems < products.length;

    const handleLoadMore = () => {
        setVisibleItems(prev => prev + ITEMS_PER_PAGE);
    };

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
                className={`relative h-[300px] md:h-[400px] bg-gradient-to-r ${getThemeClasses()}`}
            >
                {collection.bannerImage && (
                    <>
                        <Image
                            src={getCloudinaryUrl(collection.bannerImage.url, { width: 1920 })}
                            alt={collection.bannerImage.alt || collection.name}
                            fill
                            priority
                            className="object-cover opacity-60"
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </>
                )}

                <div className="relative container-custom h-full flex flex-col justify-center text-white z-10">
                    <div className="max-w-4xl">
                        {/* Collection Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md mb-4 border border-white/30">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <span className="text-sm font-semibold tracking-wide uppercase">Wholesale Collection</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-3 tracking-tight leading-tight">
                            {collection.name}
                        </h1>

                        {/* Tagline */}
                        {collection.tagline && (
                            <p className="text-lg md:text-2xl font-light text-white/90 mb-4 leading-relaxed">
                                {collection.tagline}
                            </p>
                        )}

                        {/* Description - truncated if too long */}
                        {collection.description && (
                            <p className="text-sm md:text-base text-white/80 max-w-2xl mb-6 line-clamp-2">
                                {collection.description}
                            </p>
                        )}

                        {/* Countdown Timer */}
                        {timeRemaining && (
                            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold font-mono leading-none">{String(timeRemaining.hours).padStart(2, '0')}</span>
                                    <span className="text-[10px] uppercase opacity-70">Hrs</span>
                                </div>
                                <span className="text-2xl font-bold -mt-3">:</span>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold font-mono leading-none">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                                    <span className="text-[10px] uppercase opacity-70">Mins</span>
                                </div>
                                <span className="text-2xl font-bold -mt-3">:</span>
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-bold font-mono leading-none">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                                    <span className="text-[10px] uppercase opacity-70">Secs</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="section py-12">
                <div className="container-custom">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Available Bundles</h2>
                            <p className="text-sm text-gray-500">
                                {products.length} {products.length === 1 ? 'bundle' : 'bundles'} listed
                            </p>
                        </div>
                    </div>

                    {/* Empty State */}
                    {products.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-soft">
                            <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                                <Sparkles className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No Bundles Found
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                This collection doesn't have any wholesale bundles yet. Please check back later or browse other categories.
                            </p>
                        </div>
                    )}

                    {/* Products Grid */}
                    {products.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedProducts.map(product => (
                                    <WholesaleProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="mt-12 text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        className="inline-flex items-center justify-center px-8 py-3 border border-primary text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all duration-300"
                                    >
                                        Load More Bundles
                                    </button>
                                    <p className="text-sm text-gray-400 mt-4">
                                        Showing {paginatedProducts.length} of {products.length} bundles
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};
