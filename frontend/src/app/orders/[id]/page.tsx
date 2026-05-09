'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { WholesaleOrder } from '@orchids/shared';
import Link from 'next/link';
import { Truck, Package, Calendar, MapPin, CreditCard, Tag, ArrowLeft, FileText } from 'lucide-react';
import { getCloudinaryUrl } from '@/lib/cloudinaryImage';

/**
 * Order Status Page
 * Universal page for viewing wholesale order details after checkout
 * Supports both wholesale and retail order types (hybrid compatibility)
 */

import { useAuthToken } from '@/hooks/useAuthToken';
import { formatDate, formatDateOnly, formatRelative } from '@/lib/dateUtils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

            // Dynamically build the API URL securely
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

            // Try wholesale API first using authenticated fetch
            const response = await authenticatedFetch(`${apiUrl}/wholesale/orders/${orderId}`);

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
            <div className="bg-white border-2 border-primary/10 rounded-2xl p-8 mb-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 select-none pointer-events-none">
                    <Package size={120} className="text-primary -rotate-12" />
                </div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-3">
                            <span className="px-2 py-0.5 bg-primary/10 rounded text-[10px] font-black uppercase tracking-widest">
                                Wholesale Order
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-none mb-4 flex flex-wrap items-center gap-3">
                            {order.invoiceNumber ? `Invoice #${order.invoiceNumber}` : 'Order Confirmed'}
                            {order.items.length > 1 && (
                                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest font-black">
                                    {order.items.length} Products
                                </span>
                            )}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-5 h-5 text-primary/60" />
                                <span className="font-medium">{formatDateOnly(order.createdAt)}</span>
                                <span className="text-xs text-gray-400">({formatRelative(order.createdAt)})</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-3 min-w-[180px]">
                        <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest text-center w-full shadow-sm ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                        </div>
                        <div className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Payment Status</p>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-black ${getPaymentStatusColor(order.paymentStatus)}`}>
                                    {order.paymentStatus === 'paid' ? '✓ PAID' : order.paymentStatus.toUpperCase()}
                                </span>
                                <CreditCard className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-100">
                    <div className="group">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 group-hover:text-primary transition-colors">Order Reference</p>
                        <p className="font-mono text-xs text-gray-800 break-all select-all">{order.id}</p>
                    </div>
                    {order.invoiceNumber && (
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Official Invoice</p>
                            <p className="font-mono text-sm font-bold text-gray-900">#{order.invoiceNumber}</p>
                        </div>
                    )}
                    {order.gatewayPaymentId && (
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Transaction ID</p>
                            <p className="font-mono text-xs text-gray-600 truncate">{order.gatewayPaymentId}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Shipment Tracking (Visible to User) */}
            {(order.trackingNumber || order.courierName) && (
                <div className="bg-white border-2 border-primary/20 rounded-xl p-6 mb-6 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Truck size={80} className="text-primary rotate-12" />
                    </div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Truck className="w-6 h-6 text-primary" />
                        Shipment Tracking
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Courier Partner</p>
                            <p className="text-lg font-semibold text-gray-900">{order.courierName || 'Local Courier'}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Tracking ID / Shipping ID</p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-mono font-bold text-primary">{order.trackingNumber || 'N/A'}</p>
                                {order.trackingNumber && (
                                    <button
                                        onClick={() => navigator.clipboard.writeText(order.trackingNumber!)}
                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        title="Copy Tracking ID"
                                    >
                                        <Tag className="w-4 h-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                            Your order is currently {order.orderStatus}. Use the Tracking ID above with {order.courierName || 'your courier'} to track the live status.
                        </p>
                    </div>
                </div>
            )}

            {/* Order Items */}
            <div className="bg-white border rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                    {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex gap-4 pb-6 border-b last:border-0 border-gray-100">
                            <div className="w-24 h-32 bg-white rounded-xl overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center p-2">
                                {item.productImage ? (
                                    <img
                                        src={getCloudinaryUrl(item.productImage, { width: 300 })}
                                        alt={item.productTitle}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-200" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{item.productTitle}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {item.bundlesOrdered} × {item.bundleQty} pcs bundle
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase">
                                    Composition: {Object.entries(item.bundleComposition || {})
                                        .map(([size, qty]) => `${size}:${qty}`)
                                        .join(', ')}
                                </p>
                                <p className="text-xs text-primary font-bold mt-2">
                                    ₹{item.pricePerBundle.toLocaleString('en-IN', { minimumFractionDigits: 2 })} / bundle
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-gray-900">₹{item.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                    TOTAL: {item.bundlesOrdered * item.bundleQty} PIECES
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
                                        {formatDate(history.changedAt)}
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
                    onClick={() => {
                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                        const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
                        window.open(`${apiUrl}/invoices/${order.id}?download=false`, '_blank');
                    }}
                    className="px-6 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                    <FileText className="w-5 h-5" />
                    Download Tax Invoice
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
