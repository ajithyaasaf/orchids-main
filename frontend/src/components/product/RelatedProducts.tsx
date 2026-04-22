'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WholesaleProduct } from '@orchids/shared';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { Loader2, ArrowRight } from 'lucide-react';

interface RelatedProductsProps {
    category: string;
    currentProductId: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({ category, currentProductId }) => {
    const [products, setProducts] = useState<WholesaleProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                const allInCategory = await wholesaleProductsApi.getByCategory(category);
                // Filter out current product and limit to 4
                const filtered = allInCategory
                    .filter(p => p.id !== currentProductId)
                    .slice(0, 4);
                setProducts(filtered);
            } catch (error) {
                console.error('Failed to fetch related products:', error);
            } finally {
                setLoading(false);
            }
        };

        if (category) {
            fetchRelated();
        }
    }, [category, currentProductId]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-12 border-t border-gray-100 mt-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-heading font-bold text-gray-900">You May Also Like</h2>
                <Link 
                    href={`/products?category=${category}`}
                    className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 group"
                >
                    View All {category}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((product) => (
                    <Link 
                        key={product.id}
                        href={`/product/${product.slug}`}
                        className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                    >
                        <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 border border-gray-100">
                            {product.images[0] ? (
                                <Image
                                    src={product.images[0]}
                                    alt={product.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    No Image
                                </div>
                            )}
                            {!product.inStock && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        Out of Stock
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                {product.title}
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-primary">₹{product.bundlePrice}</span>
                                <span className="text-[10px] text-gray-500 font-medium">/ bundle</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};
