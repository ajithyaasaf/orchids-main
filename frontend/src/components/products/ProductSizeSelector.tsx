'use client';

import React from 'react';
import type { ProductSize } from '@tntrends/shared';

interface ProductSizeSelectorProps {
    sizes: ProductSize[];
    stockBySize: Record<ProductSize, number>;
    selectedSize: ProductSize | null;
    onSizeChange: (size: ProductSize) => void;
    isKidsProduct?: boolean;
}

export const ProductSizeSelector: React.FC<ProductSizeSelectorProps> = ({
    sizes,
    stockBySize,
    selectedSize,
    onSizeChange,
    isKidsProduct = false,
}) => {
    return (
        <div className="mb-8">
            <div className="flex justify-between items-end mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                    Select Size ({isKidsProduct ? 'Age' : 'US/UK'})
                </h3>
                {selectedSize && (
                    <span className={`text-xs font-medium ${stockBySize[selectedSize] < 5 ? 'text-red-500' : 'text-green-600'}`}>
                        {stockBySize[selectedSize] < 5
                            ? `Hurry! Only ${stockBySize[selectedSize]} left`
                            : 'In Stock'}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-4 gap-3">
                {sizes.map((size) => {
                    const stock = stockBySize[size] || 0;
                    const isAvailable = stock > 0;
                    const isSelected = selectedSize === size;

                    return (
                        <button
                            key={size}
                            onClick={() => isAvailable && onSizeChange(size)}
                            disabled={!isAvailable}
                            className={`
                                py-3 px-2 rounded-lg border font-medium text-sm transition-all duration-200
                                ${isSelected
                                    ? 'border-primary bg-primary text-white shadow-md transform scale-105'
                                    : isAvailable
                                        ? 'border-gray-200 hover:border-gray-400 text-gray-900 hover:shadow-sm'
                                        : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through decoration-gray-300'
                                }
                            `}
                        >
                            {size}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
