'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore as useWholesaleCartStore } from '@/store/wholesaleCartStore';
import { wholesaleCheckoutApi } from '@/lib/api/wholesaleApi';

/**
 * Wholesale Checkout Page
 * Dedicated checkout for wholesale orders with GST breakdown
 */

interface CalculatedOrder {
    items: any[];
    subtotal: number;
    gstRate: number;
    gst: number;
    totalAmount: number;
}

export default function WholesaleCheckoutPage() {
    const router = useRouter();
    const { items, clearCart, fetchGSTRate } = useWholesaleCartStore();

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
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="container mx-auto px-6 max-w-7xl">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Checkout</h1>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* Left Column: Forms */}
                    <div className="lg:col-span-7 space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                                <span className="bg-red-100 p-1 rounded-full">⚠️</span>
                                {error}
                            </div>
                        )}

                        {/* Delivery Address */}
                        <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</span>
                                Delivery Address
                            </h2>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={address.name}
                                        onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={address.phone}
                                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="10-digit mobile number"
                                        required
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                                    <input
                                        type="text"
                                        value={address.pincode}
                                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="6-digit pincode"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <input
                                        type="text"
                                        value={address.addressLine1}
                                        onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all mb-3"
                                        placeholder="House No, Building, Street"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={address.addressLine2}
                                        onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Area, Landmark (Optional)"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                    <input
                                        type="text"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                    <input
                                        type="text"
                                        value={address.state}
                                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/wholesale/cart')}
                            className="text-gray-500 font-medium hover:text-gray-900 flex items-center gap-2 transition-colors px-2"
                        >
                            ← Back to Cart
                        </button>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-5 relative">
                        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm sticky top-24">
                            <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">Order Summary</h2>

                            {/* Mini Cart Items */}
                            <div className="max-h-60 overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin scrollbar-thumb-gray-200">
                                {items.map((item) => (
                                    <div key={item.product.id} className="flex gap-4 items-start">
                                        <div className="w-16 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                                            {item.product.images.length > 0 && (
                                                <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{item.product.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {item.bundlesOrdered} bundles × {item.product.bundleQty} pcs
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            ₹{(item.bundlesOrdered * item.product.bundlePrice).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-100">
                                {calculatedOrder ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Subtotal</span>
                                            <span className="font-medium text-gray-900">₹{calculatedOrder.subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>GST ({(calculatedOrder.gstRate * 100).toFixed(0)}%)</span>
                                            <span className="font-medium text-gray-900">₹{calculatedOrder.gst.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3 flex justify-between items-end">
                                            <span className="text-base font-bold text-gray-900">Total Pay</span>
                                            <span className="text-2xl font-heading font-bold text-primary">₹{calculatedOrder.totalAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 mb-3">Calculate taxes & shipping to see total</p>
                                        <button
                                            onClick={handleCalculate}
                                            disabled={loading}
                                            className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-colors"
                                        >
                                            {loading ? 'Calculating...' : 'Calculate Total'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Place Order Button */}
                            {calculatedOrder && (
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all mb-4 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Processing...' : 'Pay Securely'}
                                    {!loading && <span className="text-xl">🔒</span>}
                                </button>
                            )}

                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                <span>SSL Encrypted Payment</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>Powered by Razorpay</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
