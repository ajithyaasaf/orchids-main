'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { WholesaleProductCard } from '@/components/products/WholesaleProductCard';
import { WholesaleProduct } from '@orchids/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProductCarouselProps {
    products: WholesaleProduct[];
    title: string;
    subtitle?: string;
}

export function ProductCarousel({ products, title, subtitle }: ProductCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            align: 'start',
            loop: true,
            skipSnaps: false,
            dragFree: true
        },
        [Autoplay({ delay: 4000, stopOnInteraction: true })]
    );

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (!products || products.length === 0) return null;

    return (
        <section className="section bg-white overflow-hidden">
            <div className="container-custom">
                <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-heading font-bold text-text-primary mb-3">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-lg text-text-secondary">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={scrollPrev}
                            className="rounded-full border-gray-200 hover:border-primary hover:text-primary aspect-square p-2"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={scrollNext}
                            className="rounded-full border-gray-200 hover:border-primary hover:text-primary aspect-square p-2"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Embla Viewport */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex space-x-4 md:space-x-8 -ml-4 pl-4 py-4">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="flex-[0_0_80%] sm:flex-[0_0_45%] lg:flex-[0_0_23%] relative"
                            >
                                <WholesaleProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
