'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Collection } from '@tntrends/shared';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';

interface CollectionShowcaseProps {
    collections: Collection[];
}

/**
 * Homepage Collection Showcase
 * Displays active collections as attractive cards
 * Performance-optimized with lazy loading and responsive images
 */
export const CollectionShowcase: React.FC<CollectionShowcaseProps> = ({ collections }) => {
    // Don't render if no collections
    if (collections.length === 0) return null;

    return (
        <section className="section bg-gradient-to-b from-gray-50 to-white">
            <div className="container-custom">
                {/* Section Header */}
                <div className="flex items-end justify-between mb-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-semibold uppercase tracking-wide">
                                Curated Collections
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-4">
                            Shop by Collection
                        </h2>
                        <p className="text-text-secondary text-lg">
                            Discover our handpicked selections and exclusive deals
                        </p>
                    </div>
                </div>

                {/* Collections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((collection, index) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                            priority={index < 3} // Priority loading for first 3 cards
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

/**
 * Individual Collection Card Component
 */
interface CollectionCardProps {
    collection: Collection;
    priority?: boolean;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, priority = false }) => {
    // Calculate if collection is ending soon (within 24 hours)
    const isEndingSoon = collection.endDate && collection.displaySettings.showCountdown
        ? new Date(collection.endDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
        : false;

    // Get theme-specific accent color
    const getAccentColor = () => {
        switch (collection.displaySettings.theme) {
            case 'winter': return 'from-blue-500 to-cyan-500';
            case 'summer': return 'from-orange-500 to-yellow-500';
            case 'flash': return 'from-red-500 to-pink-500';
            case 'clearance': return 'from-purple-500 to-indigo-500';
            default: return 'from-primary to-primary-dark';
        }
    };

    return (
        <Link
            href={`/collection/${collection.slug}`}
            className="group relative rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 h-[450px] md:h-[500px]"
        >
            {/* Background Image */}
            {collection.thumbnailImage ? (
                <div className="absolute inset-0">
                    <Image
                        src={collection.thumbnailImage.url}
                        alt={collection.thumbnailImage.alt || collection.name}
                        fill
                        priority={priority}
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity`} />
                </div>
            ) : (
                // Fallback gradient background
                <div className={`absolute inset-0 bg-gradient-to-br ${getAccentColor()}`} />
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {isEndingSoon && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold shadow-lg animate-pulse">
                        <Clock className="w-3 h-3" />
                        Ending Soon!
                    </div>
                )}
                {collection.displaySettings.theme !== 'default' && (
                    <div className="inline-flex px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                        {collection.displaySettings.theme.charAt(0).toUpperCase() + collection.displaySettings.theme.slice(1)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-8 z-10">
                {/* Tagline */}
                {collection.tagline && (
                    <p className="text-white/90 text-sm md:text-base mb-2 line-clamp-1">
                        {collection.tagline}
                    </p>
                )}

                {/* Collection Name */}
                <h3 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4 line-clamp-2 group-hover:text-primary-light transition-colors">
                    {collection.name}
                </h3>

                {/* Description (Desktop only) */}
                {collection.description && (
                    <p className="hidden md:block text-white/80 text-sm mb-6 line-clamp-2">
                        {collection.description}
                    </p>
                )}

                {/* CTA Button */}
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-white font-semibold group-hover:gap-3 transition-all">
                        <span>{collection.displaySettings.customCTA || 'Shop Collection'}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>

                    {/* Product Count if available */}
                    {/* <span className="text-white/70 text-sm">
                        {collection.productCount || 0} items
                    </span> */}
                </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors pointer-events-none" />
        </Link>
    );
};
