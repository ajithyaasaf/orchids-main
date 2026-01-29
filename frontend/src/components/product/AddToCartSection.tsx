'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { WholesaleProduct } from '@tntrends/shared';
import { useCartStore } from '@/store/wholesaleCartStore';
import { useRouter } from 'next/navigation';

/**
 * Add to Cart Section Component
 * Client component for interactive cart functionality
 * Follows React best practices with proper state management
 */

interface AddToCartSectionProps {
    product: WholesaleProduct;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
    const router = useRouter();
    const { addBundle } = useCartStore();
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);

    const handleQuantityChange = (delta: number) => {
        const newQty = Math.max(1, Math.min(product.availableBundles, quantity + delta));
        setQuantity(newQty);
    };

    const handleAddToCart = async () => {
        if (!product.inStock) return;

        setIsAdding(true);
        try {
            addBundle(product, quantity);
            // Optional: Show success toast
            setTimeout(() => {
                setIsAdding(false);
                // Reset quantity after adding
                setQuantity(1);
            }, 500);
        } catch (error) {
            console.error('Error adding to cart:', error);
            setIsAdding(false);
        }
    };

    const handleBuyNow = () => {
        handleAddToCart();
        setTimeout(() => {
            router.push('/wholesale/cart');
        }, 600);
    };

    const totalPrice = product.bundlePrice * quantity;

    if (!product.inStock) {
        return (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-600 font-semibold mb-2">Currently Out of Stock</p>
                <p className="text-sm text-gray-500">
                    Please check back later or contact us for availability
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Quantity</span>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                    {product.availableBundles} bundles available
                </span>
            </div>

            {/* Quantity Selector & Total Price Row */}
            <div className="flex items-end justify-between gap-6 mb-8">
                {/* Modern Quantity Input */}
                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-12 text-center font-bold text-lg text-gray-900">
                        {quantity}
                    </div>
                    <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.availableBundles}
                        className="w-10 h-10 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Dynamic Total Price */}
                <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Amount</p>
                    <p className="text-3xl font-heading font-bold text-gray-900 leading-none">
                        ₹{totalPrice.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-dark shadow-lg shadow-primary/20 hover:shadow-primary/40 active:transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                    {isAdding ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <ShoppingCart className="w-5 h-5 group-hover:animate-bounce-short" />
                    )}
                    {isAdding ? 'Adding...' : 'Add to Cart'}
                </button>

                <button
                    onClick={handleBuyNow}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black hover:shadow-lg active:transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Buy Now
                </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Secure Checkout by Razorpay
            </div>
        </div>
    );
}
