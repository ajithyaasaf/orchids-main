'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Dummy data for collections
const collections = [
    {
        id: 'newborn',
        title: 'Newborn Collection',
        image: '/11.png',
        href: '/products?category=newborn'
    },
    {
        id: 'girls',
        title: 'Girls Wear',
        image: '/11.png',
        href: '/products?category=girls'
    },
    {
        id: 'boys',
        title: 'Boys Wear',
        image: '/11.png',
        href: '/products?category=boys'
    },
    {
        id: 'women',
        title: "Women's Apparel",
        image: '/11.png',
        href: '/products?category=women'
    },
    {
        id: 'winter',
        title: 'Winter Wear',
        image: '/11.png',
        href: '/products?category=winter'
    }
];

export function ArchedCollections() {
    // We use Embla Carousel to handle the sliding similar to the reference image
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        skipSnaps: false,
        dragFree: true,
        containScroll: 'trimSnaps'
    });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <section className="section bg-white overflow-hidden">
            <div className="container-custom">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-text-primary">
                        More collections to explore
                    </h2>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex space-x-4 md:space-x-6 -ml-4 pl-4 py-4">
                            {collections.map((collection, index) => (
                                <motion.div
                                    key={collection.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_22%] min-w-0"
                                >
                                    <Link
                                        href={collection.href}
                                        className="group block border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors bg-white hover:shadow-lg duration-300"
                                    >
                                        {/* Arched Image Container */}
                                        <div className="relative bg-[#E6E4CD] w-full aspect-[3/4] rounded-t-full overflow-hidden mb-6 flex justify-center items-end">
                                            {/* Decorative thin white outline arch */}
                                            <div className="absolute inset-x-2 top-2 bottom-0 border-t border-l border-r border-white/60 rounded-t-full pointer-events-none z-10" />

                                            <div className="relative w-[90%] h-[95%] z-20">
                                                <Image
                                                    src={collection.image}
                                                    alt={collection.title}
                                                    fill
                                                    className="object-cover object-bottom transition-transform duration-700 group-hover:scale-105"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                />
                                            </div>
                                        </div>

                                        {/* Title and Arrow */}
                                        <div className="flex items-center justify-between px-2 pb-2">
                                            <span className="text-sm font-medium text-text-primary tracking-wide">
                                                {collection.title}
                                            </span>
                                            <ArrowRight className="w-5 h-5 text-text-primary group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons (Bottom Right, like reference image) */}
                    <div className="flex justify-end gap-2 mt-8 px-4">
                        <button
                            onClick={scrollPrev}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 transition-colors bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="w-10 h-10 flex items-center justify-center border border-gray-900 bg-gray-900 rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
