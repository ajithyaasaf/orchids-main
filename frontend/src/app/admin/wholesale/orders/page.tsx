'use client';

import { useEffect, useState, useCallback } from 'react';
import { WholesaleOrder } from '@orchids/shared';
import { useAuthToken } from '@/hooks/useAuthToken';
import { wholesaleOrdersApi } from '@/lib/api/wholesaleApi';
import { formatDate, formatRelative, toDate } from '@/lib/dateUtils';
import {
    Package, RefreshCw, Search, AlertCircle, X, Truck,
    MessageSquare, MapPin, CreditCard, Clock, ChevronRight,
    FileText, Phone, StickyNote, TrendingUp, ShoppingBag,
    Loader2, CheckCircle2, IndianRupee
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderStats {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    unpaidAmount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
    placed: { bg: 'bg-primary-light border-primary/20', text: 'text-primary', dot: 'bg-primary' },
    processing: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    shipped: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
    delivered: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
    cancelled: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
};

const PAYMENT_STYLE: Record<string, string> = {
    paid: 'text-green-600 font-semibold',
    pending: 'text-amber-600 font-semibold',
    failed: 'text-red-600 font-semibold',
    refunded: 'text-gray-500 font-semibold',
};

// Valid next transitions per current status
const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
    placed: [{ value: 'processing', label: '▶ Start Processing' }, { value: 'cancelled', label: '✕ Cancel' }],
    processing: [{ value: 'shipped', label: '🚚 Mark as Shipped' }, { value: 'cancelled', label: '✕ Cancel' }],
    shipped: [{ value: 'delivered', label: '✓ Mark Delivered' }, { value: 'cancelled', label: '✕ Cancel' }],
    delivered: [],
    cancelled: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon, label, value, sub, color
}: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
    return (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${color}`}>
            <div className="p-2 rounded-lg bg-white/60">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs font-medium opacity-70">{label}</p>
                <p className="text-xl font-bold">{value}</p>
                {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_STYLE[status] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

import { StatCardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
    const { authenticatedFetch, loading: authLoading } = useAuthToken();
    const { showToast } = useToast();

    // List state
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Detail panel state
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Action modals
    const [trackingModal, setTrackingModal] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [courierName, setCourierName] = useState('');
    const [noteText, setNoteText] = useState('');
    const [discountModal, setDiscountModal] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountReason, setDiscountReason] = useState('');

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });
    const apiBase = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

    // ─── Data Loading ─────────────────────────────────────────────────────────

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const status = selectedStatus === 'all' ? undefined : selectedStatus;
            const data = await wholesaleOrdersApi.getAll(status);
            setOrders(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, [selectedStatus]);

    const loadStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const res = await authenticatedFetch(`${apiBase}/wholesale/orders/stats/summary`);
            if (res.ok) {
                const json = await res.json();
                if (json.success) setStats(json.data);
            }
        } catch {
            // Stats are non-critical, fail silently
        } finally {
            setStatsLoading(false);
        }
    }, [authenticatedFetch, apiBase]);

    const refreshSelectedOrder = useCallback(async (orderId: string) => {
        try {
            const res = await authenticatedFetch(`${apiBase}/wholesale/orders/${orderId}`);
            const json = await res.json();
            if (json.success) setSelectedOrder(json.data);
        } catch {/* silent */ }
    }, [authenticatedFetch, apiBase]);

    useEffect(() => {
        let ignore = false;

        async function initFetch() {
            if (authLoading) return;

            try {
                setLoading(true);
                setStatsLoading(true);
                setError(null);

                const statusQuery = selectedStatus === 'all' ? undefined : selectedStatus;

                // Concurrent fetching for better UX/performance
                const [ordersData, statsRes] = await Promise.all([
                    wholesaleOrdersApi.getAll(statusQuery),
                    authenticatedFetch(`${apiBase}/wholesale/orders/stats/summary`)
                ]);

                if (ignore) return;

                setOrders(ordersData);
                if (statsRes.ok) {
                    const statsJson = await statsRes.json();
                    if (statsJson.success) setStats(statsJson.data);
                }
            } catch (err: any) {
                if (!ignore) setError(err.message || 'Failed to load order data');
            } finally {
                if (!ignore) {
                    setLoading(false);
                    setStatsLoading(false);
                }
            }
        }

        initFetch();
        return () => { ignore = true; };
    }, [selectedStatus, authLoading, authenticatedFetch, apiBase]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        if (!newStatus) return;
        // If shipping, prompt for tracking
        if (newStatus === 'shipped') {
            setTrackingModal(true);
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Status Change',
            message: `Are you sure you want to change this order status to "${newStatus}"?`,
            confirmText: 'Update Status',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    setUpdatingId(orderId);
                    await wholesaleOrdersApi.updateStatus(orderId, newStatus, `Changed to ${newStatus} by admin`);
                    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
                    if (selectedOrder?.id === orderId) {
                        await refreshSelectedOrder(orderId);
                    }
                    showToast(`Status updated to ${newStatus}`, 'success');
                    loadStats();
                } catch (err: any) {
                    showToast(err.message || 'Failed to update status', 'error');
                } finally {
                    setUpdatingId(null);
                }
            }
        } as any);
    };

    const handleAddTracking = async () => {
        if (!selectedOrder) return;
        if (!trackingNumber.trim() || !courierName.trim()) {
            showToast('Please enter both courier name and tracking number.', 'error');
            return;
        }
        try {
            setUpdatingId(selectedOrder.id);
            const apiBase = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

            // Save tracking info
            await authenticatedFetch(`${apiBase}/wholesale/orders/${selectedOrder.id}/tracking`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackingNumber: trackingNumber.trim(), courierName: courierName.trim() }),
            });

            // Update status to shipped
            await wholesaleOrdersApi.updateStatus(selectedOrder.id, 'shipped', `Shipped via ${courierName} — Tracking: ${trackingNumber}`);

            setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, orderStatus: 'shipped', trackingNumber: trackingNumber.trim(), courierName: courierName.trim() } : o));
            await refreshSelectedOrder(selectedOrder.id);
            setTrackingModal(false);
            setTrackingNumber('');
            setCourierName('');
            loadStats();
            showToast('Order marked as shipped', 'success');
        } catch (err: any) {
            showToast(`Failed: ${err.message}`, 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAddNote = async () => {
        if (!selectedOrder || !noteText.trim()) return;
        try {
            const apiBase = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;
            await authenticatedFetch(`${apiBase}/wholesale/orders/${selectedOrder.id}/notes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: noteText.trim() }),
            });
            setNoteText('');
            await refreshSelectedOrder(selectedOrder.id);
            showToast('Note added', 'success');
        } catch (err: any) {
            showToast(`Failed: ${err.message}`, 'error');
        }
    };

    const handleApplyDiscount = async () => {
        if (!selectedOrder || !discountReason || discountReason.trim().length < 10) {
            showToast('Reason must be at least 10 characters', 'error');
            return;
        }
        try {
            const apiBase = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;
            const res = await authenticatedFetch(`${apiBase}/wholesale/orders/${selectedOrder.id}/discount`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discount: discountAmount, reason: discountReason }),
            });
            const json = await res.json();
            if (json.success) {
                setDiscountModal(false);
                setDiscountAmount(0);
                setDiscountReason('');
                await refreshSelectedOrder(selectedOrder.id);
                loadOrders();
                loadStats();
                showToast('Discount applied', 'success');
            } else {
                showToast(json.error, 'error');
            }
        } catch (err: any) {
            showToast(`Failed: ${err.message}`, 'error');
        }
    };

    // WhatsApp message helper
    const buildWhatsAppMessage = (order: any) => {
        const name = order.address?.name || 'Customer';
        const orderId = order.id?.slice(0, 8).toUpperCase();
        const status = order.orderStatus;
        const tracking = order.trackingNumber
            ? `\n🚚 Tracking: ${order.courierName} — ${order.trackingNumber}`
            : '';
        return encodeURIComponent(
            `Hello ${name},\n\nYour ORCHID Wholesale order #${orderId} has been updated to *${status}*.${tracking}\n\nThank you for shopping with us! 🌸`
        );
    };

    // ─── Filtered Orders ──────────────────────────────────────────────────────

    const filteredOrders = orders.filter((order) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            order.id?.toLowerCase().includes(q) ||
            order.userId?.toLowerCase().includes(q) ||
            order.address?.name?.toLowerCase().includes(q) ||
            order.address?.phone?.toLowerCase().includes(q)
        );
    });

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="max-w-screen-xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {loading ? 'Loading...' : `Showing ${filteredOrders.length} of ${orders.length} orders`}
                    </p>
                </div>
                <button
                    onClick={() => { loadOrders(); loadStats(); }}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {statsLoading ? (
                    [1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)
                ) : (
                    <>
                        <StatCard icon={IndianRupee} label="Total Revenue" value={stats ? `₹${stats.totalRevenue.toFixed(0)}` : '0'} sub="Paid orders" color="bg-green-50 border-green-200 text-green-800" />
                        <StatCard icon={ShoppingBag} label="New Orders" value={stats?.pending ?? 0} sub="Awaiting processing" color="bg-primary-light border-primary/10 text-primary" />
                        <StatCard icon={Truck} label="Shipped" value={stats?.shipped ?? 0} sub="In transit" color="bg-purple-50 border-purple-200 text-purple-800" />
                        <StatCard icon={TrendingUp} label="Unpaid Amount" value={stats ? `₹${stats.unpaidAmount.toFixed(0)}` : '0'} sub="Pending payments" color="bg-amber-50 border-amber-200 text-amber-800" />
                    </>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                {['all', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition ${selectedStatus === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {s === 'all' ? 'All Orders' : s}
                        {stats && s !== 'all' && (
                            <span className="ml-1.5 opacity-60">
                                ({(stats as any)[s === 'placed' ? 'pending' : s] ?? 0})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by Order ID, Customer Name or Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm flex-1">{error}</p>
                    <button onClick={loadOrders} className="text-sm text-red-600 hover:underline">Retry</button>
                </div>
            )}

            {/* Orders Table */}
            {loading ? (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50/50 border-b border-gray-100 h-10 w-full" />
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <TableRowSkeleton key={i} columns={7} />
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-semibold">No orders found</p>
                    <p className="text-gray-400 text-sm mt-1">
                        {selectedStatus !== 'all' ? `No "${selectedStatus}" orders` : searchQuery ? 'Try a different search term' : 'Orders will appear here'}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Payment', ''].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className={`hover:bg-primary-light/30 cursor-pointer transition-colors ${updatingId === order.id ? 'opacity-50 pointer-events-none' : ''
                                        } ${selectedOrder?.id === order.id ? 'bg-primary-light/50' : ''}`}
                                >
                                    {/* Order ID */}
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-mono font-bold text-primary">
                                            #{order.id?.slice(0, 8).toUpperCase()}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {formatRelative(order.createdAt)}
                                        </div>
                                    </td>

                                    {/* Customer */}
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-medium text-gray-800">
                                            {order.address?.name || '—'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {order.address?.phone || order.userId?.slice(0, 10) + '...'}
                                        </div>
                                    </td>

                                    {/* Items */}
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-semibold">{order.items?.length} item(s)</div>
                                        <div className="text-xs text-gray-400 max-w-[160px] truncate">
                                            {order.items?.map((i: any) => i.productTitle).join(', ')}
                                        </div>
                                    </td>

                                    {/* Total */}
                                    <td className="px-4 py-4">
                                        <div className="font-bold text-gray-900">₹{order.totalAmount?.toFixed(2)}</div>
                                        {order.adminDiscount > 0 && (
                                            <div className="text-xs text-green-600">-₹{order.adminDiscount} off</div>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-4">
                                        <StatusBadge status={order.orderStatus} />
                                        {order.trackingNumber && (
                                            <div className="text-xs text-purple-500 mt-1">📦 {order.courierName}</div>
                                        )}
                                    </td>

                                    {/* Payment */}
                                    <td className="px-4 py-4">
                                        <span className={`text-sm ${PAYMENT_STYLE[order.paymentStatus] || 'text-gray-600'}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>

                                    {/* Arrow */}
                                    <td className="px-4 py-4">
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Order Detail Side Panel ─────────────────────────────────────── */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-xl bg-white shadow-2xl h-full overflow-y-auto">
                        {/* Panel Header */}
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                            <div>
                                <h2 className="font-bold text-lg text-gray-900">
                                    Order #{selectedOrder.id?.slice(0, 8).toUpperCase()}
                                </h2>
                                <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status + Quick Actions */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <StatusBadge status={selectedOrder.orderStatus} />
                                    <span className={`text-sm ${PAYMENT_STYLE[selectedOrder.paymentStatus] || ''}`}>
                                        {selectedOrder.paymentStatus?.toUpperCase()}
                                    </span>
                                </div>

                                {/* Status actions */}
                                {(NEXT_STATUSES[selectedOrder.orderStatus] || []).length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {NEXT_STATUSES[selectedOrder.orderStatus].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleStatusUpdate(selectedOrder.id, opt.value)}
                                                disabled={!!updatingId}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${opt.value === 'cancelled'
                                                    ? 'border-red-300 text-red-600 hover:bg-red-50'
                                                    : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                                                    } disabled:opacity-50`}
                                            >
                                                {updatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedOrder.orderStatus === 'delivered' && (
                                    <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
                                        <CheckCircle2 className="w-4 h-4" /> Order completed
                                    </div>
                                )}
                            </div>

                            {/* Customer Info */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    <MapPin className="w-3.5 h-3.5 inline mr-1" />Customer & Delivery
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
                                    <p className="font-semibold text-gray-900">{selectedOrder.address?.name || '—'}</p>
                                    {selectedOrder.address?.phone && (
                                        <p className="text-gray-600 flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            <a href={`tel:${selectedOrder.address.phone}`} className="hover:text-primary transition-colors">
                                                {selectedOrder.address.phone}
                                            </a>
                                        </p>
                                    )}
                                    <p className="text-gray-600">
                                        {[selectedOrder.address?.line1, selectedOrder.address?.line2, selectedOrder.address?.city, selectedOrder.address?.state, selectedOrder.address?.pincode].filter(Boolean).join(', ')}
                                    </p>
                                    {/* WhatsApp Link */}
                                    {selectedOrder.address?.phone && (
                                        <a
                                            href={`https://wa.me/91${selectedOrder.address.phone.replace(/\D/g, '')}?text=${buildWhatsAppMessage(selectedOrder)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Notify via WhatsApp
                                        </a>
                                    )}
                                </div>
                            </section>

                            {/* Items */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    <Package className="w-3.5 h-3.5 inline mr-1" />Items Ordered
                                </h3>
                                <div className="space-y-2">
                                    {selectedOrder.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 text-sm">
                                            <div className="w-10 h-10 bg-white rounded border border-gray-200 overflow-hidden shrink-0">
                                                {item.productImage ? (
                                                    <img src={item.productImage} alt={item.productTitle} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                        <Package className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{item.productTitle}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.bundlesOrdered} bundle{item.bundlesOrdered > 1 ? 's' : ''} × {item.bundleQty} pcs @ ₹{item.pricePerBundle}/bundle
                                                </p>
                                            </div>
                                            <p className="font-semibold shrink-0">₹{item.lineTotal?.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Price Breakdown */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    <CreditCard className="w-3.5 h-3.5 inline mr-1" />Price Breakdown
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>₹{selectedOrder.subtotal?.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-600">GST ({(selectedOrder.gstRate * 100).toFixed(0)}%)</span><span>₹{selectedOrder.gst?.toFixed(2)}</span></div>
                                    {selectedOrder.shipping > 0 && (
                                        <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>₹{selectedOrder.shipping?.toFixed(2)}</span></div>
                                    )}
                                    {selectedOrder.adminDiscount > 0 && (
                                        <div className="flex justify-between text-green-600"><span>Admin Discount</span><span>-₹{selectedOrder.adminDiscount?.toFixed(2)}</span></div>
                                    )}
                                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                                        <span>Total</span>
                                        <span>₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                                    </div>
                                </div>
                                {/* Discount button */}
                                {selectedOrder.paymentStatus === 'paid' && selectedOrder.orderStatus !== 'cancelled' && (
                                    <button
                                        onClick={() => setDiscountModal(true)}
                                        className="mt-2 text-xs text-primary hover:underline"
                                    >
                                        + Apply Manual Discount
                                    </button>
                                )}
                            </section>

                            {/* Tracking */}
                            {selectedOrder.trackingNumber ? (
                                <section>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                        <Truck className="w-3.5 h-3.5 inline mr-1" />Shipment Tracking
                                    </h3>
                                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm">
                                        <p className="font-semibold text-purple-800">{selectedOrder.courierName}</p>
                                        <p className="text-purple-600 font-mono">{selectedOrder.trackingNumber}</p>
                                    </div>
                                </section>
                            ) : selectedOrder.orderStatus === 'processing' ? (
                                <section>
                                    <button
                                        onClick={() => setTrackingModal(true)}
                                        className="w-full px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl text-sm hover:border-gray-400 hover:text-gray-700 transition"
                                    >
                                        <Truck className="w-4 h-4 inline mr-1" />Add Tracking Number
                                    </button>
                                </section>
                            ) : null}

                            {/* Status Timeline */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    <Clock className="w-3.5 h-3.5 inline mr-1" />Status History
                                </h3>
                                <div className="relative pl-4 border-l-2 border-gray-200 space-y-4">
                                    {(selectedOrder.statusHistory || []).map((entry: any, i: number) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white border-2 border-gray-400" />
                                            <p className="text-sm font-semibold capitalize text-gray-800">{entry.status}</p>
                                            {entry.notes && <p className="text-xs text-gray-500">{entry.notes}</p>}
                                            <p className="text-xs text-gray-400">{formatDate(entry.changedAt)}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Admin Notes */}
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    <StickyNote className="w-3.5 h-3.5 inline mr-1" />Internal Notes
                                </h3>
                                {(selectedOrder.adminNotes || []).length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {selectedOrder.adminNotes.map((n: any, i: number) => (
                                            <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                                                <p className="text-gray-800">{n.text}</p>
                                                <p className="text-xs text-gray-400 mt-1">{formatDate(n.addedAt)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        placeholder="Add an internal note..."
                                        rows={2}
                                        className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!noteText.trim()}
                                        className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-gray-800"
                                    >
                                        Add
                                    </button>
                                </div>
                            </section>

                            {/* Payment IDs */}
                            {selectedOrder.gatewayOrderId && !selectedOrder.gatewayOrderId.startsWith('test_') && (
                                <section>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        <FileText className="w-3.5 h-3.5 inline mr-1" />Payment Reference
                                    </h3>
                                    <div className="text-xs font-mono bg-gray-50 rounded-lg p-3 text-gray-600 space-y-1">
                                        <p>Gateway Order ID: {selectedOrder.gatewayOrderId}</p>
                                        {selectedOrder.gatewayPaymentId && <p>Payment ID: {selectedOrder.gatewayPaymentId}</p>}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                {...confirmModal}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            {/* ─── Tracking Modal ──────────────────────────────────────────── */}
            {trackingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <h2 className="text-lg font-bold mb-4">Add Shipping Tracking</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Courier / Carrier Name</label>
                                <input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. DTDC, Delhivery, Bluedart" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Tracking Number</label>
                                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. 1234567890" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-mono" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={handleAddTracking} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                                    Save & Mark Shipped
                                </button>
                                <button onClick={() => setTrackingModal(false)} className="flex-1 py-2 border rounded-lg text-sm">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Discount Modal ──────────────────────────────────────────── */}
            {discountModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <h2 className="text-lg font-bold mb-1">Apply Discount</h2>
                        <p className="text-sm text-gray-500 mb-4">Current total: ₹{selectedOrder.totalAmount?.toFixed(2)}</p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Discount Amount (₹)</label>
                                <input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} min={0} max={selectedOrder.totalAmount} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Reason (min 10 char)</label>
                                <textarea value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} rows={3} placeholder="Customer loyalty, return compensation..." className="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleApplyDiscount} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium">Apply</button>
                                <button onClick={() => setDiscountModal(false)} className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
