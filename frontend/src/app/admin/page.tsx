'use client';

import React, { useEffect, useState } from 'react';
import { productApi, orderApi, dashboardApi } from '@/lib/api';
import { Package, ShoppingBag, TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';
import type { DashboardAnalytics } from '@tntrends/shared';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0,
    });
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [productsRes, ordersRes, analyticsRes] = await Promise.all([
                    productApi.getAll({ limit: 1000 }),
                    orderApi.getAll({ limit: 1000 }),
                    dashboardApi.getAnalytics().catch(() => null), // Don't fail if analytics not ready
                ]);

                const products = productsRes.data;
                const orders = ordersRes.data;

                const pendingOrders = orders.filter(
                    (o: any) => o.orderStatus === 'placed' || o.orderStatus === 'confirmed'
                );

                const totalRevenue = orders
                    .filter((o: any) => o.paymentStatus === 'paid')
                    .reduce((sum: number, o: any) => sum + o.totalAmount, 0);

                setStats({
                    totalProducts: products.length,
                    totalOrders: orders.length,
                    pendingOrders: pendingOrders.length,
                    revenue: totalRevenue,
                });

                if (analyticsRes?.success) {
                    setAnalytics(analyticsRes.data);
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const statCards = [
        {
            title: 'Total Products',
            value: stats.totalProducts,
            icon: Package,
            color: 'bg-blue-500',
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingBag,
            color: 'bg-green-500',
        },
        {
            title: 'Pending Orders',
            value: stats.pendingOrders,
            icon: TrendingUp,
            color: 'bg-yellow-500',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats.revenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-primary',
        },
    ];

    // Add customer widgets if analytics available
    const customerCards = analytics ? [
        {
            title: 'Total Customers',
            value: analytics.totalCustomers.toLocaleString(),
            subtitle: `New this month: ${analytics.newCustomersThisMonth}`,
            icon: Users,
            color: 'bg-purple-500',
        },
        {
            title: 'Avg Order Value',
            value: `₹${Math.round(analytics.averageOrderValue).toLocaleString()}`,
            subtitle: `Returning rate: ${analytics.returningCustomerRate.toFixed(1)}%`,
            icon: BarChart3,
            color: 'bg-indigo-500',
        },
    ] : [];

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 md:mb-8">Dashboard</h1>

            {loading ? (
                <div className="text-center py-12">
                    <p>Loading dashboard...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.title} className="bg-white rounded-xl shadow-soft p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`${stat.color} p-3 rounded-lg`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-text-secondary text-sm mb-1">{stat.title}</h3>
                                    <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Customer Metrics */}
                    {customerCards.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                            {customerCards.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.title} className="bg-white rounded-xl shadow-soft p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`${stat.color} p-3 rounded-lg`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <h3 className="text-text-secondary text-sm mb-1">{stat.title}</h3>
                                        <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                                        <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-soft p-4 md:p-6">
                        <h2 className="text-lg md:text-xl font-bold text-text-primary mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            <a
                                href="/admin/products/new"
                                className="p-4 md:p-5 border-2 border-border rounded-lg hover:border-primary transition text-center active:bg-gray-50"
                            >
                                <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <p className="font-semibold">Add New Product</p>
                            </a>
                            <a
                                href="/admin/orders"
                                className="p-4 md:p-5 border-2 border-border rounded-lg hover:border-primary transition text-center active:bg-gray-50"
                            >
                                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <p className="font-semibold">Manage Orders</p>
                            </a>
                            <a
                                href="/admin/customers"
                                className="p-4 md:p-5 border-2 border-border rounded-lg hover:border-primary transition text-center active:bg-gray-50"
                            >
                                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <p className="font-semibold">View Customers</p>
                            </a>
                            <a
                                href="/admin/analytics"
                                className="p-4 md:p-5 border-2 border-border rounded-lg hover:border-primary transition text-center active:bg-gray-50"
                            >
                                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
                                <p className="font-semibold">View Analytics</p>
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
