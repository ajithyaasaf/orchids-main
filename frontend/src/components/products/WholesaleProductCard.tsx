'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ArrowRight, AlertCircle } from 'lucide-react';
import { WholesaleProduct } from '@orchids/shared';

interface WholesaleProductCardProps {
    product: WholesaleProduct;
    priority?: boolean;
    className?: string;
}

/**
 * WholesaleProductCard
 * 
 * A reusable component for displaying wholesale bundle products.
 * Extracted from ProductsGrid for use across the application (Collections, Related Products, etc.)
 */
export const WholesaleProductCard: React.FC<WholesaleProductCardProps> = ({
    product,
    priority = false,
    className = ''
}) => {
    // Calculate per-piece price for transparency
    // Fallback to 0 if bundleQty is missing/zero to avoid NaN
    const qty = product.bundleQty || 1;
    const piecePrice = Math.round((product.bundlePrice || 0) / qty);

    // Low stock threshold logic
    const isLowStock = product.inStock && (product.availableBundles || 0) < 10;

    // Image handling
    const mainImage = product.images?.[0] || '';

    return (
        <Link
            href={`/product/${product.slug || product.id}`}
            className={`group flex flex-col h-full bg-white transition-all duration-300 ${className}`}
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-4">
                {mainImage ? (
                    <Image
                        src={mainImage}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        priority={priority}
                        quality={90}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <Package className="w-12 h-12 opacity-20" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {!product.inStock && (
                        <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                            Sold Out
                        </span>
                    )}
                    {isLowStock && (
                        <span className="bg-orange-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Low Stock
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1">
                {/* Category & Stats */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {product.category || 'Wholesale'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        <Package className="w-3 h-3" />
                        <span>{product.bundleQty} Pcs/Bundle</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors min-h-[2.5rem]">
                    {product.title}
                </h3>

                {/* Price Section */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold font-heading text-gray-900">
                                ₹{(product.bundlePrice || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-gray-500">/ bundle</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium">
                            ₹{piecePrice} per piece
                        </p>
                    </div>

                    {/* View Button (Icon style) */}
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
};
