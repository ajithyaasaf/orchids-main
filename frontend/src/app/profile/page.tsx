'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { orderApi, invoiceApi } from '@/lib/api';
import { WholesaleOrder } from '@orchids/shared';
import { Package, User, LogOut, MapPin, FileText, Eye, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddressManager } from '@/components/ui/AddressManager';
import { auth } from '@/lib/firebase';
import { formatDateOnly, formatRelative } from '@/lib/dateUtils';
import { getCloudinaryUrl } from '@/lib/cloudinaryImage';

type ProfileTab = 'profile' | 'addresses' | 'orders';

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, initialized } = useAuthStore();
    const [orders, setOrders] = useState<WholesaleOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [ordersError, setOrdersError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ProfileTab>('orders');
    const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

    useEffect(() => {
        if (!initialized) return;

        if (!user) {
            router.push('/auth/login?redirect=/profile');
            return;
        }

        loadOrders();
    }, [user, initialized, router]);

    const loadOrders = async () => {
        if (!user) return;
        try {
            setLoading(true);
            setOrdersError(null);
            const response = await orderApi.getByUserId(user.uid);
            setOrders(response?.data ?? []);
        } catch (error: any) {
            console.error('Failed to load orders:', error);
            setOrdersError(error.message || 'Failed to load orders.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    // Invoice handlers
    const handleViewInvoice = async (orderId: string) => {
        if (!user) return;
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const token = await currentUser.getIdToken();
            const blob = await invoiceApi.downloadInvoice(orderId, token);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Clean up after a delay
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Failed to view invoice:', error);
        }
    };

    const handleDownloadInvoice = async (orderId: string) => {
        if (!user) return;
        try {
            setDownloadingInvoice(orderId);
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const token = await currentUser.getIdToken();
            const blob = await invoiceApi.downloadInvoice(orderId, token);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${orderId.slice(-8)}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download invoice:', error);
        } finally {
            setDownloadingInvoice(null);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="container-custom section">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <User className="w-10 h-10 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary">{user.email}</h2>
                            <p className="text-text-secondary text-sm mt-1">Customer</p>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full px-4 py-3 text-left rounded-lg transition flex items-center gap-2 ${activeTab === 'profile'
                                    ? 'bg-primary-light text-primary font-medium'
                                    : 'hover:bg-pink-50'
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                Profile Details
                            </button>
                            <button
                                onClick={() => setActiveTab('addresses')}
                                className={`w-full px-4 py-3 text-left rounded-lg transition flex items-center gap-2 ${activeTab === 'addresses'
                                    ? 'bg-primary-light text-primary font-medium'
                                    : 'hover:bg-pink-50'
                                    }`}
                            >
                                <MapPin className="w-4 h-4" />
                                Address Book
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`w-full px-4 py-3 text-left rounded-lg transition flex items-center gap-2 ${activeTab === 'orders'
                                    ? 'bg-primary-light text-primary font-medium'
                                    : 'hover:bg-pink-50'
                                    }`}
                            >
                                <Package className="w-4 h-4" />
                                Order History
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 text-left text-error hover:bg-error/10 rounded-lg transition flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                    {/* Profile Details Tab */}
                    {activeTab === 'profile' && (
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary mb-8">Profile Details</h1>
                            <div className="bg-white rounded-xl shadow-soft p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-text-secondary">Email</label>
                                        <p className="text-text-primary font-medium mt-1">{user.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text-secondary">Account Type</label>
                                        <p className="text-text-primary font-medium mt-1 capitalize">{user.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Address Book Tab */}
                    {activeTab === 'addresses' && <AddressManager />}

                    {activeTab === 'orders' && (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h1 className="text-3xl font-bold text-text-primary">Order History</h1>
                                <button
                                    onClick={loadOrders}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>

                            {ordersError && (
                                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-700 font-medium text-sm">Could not load orders</p>
                                        <p className="text-red-500 text-xs mt-1">{ordersError}</p>
                                    </div>
                                </div>
                            )}

                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="bg-gray-100 animate-pulse h-32 rounded-xl" />
                                    ))}
                                </div>
                            ) : orders.length > 0 ? (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="bg-white rounded-xl shadow-soft p-6">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border relative group">
                                                            {order.items && order.items[0]?.productImage ? (
                                                                <>
                                                                    <img
                                                                        src={getCloudinaryUrl(order.items[0].productImage, { width: 150 })}
                                                                        alt={order.items[0].productTitle}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {order.items.length > 1 && (
                                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none transition-opacity group-hover:bg-black/20">
                                                                            <span className="text-[10px] font-black text-white bg-primary px-1.5 py-0.5 rounded shadow-sm">
                                                                                +{order.items.length - 1}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <Package className="w-6 h-6 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-text-primary leading-tight flex items-center gap-2">
                                                                {order.invoiceNumber ? `Invoice #${order.invoiceNumber}` : 'Order Confirmed'}
                                                                {order.items.length > 1 && (
                                                                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full border border-gray-200 uppercase tracking-widest font-black">
                                                                        {order.items.length} Products
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            <p className="text-xs text-text-secondary font-mono mt-1 opacity-70">
                                                                ID: {order.id.toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                                        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {formatDateOnly((order as any).createdAt)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-left md:text-right bg-primary-light/30 md:bg-transparent p-3 md:p-0 rounded-lg">
                                                    <p className="text-xs uppercase tracking-wider text-text-secondary font-bold mb-0.5">Total Amount</p>
                                                    <p className="text-2xl font-black text-primary">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                                    <div className="mt-1">
                                                        <span
                                                            className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${order.paymentStatus === 'paid' ? 'bg-success text-white' : 'bg-error text-white'
                                                                }`}
                                                        >
                                                            {order.paymentStatus === 'paid' ? '✓ PAID' : order.paymentStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-border pt-4 mb-4">
                                                <h4 className="font-semibold mb-2 text-sm">Items:</h4>
                                                <ul className="space-y-1">
                                                    {order.items.slice(0, 3).map((item: any, idx) => (
                                                        <li key={idx} className="text-sm text-text-secondary flex items-center gap-2">
                                                            <div className="w-1 h-1 bg-primary/30 rounded-full" />
                                                            {item.productTitle} — {item.bundlesOrdered} Bundle{item.bundlesOrdered > 1 ? 's' : ''}
                                                        </li>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <li className="text-xs text-primary font-bold mt-2 pl-3">
                                                            + {order.items.length - 3} more product{order.items.length - 3 > 1 ? 's' : ''} in this order
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-border pt-4">
                                                <span className="text-sm text-text-secondary">Order Status:</span>
                                                <div className="flex flex-col items-end">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-sm font-medium ${order.orderStatus === 'delivered'
                                                            ? 'bg-success/10 text-success'
                                                            : order.orderStatus === 'cancelled'
                                                                ? 'bg-error/10 text-error'
                                                                : 'bg-primary-light text-primary'
                                                            }`}
                                                    >
                                                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                                    </span>
                                                    {(order as any).trackingNumber && (
                                                        <span className="text-[10px] text-gray-500 mt-1 font-mono">
                                                            Tracking: {(order as any).trackingNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Invoice Download */}
                                            {order.paymentStatus === 'paid' && order.orderStatus !== 'cancelled' ? (
                                                <div className="border-t border-border pt-4 mt-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => handleViewInvoice(order.id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-primary-light hover:bg-pink-100 text-primary rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Invoice
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadInvoice(order.id)}
                                                            disabled={downloadingInvoice === order.id}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            {downloadingInvoice === order.id ? 'Downloading...' : 'Download Invoice'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : order.paymentStatus === 'pending' ? (
                                                <div className="border-t border-border pt-4 mt-4">
                                                    <p className="text-sm text-gray-500 italic">Invoice will be available after payment confirmation</p>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-soft p-12 text-center">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-text-primary mb-2">No orders yet</h3>
                                    <p className="text-text-secondary mb-6">Start shopping to see your orders here!</p>
                                    <Button onClick={() => router.push('/')}>Start Shopping</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
