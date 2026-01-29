'use client';

import { useRouter } from 'next/navigation';
import { useCartStore as useWholesaleCartStore } from '@/store/wholesaleCartStore';
import Image from 'next/image';

/**
 * Wholesale Shopping Cart Page
 * Dedicated cart for wholesale bundle-based orders
 * Uses wholesaleCartStore instead of retail cartStore
 */

export default function WholesaleCartPage() {
    const router = useRouter();
    const {
        items,
        removeBundle,
        updateBundleQty,
        clearCart,
        getSubtotal,
        getGST,
        getTotal,
        getTotalBundles,
        getTotalPieces,
        gstRate,
    } = useWholesaleCartStore();

    if (items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">Your cart is empty</p>
                    <button
                        onClick={() => router.push('/products')}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                    >
                        Browse Products
                    </button>
                </div>
            </div>
        );
    }

    const subtotal = getSubtotal();
    const gst = getGST();
    const total = getTotal();

    return (
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-heading font-bold text-gray-900">
                        Shopping Cart <span className="text-gray-400 font-normal text-lg ml-2">({items.length} items)</span>
                    </h1>
                    <button
                        onClick={() => {
                            if (confirm('Clear all items from cart?')) {
                                clearCart();
                            }
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                        Clear Cart
                    </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Cart Items List */}
                    <div className="lg:col-span-8 space-y-6">
                        {items.map((item) => (
                            <div
                                key={item.product.id}
                                className="bg-white border boundary-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex gap-6"
                            >
                                {/* Product Image */}
                                <div className="w-32 h-40 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative border border-gray-100">
                                    {item.product.images.length > 0 ? (
                                        <img
                                            src={item.product.images[0]}
                                            alt={item.product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                                                {item.product.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Bundle Size: <span className="font-medium text-gray-900">{item.product.bundleQty} pieces</span>
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold text-primary">
                                            ₹{(item.bundlesOrdered * item.product.bundlePrice).toLocaleString('en-IN')}
                                        </p>
                                    </div>

                                    {/* Size Specs */}
                                    <div className="mt-2 mb-auto">
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(item.product.bundleComposition).map(([size, qty]) => (
                                                <span key={size} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                                    {size}: {qty}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Controls Row */}
                                    <div className="flex items-end justify-between mt-4">
                                        <div className="flex items-center gap-4">
                                            {/* Quantity Control */}
                                            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                                                <button
                                                    onClick={() => updateBundleQty(item.product.id, item.bundlesOrdered - 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-900 transition-all disabled:opacity-30"
                                                    disabled={item.bundlesOrdered <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="w-10 text-center font-bold text-sm text-gray-900">
                                                    {item.bundlesOrdered}
                                                </span>
                                                <button
                                                    onClick={() => updateBundleQty(item.product.id, item.bundlesOrdered + 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-gray-900 transition-all disabled:opacity-30"
                                                    disabled={item.bundlesOrdered >= item.product.availableBundles}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeBundle(item.product.id)}
                                                className="text-xs font-medium text-gray-400 hover:text-red-600 underline decoration-dotted underline-offset-2 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">
                                                {item.bundlesOrdered * item.product.bundleQty} total pieces
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm sticky top-24">
                            <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">Order Summary</h2>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    <span className="block text-2xl font-bold text-gray-900">{getTotalBundles()}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Bundles</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    <span className="block text-2xl font-bold text-gray-900">{getTotalPieces()}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Px Total</span>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>GST ({(gstRate * 100).toFixed(0)}%)</span>
                                    <span className="font-medium text-gray-900">₹{gst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-end pt-2">
                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                    <span className="text-3xl font-heading font-bold text-primary">₹{total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/wholesale/checkout')}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all mb-4"
                            >
                                Proceed to Checkout
                            </button>

                            <button
                                onClick={() => router.push('/products')}
                                className="w-full py-3 text-gray-500 font-medium hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
