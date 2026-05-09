'use client';

import { useState, useEffect } from 'react';
import { customerApi } from '@/lib/api';
import type { CustomerInsight } from '@orchids/shared';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<CustomerInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSegment, setFilterSegment] = useState('');
    const [lastDocId, setLastDocId] = useState<string | undefined>();
    const [hasMore, setHasMore] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerInsight | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => { fetchCustomers(); }, [filterSegment]);

    const fetchCustomers = async (loadMore = false) => {
        try {
            setLoading(true);
            const params: any = { limit: 20 };
            if (filterSegment) params.segment = filterSegment;
            if (searchTerm) params.search = searchTerm;
            if (loadMore && lastDocId) params.lastDocId = lastDocId;

            const response = await customerApi.getAll(params);
            if (loadMore) {
                setCustomers(prev => [...prev, ...response.data]);
            } else {
                setCustomers(response.data);
            }
            setLastDocId(response.pagination.lastDocId);
            setHasMore(response.pagination.hasMore);
        } catch (err: any) {
            showToast(err.message || 'Failed to load customers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLastDocId(undefined);
        fetchCustomers();
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const params: any = {};
            if (filterSegment) params.segment = filterSegment;
            if (searchTerm) params.search = searchTerm;
            const blob = await customerApi.exportCSV(params);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('Export successful', 'success');
        } catch (err: any) {
            showToast('Failed to export: ' + err.message, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const viewCustomerDetails = async (userId: string) => {
        try {
            const response = await customerApi.getById(userId);
            setSelectedCustomer(response.data);
        } catch (err: any) {
            showToast('Failed to load customer details: ' + err.message, 'error');
        }
    };

    const segmentBadge = (segment: string) => {
        const map: Record<string, string> = {
            vip: 'bg-purple-100 text-purple-800',
            returning: 'bg-blue-100 text-blue-800',
            new: 'bg-green-100 text-green-800',
            'at-risk': 'bg-yellow-100 text-yellow-800',
            inactive: 'bg-gray-100 text-gray-600',
        };
        return map[segment] || map.inactive;
    };

    const fmtDate = (d: any) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
                    <p className="text-gray-500 mt-1">Wholesale buyer analytics and order history</p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
                <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
                    <input
                        type="text"
                        placeholder="Search by name or email…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                    <select
                        value={filterSegment}
                        onChange={e => setFilterSegment(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                        <option value="">All Segments</option>
                        <option value="vip">VIP</option>
                        <option value="returning">Returning</option>
                        <option value="new">New</option>
                        <option value="at-risk">At Risk</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold">
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-50 font-bold"
                    >
                        {isExporting ? 'Exporting…' : 'Export CSV'}
                    </button>
                </form>
            </div>

            {/* Table */}
            {loading && !customers.length ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-100 h-10 w-full" />
                    {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} columns={7} />)}
                </div>
            ) : customers.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="p-3 inline-flex rounded-full bg-white shadow-sm mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <p className="text-xl font-bold text-gray-900">No customers found</p>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto text-sm">
                        Customers appear here after they complete a paid wholesale order.
                        Use <strong>Resync Metrics</strong> to backfill existing buyers.
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Customer', 'Segment', 'Orders', 'Total Spent', 'AOV', 'Last Order', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {customers.map(c => (
                                    <tr key={c.uid} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{c.name}</div>
                                            <div className="text-sm text-gray-500">{c.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${segmentBadge(c.segment)}`}>
                                                {c.segment.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.metadata.totalOrders}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{c.metadata.totalSpent.toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">₹{Math.round(c.metadata.averageOrderValue).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{fmtDate(c.metadata.lastOrderDate)}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => viewCustomerDetails(c.uid)}
                                                className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {hasMore && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => fetchCustomers(true)}
                                disabled={loading}
                                className="px-8 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
                            >
                                {loading ? 'Loading…' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                                <p className="text-gray-500">{selectedCustomer.email}</p>
                                {selectedCustomer.phone && <p className="text-sm text-gray-400 mt-0.5">📞 {selectedCustomer.phone}</p>}
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-indigo-50 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Total Orders</p>
                                    <p className="text-2xl font-bold text-indigo-700">{selectedCustomer.metadata.totalOrders}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Total Spent</p>
                                    <p className="text-2xl font-bold text-green-700">₹{selectedCustomer.metadata.totalSpent.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Avg Order</p>
                                    <p className="text-2xl font-bold text-purple-700">₹{Math.round(selectedCustomer.metadata.averageOrderValue).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl">
                                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Customer Since</p>
                                    <p className="text-2xl font-bold text-amber-700">{selectedCustomer.metadata.lifetime}d</p>
                                </div>
                            </div>

                            {/* Order History */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Wholesale Order History</h3>
                            {selectedCustomer.orderHistory.length === 0 ? (
                                <p className="text-gray-400 text-sm italic">No orders yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedCustomer.orderHistory.map((order: any) => (
                                        <div key={order.id} className="border border-gray-200 rounded-xl p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">Order #{(order.id || '').slice(-8).toUpperCase()}</p>
                                                    <p className="text-sm text-gray-500">{fmtDate(order.createdAt)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {order.orderStatus}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bundle Items */}
                                            <div className="text-sm text-gray-600 space-y-1 mb-3">
                                                {(order.items || []).map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between">
                                                        <span>{item.productTitle} × {item.bundlesOrdered} bundle(s)</span>
                                                        <span className="font-medium">₹{item.lineTotal?.toLocaleString('en-IN')}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Shipping */}
                                            {order.address && (
                                                <div className="pt-3 border-t border-gray-100 text-sm text-gray-600">
                                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Ship To</p>
                                                    <p className="font-medium text-gray-700">{order.address.name}</p>
                                                    <p>{order.address.addressLine1}{order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}</p>
                                                    <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
