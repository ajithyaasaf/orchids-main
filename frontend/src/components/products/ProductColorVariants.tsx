'use client';

import React from 'react';
import Image from 'next/image';
import type { Product } from '@tntrends/shared';

interface ProductColorVariantsProps {
    currentProduct: Product;
    variants: Product[];
    onVariantChange: (variantId: string) => void;
}

export const ProductColorVariants: React.FC<ProductColorVariantsProps> = ({
    currentProduct,
    variants,
    onVariantChange,
}) => {
    if (variants.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center justify-between">
                <span>Color: <span className="font-bold text-gray-700">{currentProduct.color || 'Standard'}</span></span>
            </h3>
            <div className="flex flex-wrap gap-3">
                {variants.map((variant) => (
                    <button
                        key={variant.id}
                        onClick={() => onVariantChange(variant.id)}
                        className={`
                            relative w-14 h-16 rounded-md overflow-hidden border-2 transition-all cursor-pointer
                            ${variant.id === currentProduct.id
                                ? 'border-primary ring-2 ring-primary scale-105'
                                : 'border-gray-200 hover:border-gray-400 opacity-90 hover:opacity-100'
                            }
                        `}
                        title={variant.color || variant.title}
                    >
                        <Image
                            src={variant.images?.[0]?.url || '/placeholder.png'}
                            alt={variant.color || 'Variant'}
                            fill
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};
