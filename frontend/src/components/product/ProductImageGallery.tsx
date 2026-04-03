'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
    images: string[];
    title: string;
}

/**
 * Product Image Gallery Component
 * Client-side component that handles interactive thumbnail switching
 */
export function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (images.length === 0) {
        return (
            <div className="aspect-[4/5] bg-gray-100 rounded-2xl flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:sticky lg:top-24">
            {/* Thumbnail Strip (Left Side - Desktop) */}
            {images.length > 1 && (
                <div className="hidden lg:flex flex-col gap-3 w-20 flex-shrink-0">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                                "relative aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all",
                                activeIndex === index ? "border-primary shadow-sm" : "border-transparent hover:border-gray-200"
                            )}
                        >
                            <Image
                                src={image}
                                alt={`${title} - view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="96px"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image Container */}
            <div className="relative flex-grow aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden shadow-soft">
                <Image
                    src={images[activeIndex]}
                    alt={`${title} - view ${activeIndex + 1}`}
                    fill
                    className="object-cover transition-all duration-500 ease-in-out"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    quality={95}
                />
            </div>

            {/* Mobile Thumbnails (Below) */}
            {images.length > 1 && (
                <div className="flex lg:hidden gap-3 overflow-x-auto pb-4 mt-2 w-full no-scrollbar">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                                "relative w-20 aspect-square flex-shrink-0 bg-white rounded-lg overflow-hidden border-2 transition-all",
                                activeIndex === index ? "border-primary" : "border-gray-200"
                            )}
                        >
                            <Image
                                src={image}
                                alt={`${title} view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
