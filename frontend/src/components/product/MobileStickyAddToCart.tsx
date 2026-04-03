'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { WholesaleProduct } from '@orchids/shared';
import { useCartStore } from '@/store/wholesaleCartStore';

interface MobileStickyAddToCartProps {
    product: WholesaleProduct;
}

export const MobileStickyAddToCart: React.FC<MobileStickyAddToCartProps> = ({ product }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const { addBundle } = useCartStore();

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling 600px (approx where the main button is)
            // A better way would be using IntersectionObserver on the main button
            // but for simplicity and robustness across different screen sizes:
            const scrollY = window.scrollY;
            setIsVisible(scrollY > 800);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAddToCart = () => {
        if (!product.inStock) return;
        setIsAdding(true);
        addBundle(product, 1);
        setTimeout(() => setIsAdding(false), 1000);
    };

    if (!product.inStock) return null;

    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 transition-transform duration-300 lg:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)] ${
                isVisible ? 'translate-y-0' : 'translate-y-full'
            }`}
        >
            <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                        {product.title}
                    </p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">
                        ₹{product.bundlePrice} <span className="text-[10px] text-gray-500 font-medium">/ bundle</span>
                    </p>
                </div>
                
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all"
                >
                    {isAdding ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <ShoppingCart className="w-4 h-4" />
                    )}
                    {isAdding ? 'Added!' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
};
