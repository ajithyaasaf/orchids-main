import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/Button';
import type { Product } from '@tntrends/shared';

interface HomePageClientProps {
    featuredProducts: Product[];
}

// This is now a Server Component (no 'use client' directive)
export function HomePageClient({ featuredProducts }: HomePageClientProps) {
    return (
        <section className="section bg-gray-50/50">
            <div className="container-custom">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-primary font-medium tracking-wider uppercase text-sm">Weekly Best Sellers</span>
                    <h2 className="text-4xl font-heading font-bold text-text-primary mt-3 mb-4">Trending Now</h2>
                    <p className="text-text-secondary">Our most popular products based on sales. Updated hourly.</p>
                </div>

                {featuredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-text-secondary">No products available at the moment.</p>
                    </div>
                )}

                <div className="text-center mt-12">
                    <Link href="/search">
                        <Button size="lg" variant="outline" className="rounded-full px-8">
                            View All Products
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
