import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { OrganizationSchema } from '@/components/seo/StructuredData';
import { ProductsGrid } from '@/components/products/ProductsGrid';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Truck, Package } from 'lucide-react';

/**
 * ORCHID Wholesale Clothing - Homepage
 * Server-side rendered for SEO with wholesale product catalog
 */

export default async function HomePage() {
    // Fetch wholesale products on server for SEO
    let featuredProducts: Awaited<ReturnType<typeof wholesaleProductsApi.getAll>> = [];

    try {
        const allProducts = await wholesaleProductsApi.getAll();
        // Show latest 8 products
        featuredProducts = allProducts
            .filter((p) => p.inStock)
            .slice(0, 8);
    } catch (error) {
        console.error('Failed to fetch wholesale products:', error);
        featuredProducts = [];
    }

    return (
        <>
            {/* SEO: Organization Schema */}
            <OrganizationSchema />

            <div className="overflow-hidden">
                {/* Hero Section - Single Banner Image (1920x800) */}
                <section className="relative w-full">
                    <div className="relative w-full aspect-[4/3] md:aspect-[1920/800]">
                        <Image
                            src="/11.png"
                            alt="ORCHID Wholesale Clothing - Premium Apparel from Tirupur"
                            fill
                            className="object-cover"
                            priority
                            sizes="100vw"
                        />
                    </div>
                </section>

                {/* Categories Grid - Wholesale Categories */}
                <section className="section">
                    <div className="container-custom">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <h1 className="text-4xl font-heading font-bold text-text-primary mb-4">
                                    Shop by Category
                                </h1>
                                <p className="text-text-secondary text-lg">
                                    Explore our wholesale clothing collections
                                </p>
                            </div>
                        </div>

                        {/* Category Grid - Wholesale Categories */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Newborn Collection */}
                            <CategoryCard
                                href="/products?category=newborn"
                                image="/11.png"
                                title="Newborn Collection"
                                description="0-2 years | Jubba, Gift boxes, Rompers, Frocks"
                            />

                            {/* Girls Wear */}
                            <CategoryCard
                                href="/products?category=girls"
                                image="/11.png"
                                title="Girls Wear"
                                description="2-12 years | T-shirts, Frocks, Leggings, Skirts"
                            />

                            {/* Boys Wear */}
                            <CategoryCard
                                href="/products?category=boys"
                                image="/11.png"
                                title="Boys Wear"
                                description="2-12 years | T-shirts, Pants, Shorts"
                            />

                            {/* Women's Apparel */}
                            <CategoryCard
                                href="/products?category=women"
                                image="/11.png"
                                title="Women's Apparel"
                                description="Feeding dresses, Leggings, T-shirts, Tights"
                            />
                        </div>
                    </div>
                </section>

                {/* Promo Banner - Wholesale Messaging */}
                <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
                    <div className="container-custom text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Wholesale Pricing from Tirupur
                        </h2>
                        <p className="text-xl mb-8 max-w-2xl mx-auto">
                            Bundle-based pricing for retailers. GST included. Minimum order quantities
                            apply.
                        </p>
                        <Link href="/products">
                            <Button size="lg" variant="secondary">
                                View All Products
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Featured Products - Wholesale Bundles */}
                {featuredProducts.length > 0 && (
                    <section className="section bg-gray-50">
                        <div className="container-custom">
                            <div className="flex items-end justify-between mb-12">
                                <div>
                                    <h2 className="text-4xl font-heading font-bold text-text-primary mb-4">
                                        Latest Wholesale Products
                                    </h2>
                                    <p className="text-text-secondary text-lg">
                                        Newest bundles from our collection
                                    </p>
                                </div>
                                <Link
                                    href="/products"
                                    className="text-primary font-semibold hover:underline hidden md:block"
                                >
                                    View All Products →
                                </Link>
                            </div>

                            <ProductsGrid products={featuredProducts} />

                            <div className="text-center mt-12 md:hidden">
                                <Link href="/products">
                                    <Button>View All Products</Button>
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* Features - Wholesale Benefits */}
                <section className="section">
                    <div className="container-custom">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Bundle Pricing */}
                            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="inline-block p-4 bg-blue-100 rounded-full mb-6">
                                    <Package className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Bundle Pricing</h3>
                                <p className="text-text-secondary">
                                    Wholesale rates for bulk orders. Minimum order quantities apply for
                                    best pricing.
                                </p>
                            </div>

                            {/* GST Included */}
                            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
                                    <ShieldCheck className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">GST Included</h3>
                                <p className="text-text-secondary">
                                    All prices include GST. Proper invoices provided for every order.
                                </p>
                            </div>

                            {/* Fast Delivery */}
                            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="inline-block p-4 bg-orange-100 rounded-full mb-6">
                                    <Truck className="w-8 h-8 text-orange-600" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">India-wide Delivery</h3>
                                <p className="text-text-secondary">
                                    Fast shipping from Tirupur to all major cities across India.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

// ============================================================================
// Category Card Component
// ============================================================================

interface CategoryCardProps {
    href: string;
    image: string;
    title: string;
    description: string;
}

function CategoryCard({ href, image, title, description }: CategoryCardProps) {
    return (
        <Link
            href={href}
            className="group relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/5] hover:shadow-xl transition-all duration-300"
        >
            <Image
                src={image}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-white/90">{description}</p>
            </div>
        </Link>
    );
}
