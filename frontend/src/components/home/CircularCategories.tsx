'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Category image map — update paths here when real photos are available
const categories = [
    {
        name: 'Newborn Collection',
        href: '/products?category=newborn',
        image: '/images/more collection to explore/new born.png',
        bg: 'bg-pink-50',
    },
    {
        name: 'Girls Wear',
        href: '/products?category=girls',
        image: '/images/more collection to explore/girl.png',
        bg: 'bg-rose-50',
    },
    {
        name: 'Boys Wear',
        href: '/products?category=boys',
        image: '/images/more collection to explore/boy.png',
        bg: 'bg-sky-50',
    },
    {
        name: "Women's Apparel",
        href: '/products?category=women',
        image: '/images/more collection to explore/women.png',
        bg: 'bg-purple-50',
    },
    {
        name: "Men's Apparel",
        href: '/products?category=mens',
        image: '/images/more collection to explore/men.png',
        bg: 'bg-slate-50',
    },
];

export function CircularCategories() {
    return (
        <section className="py-12 bg-white border-b border-gray-100 overflow-hidden">
            <div className="container-custom">
                <div className="flex justify-start md:justify-center items-center gap-6 md:gap-12 overflow-x-auto pb-6 pt-2 px-4 -mx-4 no-scrollbar snap-x">
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
                                className={`relative w-24 h-24 md:w-32 md:h-32 xl:w-40 xl:h-40 rounded-full overflow-hidden shadow-sm border-[3px] border-transparent group-hover:border-primary group-hover:shadow-md transition-all duration-300 ${category.bg}`}
                            >
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                                    sizes="(max-width: 768px) 96px, (max-width: 1280px) 128px, 160px"
                                />
                                {/* Subtle overlay */}
                                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                            </motion.div>

                            <span className="text-sm md:text-base font-medium text-text-primary group-hover:text-primary transition-colors text-center">
                                {category.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
