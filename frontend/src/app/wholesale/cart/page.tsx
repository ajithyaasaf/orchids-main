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
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Shopping Cart</h1>
                <button
                    onClick={() => {
                        if (confirm('Clear all items from cart?')) {
                            clearCart();
                        }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                >
                    Clear Cart
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.product.id}
                            className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex gap-4">
                                {/* Product Image */}
                                <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
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
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1">
                                        {item.product.title}
                                    </h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            Bundle: {item.product.bundleQty} pieces
                                        </p>
                                        <p className="text-xs">
                                            Composition: {Object.entries(item.product.bundleComposition)
                                                .map(([size, qty]) => `${size}:${qty}`)
                                                .join(', ')}
                                        </p>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    updateBundleQty(
                                                        item.product.id,
                                                        item.bundlesOrdered - 1
                                                    )
                                                }
                                                className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                                                disabled={item.bundlesOrdered <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="w-12 text-center font-semibold">
                                                {item.bundlesOrdered}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    updateBundleQty(
                                                        item.product.id,
                                                        item.bundlesOrdered + 1
                                                    )
                                                }
                                                className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                                                disabled={
                                                    item.bundlesOrdered >= item.product.availableBundles
                                                }
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Price */}
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">
                                                ₹
                                                {(item.bundlesOrdered * item.product.bundlePrice).toFixed(
                                                    2
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {item.bundlesOrdered} × {item.product.bundleQty} ={' '}
                                                {item.bundlesOrdered * item.product.bundleQty} pcs
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeBundle(item.product.id)}
                                        className="mt-2 text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white border rounded-lg p-6 sticky top-6">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                        {/* Statistics */}
                        <div className="bg-blue-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
                            <p className="flex justify-between">
                                <span className="text-gray-600">Total Bundles:</span>
                                <span className="font-semibold">{getTotalBundles()}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-gray-600">Total Pieces:</span>
                                <span className="font-semibold">{getTotalPieces()}</span>
                            </p>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>GST ({(gstRate * 100).toFixed(0)}%):</span>
                                <span className="font-semibold">₹{gst.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span className="text-green-600">₹{total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/wholesale/checkout')}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 mb-3"
                        >
                            Proceed to Checkout
                        </button>

                        <button
                            onClick={() => router.push('/products')}
                            className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
