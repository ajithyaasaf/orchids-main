import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productApi, collectionApi } from '@/lib/api';
import { HomePageClient } from '@/components/pages/HomePageClient';
import { CollectionShowcase } from '@/components/home/CollectionShowcase';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { Product, Collection } from '@tntrends/shared';

// This is now a Server Component (no 'use client')
export default async function HomePage() {
    // Fetch products and collections on the server for SEO
    let featuredProducts: Product[] = [];
    let activeCollections: Collection[] = [];

    try {
        const response = await productApi.getAll({ limit: 8, sortBy: 'newest' });
        featuredProducts = response.data || [];
    } catch (error) {
        console.error('Failed to fetch products:', error);
        featuredProducts = [];
    }

    try {
        const response = await collectionApi.getAll();
        activeCollections = response.data || [];
    } catch (error) {
        console.error('Failed to fetch collections:', error);
        activeCollections = [];
    }

    return (
        <div className="overflow-hidden">
            {/* Hero Section - Single Banner Image (1920x800) */}
            <section className="relative w-full">
                {/* 
                 Aspect Ratio Logic:
                 - Mobile: aspect-[4/3] (standard mobile, crops sides to keep height)
                 - Tablet/Desktop: aspect-[1920/800] (shows full banner perfectly)
                */}
                <div className="relative w-full aspect-[4/3] md:aspect-[1920/800]">
                    <Image
                        src="/11.png"
                        alt="New Collection 2025"
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                </div>
            </section>

            {/* Categories Grid - Static, rendered on server */}
            <section className="section">
                <div className="container-custom">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">Shop by Category</h2>
                            <p className="text-text-secondary text-lg">Explore our wide range of collections</p>
                        </div>
                        <Link href="/search" className="hidden md:flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
                            View All Categories <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/category/women" className="group relative rounded-3xl overflow-hidden min-h-[400px]">
                            <Image
                                src="/shop by categories/1.png"
                                alt="Women's Fashion"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            <div className="absolute bottom-8 left-8">
                                <h3 className="text-3xl font-heading font-bold text-white mb-2">Women</h3>
                                <span className="text-white/90 text-sm font-medium group-hover:underline">Shop Collection</span>
                            </div>
                        </Link>

                        <Link href="/category/men" className="group relative rounded-3xl overflow-hidden min-h-[400px]">
                            <Image
                                src="/shop by categories/2.png"
                                alt="Men's Fashion"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            <div className="absolute bottom-8 left-8">
                                <h3 className="text-3xl font-heading font-bold text-white mb-2">Men</h3>
                                <span className="text-white/90 text-sm font-medium group-hover:underline">Shop Collection</span>
                            </div>
                        </Link>

                        <Link href="/category/kids" className="group relative rounded-3xl overflow-hidden min-h-[400px]">
                            <Image
                                src="/shop by categories/3.png"
                                alt="Kids Fashion"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                            <div className="absolute bottom-8 left-8">
                                <h3 className="text-3xl font-heading font-bold text-white mb-2">Kids</h3>
                                <span className="text-white/90 text-sm font-medium group-hover:underline">Shop Collection</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Promo Banner Section - Custom Design */}
            {/* Promo Banner Section - Custom Design (Full Width) */}
            <section className="section-sm">
                <Link href="/search" className="block relative group cursor-pointer bg-slate-900">
                    <div className="relative w-full aspect-[16/3]">
                        <Image
                            src="/sections/unique designs.png"
                            alt="Season Sale - Limited Time Offer"
                            fill
                            className="object-contain transition-transform duration-500 group-hover:scale-105"
                            priority={false}
                        />
                    </div>
                </Link>
            </section>

            {/* Collections Showcase */}
            <CollectionShowcase collections={activeCollections} />

            {/* Featured Products - Client Component for Interactive Features */}
            <HomePageClient featuredProducts={featuredProducts} />

            {/* Features - Static, rendered on server */}
            <section className="section">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: ShieldCheck,
                                title: "Quality Guarantee",
                                desc: "Every item is manually verified for quality assurance"
                            },
                            {
                                icon: Truck,
                                title: "FREE Delivery",
                                desc: "Always FREE in South India. FREE across India on orders above ₹1499"
                            },
                            {
                                icon: RotateCcw,
                                title: "Secure Checkout",
                                desc: "Safe & secure payment powered by Razorpay"
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-heading font-bold text-text-primary mb-3">{feature.title}</h3>
                                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
