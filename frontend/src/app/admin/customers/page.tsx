'use client';

import { useState, useEffect } from 'react';
import { customerApi } from '@/lib/api';
import type { CustomerInsight } from '@tntrends/shared';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<CustomerInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSegment, setFilterSegment] = useState<string>('');
    const [lastDocId, setLastDocId] = useState<string | undefined>();
    const [hasMore, setHasMore] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerInsight | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, [filterSegment]);

    const fetchCustomers = async (loadMore = false) => {
        try {
            setLoading(true);
            const params: any = {
                limit: 20,
            };

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
            setError(err.message || 'Failed to load customers');
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
        } catch (err: any) {
            alert('Failed to export: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const viewCustomerDetails = async (userId: string) => {
        try {
            const response = await customerApi.getById(userId);
            setSelectedCustomer(response.data);
        } catch (err: any) {
            alert('Failed to load customer details: ' + err.message);
        }
    };

    const getSegmentBadgeClass = (segment: string) => {
        const classes = {
            vip: 'bg-purple-100 text-purple-800',
            returning: 'bg-blue-100 text-blue-800',
            new: 'bg-green-100 text-green-800',
            'at-risk': 'bg-yellow-100 text-yellow-800',
            inactive: 'bg-gray-100 text-gray-800',
        };
        return classes[segment as keyof typeof classes] || classes.inactive;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
                <p className="text-gray-600 mt-1">View and manage customer data and insights</p>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                        value={filterSegment}
                        onChange={(e) => setFilterSegment(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Segments</option>
                        <option value="vip">VIP</option>
                        <option value="returning">Returning</option>
                        <option value="new">New</option>
                        <option value="at-risk">At Risk</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                    >
                        {isExporting ? 'Exporting...' : 'Export CSV'}
                    </button>
                </form>
            </div>

            {/* Customer Table */}
            {loading && !customers.length ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading customers...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AOV</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {customers.map((customer) => (
                                    <tr key={customer.uid} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{customer.name}</div>
                                                <div className="text-sm text-gray-500">{customer.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSegmentBadgeClass(customer.segment)}`}>
                                                {customer.segment.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {customer.metadata.totalOrders}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            ₹{customer.metadata.totalSpent.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            ₹{Math.round(customer.metadata.averageOrderValue).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {customer.metadata.lastOrderDate
                                                ? new Date(customer.metadata.lastOrderDate).toLocaleDateString()
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <button
                                                onClick={() => viewCustomerDetails(customer.uid)}
                                                className="text-blue-600 hover:text-blue-900"
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
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => fetchCustomers(true)}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                            >
                                {loading ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                                    <p className="text-gray-600">{selectedCustomer.email}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Customer Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold text-blue-600">{selectedCustomer.metadata.totalOrders}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Total Spent</p>
                                    <p className="text-2xl font-bold text-green-600">₹{selectedCustomer.metadata.totalSpent.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Avg Order Value</p>
                                    <p className="text-2xl font-bold text-purple-600">₹{Math.round(selectedCustomer.metadata.averageOrderValue).toLocaleString()}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Customer Since</p>
                                    <p className="text-2xl font-bold text-yellow-600">{selectedCustomer.metadata.lifetime} days</p>
                                </div>
                            </div>

                            {/* Order History */}
                            <h3 className="text-lg font-semibold mb-4">Order History</h3>
                            <div className="space-y-3">
                                {selectedCustomer.orderHistory.map((order) => (
                                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">₹{order.totalAmount.toLocaleString()}</p>
                                                <span className={`text-xs px-2 py-1 rounded ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.orderStatus}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {order.items.length} item(s) • {order.paymentStatus}
                                        </div>

                                        {/* Shipping Address */}
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ship To:</p>
                                            <div className="text-sm text-gray-700">
                                                <p className="font-medium">{order.address.name}</p>
                                                <p>{order.address.addressLine1}</p>
                                                {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                                                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                                                <p className="text-gray-500">📞 {order.address.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
