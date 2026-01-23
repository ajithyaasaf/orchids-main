'use client';

import React from 'react';

interface ProductQuantitySelectorProps {
    quantity: number;
    onQuantityChange: (quantity: number) => void;
}

export const ProductQuantitySelector: React.FC<ProductQuantitySelectorProps> = ({
    quantity,
    onQuantityChange,
}) => {
    return (
        <div className="flex items-center border border-gray-200 rounded-lg h-14 w-32 bg-gray-50">
            <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold text-lg"
            >
                -
            </button>
            <div className="flex-1 text-center font-semibold text-gray-900 bg-white h-full flex items-center justify-center border-x border-gray-200">
                {quantity}
            </div>
            <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-gray-900 font-bold text-lg"
            >
                +
            </button>
        </div>
    );
};
