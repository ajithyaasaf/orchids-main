'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PRODUCT_CATEGORIES } from '@orchids/shared';

// Create the categories array dynamically from our shared single source of truth
const categories = PRODUCT_CATEGORIES.map(category => ({
    name: category.label,
    href: `/products?category=${category.id}`,
    // You can customize the image mapping based on the category ID later. 
    // Example: image: `/images/categories/${category.id}.png` or a specific object map.
    image: '/11.png',
}));

export function CircularCategories() {
    return (
        <section className="py-12 bg-white border-b border-gray-100 overflow-hidden">
            <div className="container-custom">
                {/* 
                    Using a flex container with overflow-x-auto allows horizontal scrolling 
                    on smaller devices while keeping them centered on large screens. 
                    The hide-scrollbar class can be added to your global CSS if not present.
                */}
                <div className="flex justify-start md:justify-center items-center gap-6 md:gap-12 overflow-x-auto pb-6 pt-2 px-4 -mx-4 scrollbar-hide snap-x">
                    {categories.map((category, idx) => (
                        <Link
                            key={category.name}
                            href={category.href}
                            className="flex flex-col items-center gap-4 group flex-shrink-0 snap-center"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                className="relative w-24 h-24 md:w-32 md:h-32 xl:w-40 xl:h-40 rounded-full overflow-hidden shadow-sm border-[3px] border-transparent group-hover:border-primary-light group-hover:shadow-md transition-all duration-300"
                            >
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                                    sizes="(max-width: 768px) 96px, (max-width: 1280px) 128px, 160px"
                                />
                                {/* Optional subtle overlay for better image contrast */}
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                            </motion.div>

                            <span className="text-sm md:text-base font-medium text-text-primary group-hover:text-primary transition-colors text-center">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                /* Simple CSS utility to hide scrollbars for the horizontal scroll area */
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
}
