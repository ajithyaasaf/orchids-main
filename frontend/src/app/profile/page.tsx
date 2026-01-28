'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { orderApi, invoiceApi } from '@/lib/api';
import { Order } from '@tntrends/shared';
import { Package, User, LogOut, MapPin, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AddressManager } from '@/components/ui/AddressManager';
import { auth } from '@/lib/firebase';

type ProfileTab = 'profile' | 'addresses' | 'orders';

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ProfileTab>('orders');
    const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            router.push('/auth/login?redirect=/profile');
            return;
        }

        loadOrders();
    }, [user, router]);

    const loadOrders = async () => {
        if (!user) return;

        try {
            const { data } = await orderApi.getByUserId(user.uid);
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
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

                    {/* Order History Tab */}
                    {activeTab === 'orders' && (
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary mb-8">Order History</h1>

                            {loading ? (
                                <div className="text-center py-12">
                                    <p>Loading orders...</p>
                                </div>
                            ) : orders.length > 0 ? (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="bg-white rounded-xl shadow-soft p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Package className="w-5 h-5 text-primary" />
                                                        <h3 className="font-bold text-text-primary">
                                                            Order #{order.id.substring(0, 8)}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-text-secondary">
                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-primary">₹{order.totalAmount}</p>
                                                    <span
                                                        className={`text-sm ${order.paymentStatus === 'paid' ? 'text-success' : 'text-error'
                                                            }`}
                                                    >
                                                        {order.paymentStatus === 'paid' ? 'PAID' : order.paymentStatus.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="border-t border-border pt-4 mb-4">
                                                <h4 className="font-semibold mb-2 text-sm">Items:</h4>
                                                <ul className="space-y-1">
                                                    {order.items.map((item: any, idx) => (
                                                        <li key={idx} className="text-sm text-text-secondary">
                                                            {item.bundleQty ? (
                                                                // Wholesale Item
                                                                <span>{item.productTitle} - {item.bundlesOrdered} Bundles ({item.bundleQty} pcs/bundle)</span>
                                                            ) : (
                                                                // Retail Item
                                                                <span>{item.productTitle} - Size {item.size} × {item.quantity}</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-border pt-4">
                                                <span className="text-sm text-text-secondary">Order Status:</span>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${order.orderStatus === 'delivered'
                                                        ? 'bg-success/10 text-success'
                                                        : order.orderStatus === 'cancelled'
                                                            ? 'bg-error/10 text-error'
                                                            : 'bg-primary-light text-primary'  // Replaced primary/10 with primary-light for better visibility
                                                        }`}
                                                >
                                                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                                </span>
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
