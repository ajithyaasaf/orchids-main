'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/wholesaleCartStore';
import { wholesaleCheckoutApi } from '@/lib/api/wholesaleApi';

/**
 * Wholesale Checkout Component
 * Displays cart items with GST breakdown and handles order placement
 */

interface CalculatedOrder {
    items: any[];
    subtotal: number;
    gstRate: number;
    gst: number;
    totalAmount: number;
}

export default function WholesaleCheckout() {
    const router = useRouter();
    const { items, clearCart, fetchGSTRate } = useCartStore();

    const [address, setAddress] = useState({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
    });

    const [calculatedOrder, setCalculatedOrder] = useState<CalculatedOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchGSTRate();

        if (items.length === 0) {
            router.push('/products');
        }
    }, [items]);

    const handleCalculate = async () => {
        try {
            setLoading(true);
            setError('');

            const checkoutItems = items.map((item) => ({
                productId: item.product.id,
                bundlesOrdered: item.bundlesOrdered,
            }));

            const result = await wholesaleCheckoutApi.calculate(checkoutItems, address);
            setCalculatedOrder(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!calculatedOrder) {
            alert('Please calculate order first');
            return;
        }

        try {
            setLoading(true);

            // Create order on backend
            const response = await fetch('/api/wholesale/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    items: calculatedOrder.items,
                    address,
                    subtotal: calculatedOrder.subtotal,
                    gstRate: calculatedOrder.gstRate,
                    gst: calculatedOrder.gst,
                    totalAmount: calculatedOrder.totalAmount,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to create order');
            }

            const orderId = data.data.id;

            // Initialize Razorpay payment
            await initiatePayment(orderId, calculatedOrder.totalAmount);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const initiatePayment = async (orderId: string, amount: number) => {
        // Create Razorpay order
        const response = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({ orderId }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to initialize payment');
        }

        const { orderId: razorpayOrderId, key } = data.data;

        // Load Razorpay and initiate payment
        const options = {
            key,
            amount: amount * 100, // Razorpay expects paise
            currency: 'INR',
            name: 'Wholesale Orchids',
            description: 'Order Payment',
            order_id: razorpayOrderId,
            handler: async (response: any) => {
                // Verify payment
                await verifyPayment(orderId, response);
            },
            prefill: {
                name: address.name,
                contact: address.phone,
            },
            theme: {
                color: '#3B82F6',
            },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
    };

    const verifyPayment = async (orderId: string, razorpayResponse: any) => {
        try {
            const response = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    orderId,
                    razorpayOrderId: razorpayResponse.razorpay_order_id,
                    razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                    razorpaySignature: razorpayResponse.razorpay_signature,
                }),
            });

            const data = await response.json();

            if (data.success) {
                clearCart();
                router.push(`/orders/${orderId}?success=true`);
            } else {
                alert('Payment verification failed');
            }
        } catch (err) {
            alert('Payment verification failed');
        }
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Cart Items */}
            <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-start pb-4 border-b">
                            <div className="flex-1">
                                <h3 className="font-semibold">{item.product.title}</h3>
                                <p className="text-sm text-gray-600">
                                    {item.bundlesOrdered} × {item.product.bundleQty} pcs bundle
                                </p>
                                <p className="text-xs text-gray-500">
                                    ({Object.entries(item.product.bundleComposition)
                                        .map(([size, qty]) => `${size}:${qty}`)
                                        .join(', ')})
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">
                                    ₹{(item.bundlesOrdered * item.product.bundlePrice).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    ₹{item.product.bundlePrice} per bundle
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Address Form */}
            <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Full Name *"
                        value={address.name}
                        onChange={(e) => setAddress({ ...address, name: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                        required
                    />
                    <input
                        type="tel"
                        placeholder="Phone Number *"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Address Line 1 *"
                        value={address.addressLine1}
                        onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                        className="col-span-2 px-4 py-2 border rounded-lg"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Address Line 2"
                        value={address.addressLine2}
                        onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                        className="col-span-2 px-4 py-2 border rounded-lg"
                    />
                    <input
                        type="text"
                        placeholder="City *"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                        required
                    />
                    <input
                        type="text"
                        placeholder="State *"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Pincode *"
                        value={address.pincode}
                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                        maxLength={6}
                        required
                    />
                </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Price Breakdown</h2>
                {calculatedOrder ? (
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold">
                                ₹{calculatedOrder.subtotal.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>GST ({(calculatedOrder.gstRate * 100).toFixed(0)}%):</span>
                            <span className="font-semibold">₹{calculatedOrder.gst.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-green-600">
                                ₹{calculatedOrder.totalAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        Click "Calculate Order" to see final price with GST
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                {!calculatedOrder ? (
                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        {loading ? 'Calculating...' : 'Calculate Order'}
                    </button>
                ) : (
                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300"
                    >
                        {loading ? 'Processing...' : 'Proceed to Payment'}
                    </button>
                )}

                <button
                    onClick={() => router.push('/cart')}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Back to Cart
                </button>
            </div>
        </div>
    );
}
