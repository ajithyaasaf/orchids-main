'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowRight, AlertCircle, Layers } from 'lucide-react';
import { WholesaleProduct } from '@orchids/shared';
import {
    getCloudinaryUrl,
    PRODUCT_CARD_IMG_OPTS,
} from '@/lib/cloudinaryImage';

interface WholesaleProductCardProps {
    product: WholesaleProduct;
    priority?: boolean;
    className?: string;
}

/**
 * WholesaleProductCard
 *
 * UX Features:
 * 1. Auto-sliding images on hover — cycles through all uploaded bundle images
 *    so buyers instantly see the variety inside without clicking.
 * 2. "Assorted Mix" badge — shown when mixedColors is true, setting the
 *    expectation that this bundle contains multiple designs/colors.
 * 3. Dot indicators — show how many images exist and which one is active.
 *
 * Performance:
 * - The slide interval starts only on mouseenter and is cleared on mouseleave.
 *   Zero CPU usage when the card is idle.
 * - All images are served via Cloudinary CDN with f_auto, q_auto, w_400.
 */
export const WholesaleProductCard: React.FC<WholesaleProductCardProps> = ({
    product,
    priority = false,
    className = '',
}) => {
    const qty = product.bundleQty || 1;
    const piecePrice = Math.round((product.bundlePrice || 0) / qty);
    const isLowStock = product.inStock && (product.availableBundles || 0) < 10;

    // Build optimized Cloudinary URLs for all uploaded images
    const allImages = (product.images || [])
        .filter(Boolean)
        .map(img => getCloudinaryUrl(img, PRODUCT_CARD_IMG_OPTS));

    const hasMultipleImages = allImages.length > 1;
    const isAssortedMix = product.mixedColors === true;

    // ──────────────────────────────────────────────────────────────
    // Slideshow state — driven by hover events only
    // ──────────────────────────────────────────────────────────────
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const startSlideshow = React.useCallback(() => {
        if (!hasMultipleImages) return;
        // Clear any existing interval first (safety)
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % allImages.length);
        }, 900); // Cycle every 900ms — fast enough to feel alive, slow enough to see each image
    }, [hasMultipleImages, allImages.length]);

    const stopSlideshow = React.useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setCurrentIndex(0); // Reset to first image when mouse leaves
    }, []);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const currentImageSrc = allImages[currentIndex] || '';

    return (
        <Link
            href={`/product/${product.slug || product.id}`}
            className={`group flex flex-col h-full bg-white transition-all duration-300 ${className}`}
            onMouseEnter={startSlideshow}
            onMouseLeave={stopSlideshow}
        >
            {/* ── Image Container ────────────────────────────────── */}
            <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-100">
                {currentImageSrc ? (
                    <Image
                        src={currentImageSrc}
                        alt={`${product.title} - wholesale clothing bundle`}
                        fill
                        className="object-cover transition-opacity duration-300 ease-in-out"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        priority={priority}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <Package className="w-12 h-12 opacity-20" />
                    </div>
                )}

                {/* ── Top-left status badges ─────────────────────── */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {!product.inStock && (
                        <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                            Sold Out
                        </span>
                    )}
                    {isLowStock && (
                        <span className="bg-orange-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Low Stock
                        </span>
                    )}
                    {/* Assorted Mix badge — shown when bundle has multiple designs/colors */}
                    {isAssortedMix && (
                        <span className="bg-violet-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            Mix Design
                        </span>
                    )}
                </div>

                {/* ── Image dot indicators (shown on hover when multiple images exist) ── */}
                {hasMultipleImages && (
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {allImages.map((_, idx) => (
                            <span
                                key={idx}
                                className={`block w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                    idx === currentIndex
                                        ? 'bg-white scale-125 shadow-sm'
                                        : 'bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Content ────────────────────────────────────────── */}
            <div className="flex flex-col flex-1">
                {/* Category & bundle size */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {product.category || 'Wholesale'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        <Package className="w-3 h-3" />
                        <span>{product.bundleQty} Pcs/Bundle</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors min-h-[2.5rem]">
                    {product.title}
                </h3>

                {/* Price */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold font-heading text-gray-900">
                                ₹{(product.bundlePrice || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-gray-500">/ bundle</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                            ₹{piecePrice} per piece
                        </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
};
