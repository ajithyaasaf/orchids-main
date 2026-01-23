'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ProductImage {
    url: string;
}

interface ProductImageGalleryProps {
    images: ProductImage[];
    productTitle: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
    images,
    productTitle,
}) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    return (
        <div>
            <div className="aspect-product bg-gray-100 rounded-xl overflow-hidden mb-4 relative shadow-sm">
                <Image
                    src={images[selectedImageIndex]?.url || '/placeholder-product.jpg'}
                    alt={productTitle}
                    fill
                    className="object-cover transition-all duration-300 hover:scale-105"
                    priority
                />
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition relative 
                                ${selectedImageIndex === index
                                    ? 'border-primary ring-2 ring-primary/20'
                                    : 'border-transparent hover:border-gray-200'
                                }`}
                        >
                            <Image
                                src={image.url}
                                alt={`${productTitle} View ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
