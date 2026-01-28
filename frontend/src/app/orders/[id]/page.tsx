'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { WholesaleOrder } from '@tntrends/shared';
import Link from 'next/link';

/**
 * Order Status Page
 * Universal page for viewing wholesale order details after checkout
 * Supports both wholesale and retail order types (hybrid compatibility)
 */

import { useAuthToken } from '@/hooks/useAuthToken';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function OrderStatusPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { authenticatedFetch, loading: authLoading } = useAuthToken();

    const orderId = params.id as string;
    const isSuccess = searchParams.get('success') === 'true';

    const [order, setOrder] = useState<WholesaleOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading) {
            loadOrder();
        }
    }, [orderId, authLoading]);

    const loadOrder = async () => {
        try {
            setLoading(true);

            // Try wholesale API first using authenticated fetch
            const response = await authenticatedFetch(`${API_BASE}/wholesale/orders/${orderId}`);

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load order');
            }

            setOrder(data.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            placed: 'bg-primary-light text-primary',
            processing: 'bg-yellow-100 text-yellow-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getPaymentStatusColor = (status: string) => {
        return status === 'paid'
            ? 'text-green-600'
            : status === 'failed'
                ? 'text-red-600'
                : 'text-yellow-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-8 text-center">
                    <div className="text-red-600 text-5xl mb-4">✗</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
                    <Link
                        href="/products"
                        className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"
                    >
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Success Banner (shows on redirect from payment) */}
            {isSuccess && order.paymentStatus === 'paid' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start">
                        <div className="text-green-500 text-4xl mr-4">✓</div>
                        <div>
                            <h2 className="text-2xl font-bold text-green-900 mb-2">
                                Order Placed Successfully!
                            </h2>
                            <p className="text-green-700 mb-3">
                                Thank you for your purchase. Your order has been confirmed and payment received.
                            </p>
                            <p className="text-sm text-green-600">
                                Order ID: <span className="font-mono font-semibold">{order.id}</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Header */}
            <div className="bg-white border rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Order Details</h1>
                        <p className="text-gray-600">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="mb-2">
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus.toUpperCase()}
                            </span>
                        </div>
                        <div className={`text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                            Payment: {order.paymentStatus.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Order ID & Invoice */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-mono font-semibold">{order.id}</p>
                    </div>
                    {order.invoiceNumber && (
                        <div>
                            <p className="text-sm text-gray-600">Invoice Number</p>
                            <p className="font-mono font-semibold">{order.invoiceNumber}</p>
                        </div>
                    )}
                    {order.razorpayPaymentId && (
                        <div>
                            <p className="text-sm text-gray-600">Payment ID</p>
                            <p className="font-mono text-sm">{order.razorpayPaymentId}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                    {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-start pb-4 border-b last:border-0">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{item.productTitle}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {item.bundlesOrdered} × {item.bundleQty} pcs bundle
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Composition: {Object.entries(item.bundleComposition || {})
                                        .map(([size, qty]) => `${size}:${qty}`)
                                        .join(', ')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    ₹{item.pricePerBundle.toFixed(2)} per bundle
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold">₹{item.lineTotal.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">
                                    Total: {item.bundlesOrdered * item.bundleQty} pieces
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-primary-light border border-pink-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Price Breakdown</h2>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-700">GST ({(order.gstRate * 100).toFixed(0)}%):</span>
                        <span className="font-semibold">₹{order.gst.toFixed(2)}</span>
                    </div>
                    {order.adminDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span className="font-semibold">-₹{order.adminDiscount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-green-600">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                <div className="text-gray-700">
                    <p className="font-semibold">{order.address.name}</p>
                    <p>{order.address.addressLine1}</p>
                    {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                    <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                    <p>{order.address.country || 'India'}</p>
                    <p className="mt-2">Phone: {order.address.phone}</p>
                </div>
            </div>

            {/* Order Timeline (if status history available) */}
            {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="bg-white border rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Order Timeline</h2>
                    <div className="space-y-3">
                        {order.statusHistory.map((history: any, index: number) => (
                            <div key={index} className="flex items-start border-l-2 border-primary pl-4">
                                <div className="flex-1">
                                    <p className="font-semibold capitalize">{history.status}</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(history.changedAt).toLocaleString('en-IN')}
                                    </p>
                                    {history.notes && (
                                        <p className="text-sm text-gray-700 mt-1">{history.notes}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <Link
                    href="/products"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg text-center font-semibold hover:bg-primary-dark"
                >
                    Continue Shopping
                </Link>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                    Print Order
                </button>
            </div>

            {/* Customer Support Note */}
            <div className="mt-6 text-center text-sm text-gray-600">
                <p>Need help with your order?</p>
                <p className="mt-1">
                    Contact us at{' '}
                    <a href="mailto:support@wholesaleorchids.com" className="text-primary hover:underline">
                        support@wholesaleorchids.com
                    </a>
                </p>
            </div>
        </div>
    );
}
