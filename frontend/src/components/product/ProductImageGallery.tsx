'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
    getCloudinaryUrl,
    PRODUCT_GALLERY_MAIN_OPTS,
    PRODUCT_GALLERY_THUMB_OPTS,
} from '@/lib/cloudinaryImage';

interface ProductImageGalleryProps {
    images: string[];
    title: string;
}

/**
 * Product Image Gallery Component
 *
 * Best-practice approach:
 *  - Only the active image + immediate neighbors are rendered in the DOM
 *  - Thumbnails use lazy loading (w_200, q_auto:eco)
 *  - Main image uses priority only for the first paint (LCP)
 *  - Smooth CSS crossfade between active image and the previous one
 */
export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    // Track the previous index to enable a crossfade transition
    const [prevIndex, setPrevIndex] = useState(0);

    const handleSelect = useCallback(
        (index: number) => {
            if (index === activeIndex) return;
            setPrevIndex(activeIndex);
            setActiveIndex(index);
        },
        [activeIndex]
    );

    if (images.length === 0) {
        return (
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
            </div>
        );
    }

    // Determine which indices to render in the main viewport.
    // Active + previous (for crossfade) + next neighbor (for preload).
    const renderSet = new Set<number>();
    renderSet.add(activeIndex);
    renderSet.add(prevIndex);
    if (activeIndex + 1 < images.length) renderSet.add(activeIndex + 1);
    if (activeIndex - 1 >= 0) renderSet.add(activeIndex - 1);

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:sticky lg:top-24">
            {/* Thumbnail Strip (Left Side — Desktop) */}
            {images.length > 1 && (
                <div className="hidden lg:flex flex-col gap-3 w-20 flex-shrink-0">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => handleSelect(index)}
                            aria-label={`View ${title} - image ${index + 1}`}
                            aria-pressed={activeIndex === index}
                            className={cn(
                                'relative aspect-[3/4] bg-white rounded-lg overflow-hidden border-2 transition-all',
                                activeIndex === index
                                    ? 'border-primary shadow-sm'
                                    : 'border-transparent hover:border-gray-200'
                            )}
                        >
                            <Image
                                src={getCloudinaryUrl(image, PRODUCT_GALLERY_THUMB_OPTS)}
                                alt={`${title} - view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="96px"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image Container — only renders active + neighbors */}
            <div className="relative flex-grow aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden shadow-soft border border-gray-100">
                {Array.from(renderSet).map((index) => (
                    <div
                        key={images[index]}
                        className={cn(
                            'absolute inset-0 transition-opacity duration-300 ease-in-out',
                            activeIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        )}
                        aria-hidden={activeIndex !== index}
                    >
                        <Image
                            src={getCloudinaryUrl(images[index], PRODUCT_GALLERY_MAIN_OPTS)}
                            alt={`${title} - view ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 60vw"
                            priority={index === 0}
                            loading={index === 0 ? undefined : 'lazy'}
                        />
                    </div>
                ))}
            </div>

            {/* Mobile Thumbnails (Below) */}
            {images.length > 1 && (
                <div className="flex lg:hidden gap-3 overflow-x-auto pb-4 mt-2 w-full no-scrollbar">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => handleSelect(index)}
                            aria-label={`View ${title} - image ${index + 1}`}
                            aria-pressed={activeIndex === index}
                            className={cn(
                                'relative w-20 aspect-[3/4] flex-shrink-0 bg-white rounded-lg overflow-hidden border-2 transition-all',
                                activeIndex === index ? 'border-primary' : 'border-gray-200'
                            )}
                        >
                            <Image
                                src={getCloudinaryUrl(image, PRODUCT_GALLERY_THUMB_OPTS)}
                                alt={`${title} view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                                loading="lazy"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
