'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@tntrends/shared';
import { ShoppingCart } from 'lucide-react';
import { getProductPricing, isProductInStock, getTotalStock } from '@/lib/pricingUtils';

interface ProductCardProps {
    product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const pricing = getProductPricing(product);
    const hasDiscount = pricing.hasDiscount;

    // Compute stock status from stockBySize (more reliable than inStock field)
    const inStock = isProductInStock(product);
    const totalStock = getTotalStock(product);
    const isLowStock = inStock && totalStock > 0 && totalStock <= 5;

    return (
        <Link href={`/product/${product.id}`} className="group block h-full">
            <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-100 group-hover:border-primary/20 relative ${!inStock ? 'opacity-75' : ''}`}>

                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                    <Image
                        src={product.images[0]?.url || '/placeholder-product.jpg'}
                        alt={product.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover group-hover:scale-110 transition-transform duration-500 ${!inStock ? 'grayscale' : ''}`}
                    />

                    {/* Sold Out Overlay */}
                    {!inStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-white text-gray-900 text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                                SOLD OUT
                            </span>
                        </div>
                    )}

                    {/* Overlay Actions (Desktop) - Only show if in stock */}
                    {inStock && (
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:flex gap-2 bg-gradient-to-t from-black/60 to-transparent pt-12">
                            <button className="flex-1 bg-white text-text-primary py-2.5 rounded-lg font-medium text-sm hover:bg-primary hover:text-white transition-colors shadow-lg flex items-center justify-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                            </button>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {hasDiscount && inStock && (
                            <span className="bg-error text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                {product.discountType === 'percentage' ? `-${product.discountValue}%` : `-₹${product.discountValue}`}
                            </span>
                        )}
                        {isLowStock && (
                            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                Only {totalStock} left!
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                    <div className="mb-1">
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                            {product.category}
                        </span>
                    </div>

                    <h3 className={`font-heading font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 ${!inStock ? 'text-gray-400' : 'text-text-primary'}`}>
                        {product.title}
                    </h3>

                    <div className="mt-auto pt-2 flex items-baseline gap-2">
                        {!inStock ? (
                            <span className="text-base font-medium text-gray-400">
                                Currently Unavailable
                            </span>
                        ) : hasDiscount ? (
                            <>
                                <span className="text-xl font-bold text-text-primary">
                                    ₹{pricing.displayPrice.toFixed(0)}
                                </span>
                                <span className="text-sm text-text-secondary line-through decoration-gray-400">
                                    ₹{pricing.originalDisplayPrice.toFixed(0)}
                                </span>
                            </>
                        ) : (
                            <span className="text-xl font-bold text-text-primary">
                                ₹{pricing.displayPrice.toFixed(0)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};
