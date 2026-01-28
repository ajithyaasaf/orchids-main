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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            {/* Quantity Selector */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Quantity (Bundles)
                </label>
                <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                        <button
                            onClick={() => handleQuantityChange(-1)}
                            disabled={quantity <= 1}
                            className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-6 py-2 font-bold text-lg min-w-[60px] text-center">
                            {quantity}
                        </span>
                        <button
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= product.availableBundles}
                            className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Increase quantity"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-sm text-gray-600">
                        {product.availableBundles} bundles available
                    </div>
                </div>
            </div>

            {/* Total Price */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Total Price:</span>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                            ₹{totalPrice.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-500">
                            {quantity * product.bundleQty} pieces total
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    <ShoppingCart className="w-5 h-5" />
                    {isAdding ? 'Adding...' : 'Add to Cart'}
                </button>

                <button
                    onClick={handleBuyNow}
                    className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
                >
                    Buy Now
                </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
                Secure checkout powered by Razorpay
            </p>
        </div>
    );
}
