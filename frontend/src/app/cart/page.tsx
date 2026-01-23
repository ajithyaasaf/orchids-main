'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore, UnavailableCartItem } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle, X, Tag } from 'lucide-react';
import { getProductPricing } from '@/lib/pricingUtils';
import { couponApi } from '@/lib/api';

export default function CartPage() {
    const {
        items,
        unavailableItems,
        removeItem,
        updateQuantity,
        getTotalItems,
        getTotalPrice,
        clearCart,
        getAppliedCombo,
        getSavings,
        isCalculatingCombo,
        sanitizeCart,
        isSanitizing,
        clearUnavailableItem
    } = useCartStore();

    const [hasValidated, setHasValidated] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
    const [couponError, setCouponError] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    // Sanitize cart on page load to check for unavailable items
    useEffect(() => {
        const runSanitization = async () => {
            await sanitizeCart();
            setHasValidated(true);
        };

        if (items.length > 0) {
            runSanitization();
        } else {
            setHasValidated(true);
        }
    }, []); // Only run on mount

    // Restore applied coupon from localStorage on mount (in case user navigates back from checkout)
    useEffect(() => {
        try {
            const savedCoupon = localStorage.getItem('appliedCoupon');
            if (savedCoupon) {
                const couponData = JSON.parse(savedCoupon);
                setAppliedCoupon(couponData);
            }
        } catch (error) {
            console.error('Failed to restore coupon from localStorage:', error);
        }
    }, []); // Only run on mount

    // Clear coupon when cart becomes empty (best practice: fresh start for new products)
    useEffect(() => {
        // Only clear if we HAD a coupon and cart is NOW empty
        if (items.length === 0 && appliedCoupon) {
            console.log('Cart emptied - clearing applied coupon');
            setAppliedCoupon(null);
            setCouponCode('');
            localStorage.removeItem('appliedCoupon');
        }
    }, [items.length, appliedCoupon]);



    // Cart page only shows subtotal - shipping is calculated at checkout with pincode
    const subtotal = getTotalPrice();

    // Apply coupon discount to get final total
    const couponDiscount = appliedCoupon?.discount || 0;
    const finalTotal = Math.max(0, subtotal - couponDiscount);

    // Helper to check if an item is unavailable
    const getUnavailableStatus = (productId: string, size: string): UnavailableCartItem | undefined => {
        return unavailableItems.find(u => u.productId === productId && u.size === size);
    };

    // Show loading until initial validation is complete
    if (!hasValidated || isSanitizing) {
        return (
            <div className="container-custom section">
                <div className="max-w-md mx-auto text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary">Validating your cart...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="container-custom section">
                <div className="max-w-md mx-auto text-center py-16">
                    <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-text-primary mb-4">Your cart is empty</h1>
                    <p className="text-text-secondary mb-8">
                        Start adding some amazing products to your cart!
                    </p>
                    <Link href="/">
                        <Button size="lg">Continue Shopping</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Check if cart has unavailable items
    const hasUnavailable = unavailableItems.length > 0;
    const canCheckout = !hasUnavailable && items.length > 0;

    return (
        <div className="container-custom section">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => {
                        const { product, size, quantity } = item;
                        const pricing = getProductPricing(product);
                        const itemTotal = pricing.displayPrice * quantity;
                        const unavailable = getUnavailableStatus(product.id, size);

                        return (
                            <div
                                key={`${product.id}-${size}`}
                                className={`bg-white rounded-xl p-6 shadow-soft relative overflow-hidden ${unavailable ? 'opacity-75' : ''
                                    }`}
                            >
                                {/* Out of Stock Overlay */}
                                {unavailable && (
                                    <div className="absolute inset-0 bg-gray-100/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                        <div className="bg-white rounded-lg shadow-lg p-4 text-center max-w-xs">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                            </div>
                                            <p className="font-semibold text-gray-900 text-sm mb-1">
                                                {unavailable.reason === 'PRODUCT_NOT_FOUND'
                                                    ? 'Product Unavailable'
                                                    : unavailable.reason === 'SIZE_OUT_OF_STOCK'
                                                        ? 'Size Out of Stock'
                                                        : 'Limited Stock'}
                                            </p>
                                            <p className="text-xs text-gray-500 mb-3">
                                                {unavailable.message}
                                            </p>
                                            <button
                                                onClick={() => clearUnavailableItem(product.id, size)}
                                                className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1 mx-auto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Remove from Cart
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-6">
                                    {/* Product Image */}
                                    <div className={`w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden ${unavailable ? 'grayscale' : ''
                                        }`}>
                                        <Image
                                            src={product.images[0]?.url || '/placeholder-product.jpg'}
                                            alt={product.title}
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-2">
                                            <div>
                                                <Link href={`/product/${product.id}`}>
                                                    <h3 className="font-semibold text-text-primary hover:text-primary transition">
                                                        {product.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-text-secondary">
                                                    Size: {size} | {product.category}
                                                </p>
                                            </div>
                                            {!unavailable && (
                                                <button
                                                    onClick={() => removeItem(product.id, size)}
                                                    className="text-text-secondary hover:text-error transition"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            {/* Quantity Controls */}
                                            <div className={`flex items-center gap-3 ${unavailable ? 'pointer-events-none opacity-50' : ''}`}>
                                                <button
                                                    onClick={() => updateQuantity(product.id, size, quantity - 1)}
                                                    className="w-8 h-8 rounded-lg border-2 border-border hover:border-primary transition flex items-center justify-center"
                                                    disabled={!!unavailable}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(product.id, size, quantity + 1)}
                                                    disabled={!!unavailable || quantity >= product.stockBySize[size]}
                                                    className="w-8 h-8 rounded-lg border-2 border-border hover:border-primary transition flex items-center justify-center disabled:opacity-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Price */}
                                            <div className={`text-right ${unavailable ? 'opacity-50' : ''}`}>
                                                <p className="text-lg font-bold text-primary">₹{itemTotal.toFixed(0)}</p>
                                                {pricing.hasDiscount && (
                                                    <p className="text-sm text-text-secondary line-through">
                                                        ₹{(pricing.originalDisplayPrice * quantity).toFixed(0)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <button
                        onClick={clearCart}
                        className="text-text-secondary hover:text-error transition text-sm"
                    >
                        Clear Cart
                    </button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
                        <h2 className="text-xl font-bold text-text-primary mb-6">Order Summary</h2>

                        {/* Unavailable items warning */}
                        {hasUnavailable && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-800">
                                        Remove unavailable items to proceed to checkout.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            {/* Combo Badge - ONLY when actual combo is applied */}
                            {getAppliedCombo() && (
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-3 mb-4">
                                    <div className="flex items-start gap-2">
                                        <span className="text-xl">🎁</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-purple-900">
                                                {getAppliedCombo()?.comboName}
                                            </p>
                                            <p className="text-sm text-purple-700 mt-1">
                                                Combo Price: ₹{getAppliedCombo()?.comboPrice} •
                                                Extra Savings ₹{getSavings().toFixed(0)}!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Calculate individual product discounts */}
                            {(() => {
                                let originalTotal = 0;
                                let discountedTotal = 0;

                                // Only calculate for available items
                                items.forEach(item => {
                                    const unavailable = getUnavailableStatus(item.product.id, item.size);
                                    if (unavailable) return;

                                    const pricing = getProductPricing(item.product);
                                    originalTotal += pricing.originalDisplayPrice * item.quantity;
                                    discountedTotal += pricing.displayPrice * item.quantity;
                                });

                                const productDiscount = originalTotal - discountedTotal;
                                const hasProductDiscount = productDiscount > 0;

                                return (
                                    <>
                                        {/* Subtotal (before any discounts) */}
                                        {hasProductDiscount && (
                                            <div className="flex justify-between text-text-secondary">
                                                <span>Subtotal ({getTotalItems()} items)</span>
                                                <span className="line-through">₹{originalTotal.toFixed(0)}</span>
                                            </div>
                                        )}

                                        {/* Product Discount (individual item discounts) */}
                                        {hasProductDiscount && (
                                            <div className="flex justify-between text-green-600 font-medium">
                                                <span>Product Discount</span>
                                                <span>-₹{productDiscount.toFixed(0)}</span>
                                            </div>
                                        )}

                                        {/* Subtotal after product discounts */}
                                        <div className="flex justify-between text-text-secondary">
                                            <span>{hasProductDiscount ? 'After Discount' : `Subtotal (${getTotalItems()} items)`}</span>
                                            <span className="font-semibold">₹{discountedTotal.toFixed(0)}</span>
                                        </div>

                                        {/* Combo Savings (only if combo applied) */}
                                        {getAppliedCombo() && getSavings() > 0 && (
                                            <div className="flex justify-between text-purple-600 font-medium">
                                                <span>Combo Savings</span>
                                                <span>-₹{getSavings().toFixed(0)}</span>
                                            </div>
                                        )}

                                        {/* Coupon Discount */}
                                        {appliedCoupon && (
                                            <div className="flex justify-between text-amber-600 font-medium">
                                                <span>Coupon Discount ({appliedCoupon.code})</span>
                                                <span>-₹{appliedCoupon.discount.toFixed(0)}</span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            <div className="flex justify-between text-text-secondary">
                                <span>Shipping</span>
                                <span className="text-sm">Calculated at checkout</span>
                            </div>

                            {/* Coupon Code Input */}
                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Have a coupon code?
                                </label>
                                {appliedCoupon ? (
                                    // Show applied coupon
                                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-amber-600" />
                                            <div>
                                                <p className="text-sm font-semibold text-amber-900">
                                                    {appliedCoupon.code} applied!
                                                </p>
                                                <p className="text-xs text-amber-700">
                                                    You saved ₹{appliedCoupon.discount}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setAppliedCoupon(null);
                                                setCouponCode('');
                                                // Clear from localStorage
                                                localStorage.removeItem('appliedCoupon');
                                            }}
                                            className="text-amber-600 hover:text-amber-800 transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    // Show coupon input
                                    <div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value.toUpperCase());
                                                    setCouponError('');
                                                }}
                                                placeholder="Enter code (e.g., TNFIRST50)"
                                                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                                                disabled={validatingCoupon}
                                            />
                                            <Button
                                                onClick={async () => {
                                                    if (!couponCode.trim()) {
                                                        setCouponError('Please enter a coupon code');
                                                        return;
                                                    }

                                                    setValidatingCoupon(true);
                                                    setCouponError('');

                                                    try {
                                                        const response = await couponApi.validate(couponCode, subtotal);

                                                        if (response.success && response.data) {
                                                            const appliedCouponData = {
                                                                code: response.data.code,
                                                                discount: response.data.discount,
                                                            };
                                                            setAppliedCoupon(appliedCouponData);
                                                            // Save to localStorage for checkout
                                                            localStorage.setItem('appliedCoupon', JSON.stringify(appliedCouponData));
                                                            setCouponCode('');
                                                        } else {
                                                            setCouponError(response.error || 'Invalid coupon code');
                                                        }
                                                    } catch (error) {
                                                        setCouponError('Failed to validate coupon. Please try again.');
                                                    } finally {
                                                        setValidatingCoupon(false);
                                                    }
                                                }}
                                                variant="outline"
                                                disabled={!couponCode.trim() || validatingCoupon}
                                                className="px-6"
                                            >
                                                {validatingCoupon ? 'Validating...' : 'Apply'}
                                            </Button>
                                        </div>
                                        {couponError && (
                                            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                {couponError}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <div className="flex justify-between text-xl font-bold text-text-primary">
                                    <span>Total</span>
                                    <span>₹{finalTotal.toFixed(0)}</span>
                                </div>
                                <p className="text-xs text-text-secondary mt-2">
                                    Final total and shipping will be calculated at checkout based on your delivery location
                                </p>
                            </div>
                        </div>

                        <Link href={canCheckout ? "/checkout" : "#"}>
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={!canCheckout}
                            >
                                {hasUnavailable ? 'Remove Unavailable Items' : 'Proceed to Checkout'}
                            </Button>
                        </Link>

                        <Link href="/">
                            <Button variant="outline" className="w-full mt-3">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
