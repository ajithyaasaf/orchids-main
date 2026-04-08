'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const benefits = [
    "Premium Export Surplus Quality",
    "Direct Factory Pricing",
    "Stringent Quality Checks",
    "Ethical Manufacturing",
];

export function BrandStory() {
    return (
        <section className="section bg-white overflow-hidden">
            <div className="container-custom">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Image / Video Side */}
                    <div className="w-full lg:w-1/2 relative">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <Image
                                src="/images/Brand story image/Brand Story.jpg"
                                alt="ORCHID - Premium Export Quality Clothing from Tirupur"
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                            {/* Stylish Overlay Accent */}
                            <div className="absolute inset-0 border border-white/20 rounded-2xl z-10" />
                        </motion.div>

                        {/* Floating Experience Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="absolute -bottom-8 -right-8 md:-right-12 bg-white p-6 rounded-2xl shadow-xl z-20 hidden md:block"
                        >
                            <p className="text-4xl font-heading font-bold text-primary mb-1">15+</p>
                            <p className="text-sm text-text-secondary font-medium lowercase tracking-wide">Years of<br />Excellence</p>
                        </motion.div>
                    </div>

                    {/* Content Side */}
                    <div className="w-full lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="text-sm font-bold text-primary tracking-widest uppercase mb-4 block">
                                The Tirupur Advantage
                            </span>
                            <h2 className="text-3xl md:text-5xl font-heading font-bold text-text-primary mb-6 leading-tight">
                                Export Quality Clothing,<br />Made for Retailers.
                            </h2>
                            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                                We bridge the gap between world-class Tirupur manufacturing and Indian retailers.
                                By sourcing premium export surplus directly from factories, we ensure you get
                                unmatched quality at wholesale margins.
                            </p>

                            <ul className="space-y-4 mb-10">
                                {benefits.map((benefit, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                                        className="flex items-center text-text-primary font-medium"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                                        {benefit}
                                    </motion.li>
                                ))}
                            </ul>

                            <Link href="/about">
                                <Button size="lg" className="group rounded-full px-8">
                                    Read Our Story
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
