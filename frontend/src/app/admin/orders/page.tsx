'use client';

import React, { useEffect, useState } from 'react';
import { orderApi, invoiceApi } from '@/lib/api';
import { Order } from '@tntrends/shared';
import { Package, Clock, Truck, CheckCircle, XCircle, FileText, Package as BoxIcon, Download, Eye } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/lib/firebase';

const statusConfig = {
    placed: { label: 'Placed', icon: Package, color: 'text-blue-500' },
    confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-green-500' },
    shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-500' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-success' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-error' },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const { showToast } = useToast();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
    const [downloadingPackingSlip, setDownloadingPackingSlip] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const { data } = await orderApi.getAll();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: Order['orderStatus']) => {
        try {
            await orderApi.updateStatus(orderId, newStatus);
            setOrders(orders.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
            showToast('Order status updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update order status', 'error');
        }
    };

    // Invoice download handlers
    const handleViewInvoice = async (orderId: string) => {
        if (!user) {
            showToast('Please login to view invoice', 'error');
            return;
        }
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showToast('Please login to view invoice', 'error');
                return;
            }
            const token = await currentUser.getIdToken();
            const blob = await invoiceApi.downloadInvoice(orderId, token);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Clean up after a delay to ensure the PDF opens
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('View invoice error:', error);
            showToast('Failed to view invoice', 'error');
        }
    };

    const handleDownloadInvoice = async (orderId: string) => {
        if (!user) {
            showToast('Please login to download invoice', 'error');
            return;
        }
        try {
            setDownloadingInvoice(orderId);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showToast('Please login to download invoice', 'error');
                return;
            }
            const token = await currentUser.getIdToken();
            const blob = await invoiceApi.downloadInvoice(orderId, token);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${orderId.slice(-8)}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('Invoice downloaded successfully', 'success');
        } catch (error) {
            console.error('Download invoice error:', error);
            showToast('Failed to download invoice', 'error');
        } finally {
            setDownloadingInvoice(null);
        }
    };

    const handleDownloadPackingSlip = async (orderId: string) => {
        if (!user) {
            showToast('Please login to download packing slip', 'error');
            return;
        }
        try {
            setDownloadingPackingSlip(orderId);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showToast('Please login to download packing slip', 'error');
                return;
            }
            const token = await currentUser.getIdToken();
            const blob = await invoiceApi.downloadPackingSlip(orderId, token);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `packing-slip-${orderId.slice(-8)}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('Packing slip downloaded successfully', 'success');
        } catch (error) {
            console.error('Download packing slip error:', error);
            showToast('Failed to download packing slip', 'error');
        } finally {
            setDownloadingPackingSlip(null);
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.orderStatus === filter);

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 md:mb-8">Orders</h1>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-soft p-4 md:p-6 mb-4 md:mb-6">
                <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                    {['all', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-3 rounded-lg font-medium whitespace-nowrap transition text-sm md:text-base min-w-[100px] md:min-w-0 ${filter === status
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-text-secondary hover:bg-gray-200 active:bg-gray-300'
                                }`}
                        >
                            {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p>Loading orders...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const StatusIcon = statusConfig[order.orderStatus].icon;

                        return (
                            <div key={order.id} className="bg-white rounded-xl shadow-soft p-4 md:p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-text-primary">
                                                Order #{order.id.substring(0, 8)}
                                            </h3>
                                            <span className={`flex items-center gap-1 ${statusConfig[order.orderStatus].color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {statusConfig[order.orderStatus].label}
                                            </span>
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
                                        <p className="text-xl md:text-2xl font-bold text-primary">₹{order.totalAmount}</p>
                                        <span className={`text-sm ${order.paymentStatus === 'paid' ? 'text-success' : 'text-error'
                                            }`}>
                                            {order.paymentStatus.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="border-t border-border pt-4 mb-4">
                                    <h4 className="font-semibold mb-2">Items:</h4>
                                    <ul className="space-y-1">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className="text-sm text-text-secondary">
                                                {item.productTitle} - Size {item.size} × {item.quantity}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Coupon Used (if any) */}
                                {order.appliedCoupon && (
                                    <div className="border-t border-border pt-4 mb-4">
                                        <h4 className="font-semibold mb-2">Coupon Applied:</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 text-sm font-medium rounded-full">
                                                {order.appliedCoupon.code}
                                            </span>
                                            <span className="text-sm text-success font-medium">
                                                Saved ₹{order.appliedCoupon.discount}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Shipping Address */}
                                <div className="border-t border-border pt-4 mb-4">
                                    <h4 className="font-semibold mb-2">Shipping Address:</h4>
                                    <p className="text-sm text-text-secondary break-words">
                                        {order.address.name}<br />
                                        {order.address.addressLine1}, {order.address.addressLine2}<br />
                                        {order.address.city}, {order.address.state} - {order.address.pincode}<br />
                                        Phone: {order.address.phone}
                                    </p>
                                </div>

                                {/* Status Update */}
                                <div className="border-t border-border pt-4">
                                    <label className="block text-sm font-medium mb-2">Update Status:</label>
                                    <select
                                        value={order.orderStatus}
                                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as any)}
                                        className="w-full md:w-auto px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="placed">Placed</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Invoice & Packing Slip Actions */}
                                {order.paymentStatus === 'paid' && order.orderStatus !== 'cancelled' && (
                                    <div className="border-t border-border pt-4 mt-4">
                                        <h4 className="font-semibold mb-3 text-sm">Invoice & Documents:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {/* View Invoice */}
                                            <button
                                                onClick={() => handleViewInvoice(order.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Invoice
                                            </button>

                                            {/* Download Invoice */}
                                            <button
                                                onClick={() => handleDownloadInvoice(order.id)}
                                                disabled={downloadingInvoice === order.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                <FileText className="w-4 h-4" />
                                                {downloadingInvoice === order.id ? 'Downloading...' : 'Download Invoice'}
                                            </button>

                                            {/* Download Packing Slip */}
                                            <button
                                                onClick={() => handleDownloadPackingSlip(order.id)}
                                                disabled={downloadingPackingSlip === order.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                <BoxIcon className="w-4 h-4" />
                                                {downloadingPackingSlip === order.id ? 'Downloading...' : 'Packing Slip'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-soft">
                            <p className="text-text-secondary">No orders found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
