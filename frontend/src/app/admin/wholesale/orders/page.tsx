'use client';

import { useEffect, useState } from 'react';
import { WholesaleOrder } from '@tntrends/shared';

/**
 * Admin Order Management Dashboard
 * Display orders with status management and manual discount controls
 */

import { useAuthToken } from '@/hooks/useAuthToken';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AdminOrdersPage() {
    const { authenticatedFetch, loading: authLoading } = useAuthToken();
    const [orders, setOrders] = useState<WholesaleOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [discountModal, setDiscountModal] = useState<{
        orderId: string;
        currentTotal: number;
    } | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountReason, setDiscountReason] = useState('');

    useEffect(() => {
        if (!authLoading) {
            loadOrders();
        }
    }, [selectedStatus, authLoading]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const url =
                selectedStatus === 'all'
                    ? `${API_BASE}/wholesale/orders`
                    : `${API_BASE}/wholesale/orders?status=${selectedStatus}`;

            const response = await authenticatedFetch(url);

            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string, notes: string = '') => {
        try {
            const response = await authenticatedFetch(`${API_BASE}/wholesale/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderStatus: newStatus, notes }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Order status updated successfully');
                loadOrders();
            } else {
                alert(`Failed to update status: ${data.error}`);
            }
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleApplyDiscount = async () => {
        if (!discountModal) return;

        if (discountReason.trim().length < 10) {
            alert('Discount reason must be at least 10 characters');
            return;
        }

        try {
            const response = await authenticatedFetch(
                `${API_BASE}/wholesale/orders/${discountModal.orderId}/discount`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        discount: discountAmount,
                        reason: discountReason,
                    }),
                }
            );

            const data = await response.json();
            if (data.success) {
                alert('Discount applied successfully');
                setDiscountModal(null);
                setDiscountAmount(0);
                setDiscountReason('');
                loadOrders();
            } else {
                alert(`Failed to apply discount: ${data.error}`);
            }
        } catch (err) {
            alert('Failed to apply discount');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            placed: 'bg-blue-100 text-blue-800',
            processing: 'bg-yellow-100 text-yellow-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Order Management</h1>

            {/* Status Filter */}
            <div className="mb-6 flex gap-2">
                <button
                    onClick={() => setSelectedStatus('all')}
                    className={`px-4 py-2 rounded-lg ${selectedStatus === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                        }`}
                >
                    All Orders
                </button>
                {['placed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-4 py-2 rounded-lg capitalize ${selectedStatus === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="text-center py-12">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No orders found</p>
                </div>
            ) : (
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-mono">{order.id.slice(0, 8)}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            {order.items.length} item(s)
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold">
                                            ₹{order.totalAmount.toFixed(2)}
                                        </div>
                                        {order.adminDiscount > 0 && (
                                            <div className="text-xs text-green-600">
                                                -₹{order.adminDiscount.toFixed(2)} discount
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                order.orderStatus
                                            )}`}
                                        >
                                            {order.orderStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`text-sm ${order.paymentStatus === 'paid'
                                                ? 'text-green-600'
                                                : 'text-yellow-600'
                                                }`}
                                        >
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <select
                                                onChange={(e) =>
                                                    handleStatusUpdate(order.id, e.target.value)
                                                }
                                                className="text-sm border rounded px-2 py-1"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>
                                                    Update Status
                                                </option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancel</option>
                                            </select>
                                            <button
                                                onClick={() =>
                                                    setDiscountModal({
                                                        orderId: order.id,
                                                        currentTotal: order.totalAmount,
                                                    })
                                                }
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                Apply Discount
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Discount Modal */}
            {discountModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Apply Manual Discount</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Discount Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    max={discountModal.currentTotal}
                                    min={0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Reason (min 10 characters) *
                                </label>
                                <textarea
                                    value={discountReason}
                                    onChange={(e) => setDiscountReason(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows={3}
                                    placeholder="e.g., Customer loyalty discount, damaged goods compensation"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleApplyDiscount}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={() => {
                                        setDiscountModal(null);
                                        setDiscountAmount(0);
                                        setDiscountReason('');
                                    }}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
