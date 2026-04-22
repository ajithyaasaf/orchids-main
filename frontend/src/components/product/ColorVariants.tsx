'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WholesaleProduct } from '@orchids/shared';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { getCloudinaryUrl, PRODUCT_GALLERY_THUMB_OPTS } from '@/lib/cloudinaryImage';
import { Palette } from 'lucide-react';

interface ColorVariantsProps {
    styleCode: string;
    currentProductId: string;
}

export const ColorVariants: React.FC<ColorVariantsProps> = ({ styleCode, currentProductId }) => {
    const [variants, setVariants] = useState<WholesaleProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVariants = async () => {
            try {
                const data = await wholesaleProductsApi.getByStyleCode(styleCode);
                setVariants(data);
            } catch (error) {
                console.error('Failed to fetch color variants:', error);
            } finally {
                setLoading(false);
            }
        };

        if (styleCode) {
            fetchVariants();
        }
    }, [styleCode]);

    if (loading || variants.length <= 1) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Palette className="w-4 h-4 text-primary" />
                Available Colors
            </h2>

            <div className="flex flex-wrap gap-3">
                {variants.map((variant) => (
                    <Link
                        key={variant.id}
                        href={`/product/${variant.slug}`}
                        className={`group relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${variant.id === currentProductId
                            ? 'border-primary shadow-md'
                            : 'border-transparent hover:border-gray-200'
                            }`}
                        title={variant.colorName || variant.title}
                    >
                        {variant.images[0] ? (
                            <Image
                                src={getCloudinaryUrl(variant.images[0], PRODUCT_GALLERY_THUMB_OPTS)}
                                alt={variant.colorName || variant.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                No Pix
                            </div>
                        )}

                        {variant.id === currentProductId && (
                            <div className="absolute inset-0 bg-primary/10" />
                        )}

                        {!variant.inStock && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                <div className="w-full h-[1px] bg-red-500 rotate-45" />
                                <div className="w-full h-[1px] bg-red-500 -rotate-45" />
                            </div>
                        )}
                    </Link>
                ))}
            </div>
            {variants.find(v => v.id === currentProductId)?.colorName && (
                <p className="text-xs text-gray-500 mt-3 font-medium">
                    Current Color: <span className="text-gray-900 font-bold">{variants.find(v => v.id === currentProductId)?.colorName}</span>
                </p>
            )}
        </div>
    );
};
