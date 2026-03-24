'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Mock logos - in production, replace with actual partner/retailer logos
const logos = [
    { name: 'Partner 1', url: '/11.png' },
    { name: 'Partner 2', url: '/11.png' },
    { name: 'Partner 3', url: '/11.png' },
    { name: 'Partner 4', url: '/11.png' },
    { name: 'Partner 5', url: '/11.png' },
    { name: 'Partner 6', url: '/11.png' },
];

// Duplicate the array to create a seamless infinite loop
const doubleLogos = [...logos, ...logos];

export function LogoTicker() {
    return (
        <section className="w-full bg-white border-y border-gray-200 py-8 overflow-hidden">
            <div className="container-custom mb-6 text-center">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                    Trusted by 500+ Retailers Across India
                </p>
            </div>

            {/* Ticker Container */}
            <div className="relative flex overflow-hidden group">
                {/* Gradient Masks for smooth fade at edges */}
                <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointers-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointers-events-none" />

                <div className="flex w-[200%] animate-marquee hover:[animation-play-state:paused] items-center">
                    {doubleLogos.map((logo, index) => (
                        <div
                            key={`${logo.name}-${index}`}
                            className="flex-shrink-0 w-1/12 px-8 flex justify-center items-center opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
                        >
                            {/* We use an image with an object-contain property for logos */}
                            <div className="relative h-12 w-32">
                                <Image
                                    src={logo.url}
                                    alt={logo.name}
                                    fill
                                    className="object-contain"
                                    sizes="120px"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
