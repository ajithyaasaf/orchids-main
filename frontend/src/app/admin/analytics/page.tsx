'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import type { DashboardAnalytics } from '@tntrends/shared';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRebuilding, setIsRebuilding] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await dashboardApi.getAnalytics();
            setAnalytics(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleRebuild = async () => {
        if (!confirm('This will recalculate all analytics from scratch. This is expensive and should only be used for data recovery. Continue?')) {
            return;
        }

        try {
            setIsRebuilding(true);
            await dashboardApi.rebuildCache();
            await fetchAnalytics();
            alert('Analytics cache rebuilt successfully!');
        } catch (err: any) {
            alert('Failed to rebuild cache: ' + err.message);
        } finally {
            setIsRebuilding(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error || 'No analytics data available'}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
                    <p className="text-gray-600 mt-1">Comprehensive insights and metrics</p>
                </div>
                <button
                    onClick={handleRebuild}
                    disabled={isRebuilding}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400 text-sm"
                >
                    {isRebuilding ? 'Rebuilding...' : 'Rebuild Cache'}
                </button>
            </div>

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Revenue"
                    value={`₹${analytics.totalRevenue.toLocaleString()}`}
                    subtitle={`Today: ₹${analytics.revenueToday.toLocaleString()}`}
                    color="blue"
                />
                <MetricCard
                    title="This Month"
                    value={`₹${analytics.revenueThisMonth.toLocaleString()}`}
                    subtitle={`This Year: ₹${analytics.revenueThisYear.toLocaleString()}`}
                    color="green"
                />
                <MetricCard
                    title="Total Orders"
                    value={analytics.totalOrders.toLocaleString()}
                    subtitle={`Today: ${analytics.ordersToday} | Month: ${analytics.ordersThisMonth}`}
                    color="purple"
                />
                <MetricCard
                    title="Average Order Value"
                    value={`₹${Math.round(analytics.averageOrderValue).toLocaleString()}`}
                    subtitle="Across all orders"
                    color="yellow"
                />
            </div>

            {/* Customer Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard
                    title="Total Customers"
                    value={analytics.totalCustomers.toLocaleString()}
                    subtitle={`New Today: ${analytics.newCustomersToday} | This Month: ${analytics.newCustomersThisMonth}`}
                    color="indigo"
                />
                <MetricCard
                    title="Returning Customer Rate"
                    value={`${analytics.returningCustomerRate.toFixed(1)}%`}
                    subtitle="Customers with 2+ orders"
                    color="pink"
                />
                <MetricCard
                    title="Customer Lifetime"
                    value={analytics.totalCustomers > 0 ? `₹${Math.round(analytics.totalRevenue / analytics.totalCustomers).toLocaleString()}` : '₹0'}
                    subtitle="Avg revenue per customer"
                    color="teal"
                />
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Revenue Trend (Last 30 Days)</h2>
                <div className="h-64 flex items-end justify-between gap-1">
                    {analytics.revenueTrend.map((day, index) => {
                        const maxRevenue = Math.max(...analytics.revenueTrend.map(d => d.revenue));
                        const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                        return (
                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                                <div
                                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                                    style={{ height: `${height}%` }}
                                ></div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 mt-2 whitespace-nowrap z-10">
                                    <div>{new Date(day.date).toLocaleDateString()}</div>
                                    <div>₹{day.revenue.toLocaleString()}</div>
                                    <div>{day.orders} orders</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 text-center text-sm text-gray-500">
                    Hover over bars to see details
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Products */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Top Products by Revenue</h2>
                    <div className="space-y-3">
                        {analytics.topProducts.map((product, index) => (
                            <div key={product.productId} className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{product.productTitle}</p>
                                    <p className="text-sm text-gray-500">{product.unitsSold} units sold</p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className="font-bold text-green-600">₹{product.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top States */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Top States by Revenue</h2>
                    <div className="space-y-3">
                        {analytics.topStates.map((state, index) => (
                            <div key={state.state} className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900">{state.state}</p>
                                    <p className="text-sm text-gray-500">{state.orderCount} orders</p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className="font-bold text-green-600">₹{state.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    subtitle,
    color
}: {
    title: string;
    value: string;
    subtitle: string;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        yellow: 'from-yellow-500 to-yellow-600',
        indigo: 'from-indigo-500 to-indigo-600',
        pink: 'from-pink-500 to-pink-600',
        teal: 'from-teal-500 to-teal-600',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-lg p-6 text-white`}>
            <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-xs opacity-75">{subtitle}</p>
        </div>
    );
}
