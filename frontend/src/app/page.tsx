import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { collectionApi } from '@/lib/api';
import { OrganizationSchema } from '@/components/seo/StructuredData';
import { CollectionShowcase } from '@/components/home/CollectionShowcase';
import { Collection } from '@orchids/shared';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Truck, Package } from 'lucide-react';

// New Premium Components
import { CircularCategories } from '@/components/home/CircularCategories';
import { ArchedCollections } from '@/components/home/ArchedCollections';
import { BrandStory } from '@/components/home/BrandStory';
import { Testimonials } from '@/components/home/Testimonials';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { NewsletterCta } from '@/components/home/NewsletterCta';

/**
 * ORCHID Wholesale Clothing - Premium Homepage
 * Server-side rendered for SEO with wholesale product catalog
 */

export default async function HomePage() {
    // Fetch wholesale products on server for SEO
    let featuredProducts: Awaited<ReturnType<typeof wholesaleProductsApi.getAll>> = [];
    let collections: Collection[] = [];

    try {
        const [productsData, collectionsData] = await Promise.all([
            wholesaleProductsApi.getAll(),
            collectionApi.getAll()
        ]);

        // Show latest 8 products
        featuredProducts = productsData
            .filter((p) => p.inStock)
            .slice(0, 8);

        // Get collections
        collections = collectionsData.data || [];

    } catch (error) {
        console.error('Failed to fetch homepage data:', error);
        featuredProducts = [];
        collections = [];
    }

    return (
        <>
            {/* SEO: Organization Schema */}
            <OrganizationSchema />

            <div className="overflow-hidden">
                {/* Section 1: Responsive Hero Section */}
                <section className="relative w-full">
                    <div className="relative w-full aspect-[1080/1350] md:aspect-[1920/800]">
                        {/* Desktop Image (Hidden on mobile) */}
                        <div className="hidden md:block absolute inset-0">
                            <Image
                                src="/images/hero images/Banner_1_windows.jpg"
                                alt="ORCHID Wholesale Clothing - Premium Apparel from Tirupur"
                                fill
                                className="object-cover"
                                priority
                                sizes="100vw"
                            />
                        </div>
                        {/* Mobile Image (Visible on mobile only) */}
                        <div className="block md:hidden absolute inset-0">
                            <Image
                                src="/images/hero images/Banner_1_mobile.jpg"
                                alt="ORCHID Wholesale Clothing - Mobile Collection"
                                fill
                                className="object-cover"
                                priority
                                sizes="100vw"
                            />
                        </div>
                    </div>
                </section>

                {/* Section 2: Circular Categories Navigation */}
                <CircularCategories />

                {/* Section 3: Value Propositions Grid (Moved up for immediate trust) */}
                <section className="section bg-slate-50 border-b border-gray-100">
                    <div className="container-custom">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Bundle Pricing */}
                            <div className="text-center p-8 bg-white rounded-xl shadow-soft hover:shadow-lg transition-shadow border border-gray-50">
                                <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full mb-6">
                                    <Package className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-text-primary">Bundle Pricing</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    Wholesale rates for bulk orders. Minimum order quantities apply for
                                    maximum margins.
                                </p>
                            </div>

                            {/* GST Included */}
                            <div className="text-center p-8 bg-white rounded-xl shadow-soft hover:shadow-lg transition-shadow border border-gray-50">
                                <div className="inline-flex p-4 bg-green-50 text-green-600 rounded-full mb-6">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-text-primary">GST Included</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    All prices include GST. 100% compliant B2B invoices provided for every order.
                                </p>
                            </div>

                            {/* Fast Delivery */}
                            <div className="text-center p-8 bg-white rounded-xl shadow-soft hover:shadow-lg transition-shadow border border-gray-50">
                                <div className="inline-flex p-4 bg-orange-50 text-orange-600 rounded-full mb-6">
                                    <Truck className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-text-primary">Pan-India Delivery</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    Fast, reliable logistics from Tirupur directly to your retail storefront.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Collection Showcase */}
                <CollectionShowcase collections={collections} />

                {/* Section 5: The "Tirupur Advantage" / Brand Story */}
                <BrandStory />

                {/* Section 6: Trending Wholesale Bundles (Interactive Carousel) */}
                {featuredProducts.length > 0 && (
                    <ProductCarousel
                        products={featuredProducts}
                        title="Trending Wholesale Bundles"
                        subtitle="High-margin products picked for this season"
                    />
                )}

                {/* Section 7: More Collections to Explore (Arched Carousel) */}
                <ArchedCollections />

                {/* Section 8: B2B Success Stories / Testimonials */}
                <Testimonials />

                {/* Section 9: Exclusive Lead Capture */}
                <NewsletterCta />

            </div>
        </>
    );
}
