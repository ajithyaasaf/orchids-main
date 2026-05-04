'use client';

import React, { useEffect, useState } from 'react';
import { wholesaleProductsApi, wholesaleOrdersApi, wholesaleDashboardApi } from '@/lib/api/wholesaleApi';
import { Package, ShoppingBag, TrendingUp, DollarSign, Users, BarChart3, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { DashboardAnalytics } from '@orchids/shared';

import { StatCardSkeleton } from '@/components/ui/Skeleton';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0,
    });
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    const formatINR = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0,
        }).format(amount);
    };

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [products, orders, analyticsData] = await Promise.all([
                    wholesaleProductsApi.getAll(),
                    wholesaleOrdersApi.getAll(),
                    wholesaleDashboardApi.getAnalytics().catch(() => null),
                ]);

                if (analyticsData) {
                    setAnalytics(analyticsData);
                    setStats({
                        totalProducts: products.length,
                        totalOrders: analyticsData.totalOrders,
                        pendingOrders: analyticsData.placedCount + analyticsData.processingCount,
                        revenue: analyticsData.totalRevenue,
                    });
                } else {
                    // Fallback to local calculation if analytics fails
                    const pendingOrdersCount = orders.filter(
                        (o: any) => o.orderStatus === 'placed' || o.orderStatus === 'confirmed' || o.orderStatus === 'processing'
                    ).length;

                    const totalRevenue = orders
                        .filter((o: any) => o.paymentStatus === 'paid')
                        .reduce((sum: number, o: any) => sum + o.totalAmount, 0);

                    setStats({
                        totalProducts: products.length,
                        totalOrders: orders.length,
                        pendingOrders: pendingOrdersCount,
                        revenue: totalRevenue,
                    });
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
            title: 'Total Revenue',
            value: `₹${formatINR(stats.revenue)}`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            title: 'Pending Orders',
            value: stats.pendingOrders,
            icon: TrendingUp,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingBag,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        {
            title: 'Total Products',
            value: stats.totalProducts,
            icon: Package,
            color: 'text-slate-600',
            bg: 'bg-slate-50',
        },
    ];

    const customerCards = analytics ? [
        {
            title: 'Total Customers',
            value: formatINR(analytics.totalCustomers),
            subtitle: `+${analytics.newCustomersThisMonth} this month`,
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
        },
        {
            title: 'Avg Order Value',
            value: `₹${formatINR(Math.round(analytics.averageOrderValue))}`,
            subtitle: `${analytics.returningCustomerRate.toFixed(1)}% return rate`,
            icon: BarChart3,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
    ] : [];

    return (
        <div className="animate-in fade-in duration-500">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back. Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                        href="/admin/wholesale/products/new"
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Product</span>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <StatCardSkeleton key={i} />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        <div className="lg:col-span-2 h-[300px] bg-white rounded-3xl border border-gray-50 shadow-sm animate-pulse p-8">
                            <div className="w-1/4 h-6 bg-gray-100 rounded-md mb-8" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-32 bg-gray-50 rounded-2xl" />
                                <div className="h-32 bg-gray-50 rounded-2xl" />
                            </div>
                        </div>
                        <div className="h-[300px] bg-gray-900 rounded-3xl animate-pulse p-8" />
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Primary Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {statCards.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div 
                                    key={stat.title} 
                                    className="group bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{stat.title}</p>
                                            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
                                        </div>
                                        <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Secondary Insights & Quick Links */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Customers / Insights */}
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 sm:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Customer Insights</h2>
                                <Link href="/admin/analytics" className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1 group">
                                    View Report <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            
                            {customerCards.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {customerCards.map((stat) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div key={stat.title} className="p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-gray-600">{stat.title}</h3>
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                                <p className="text-xs font-medium text-emerald-600 mt-1">{stat.subtitle}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                    <p>Not enough data to generate insights yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Streamlined Quick Links */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
                            
                            <h2 className="text-lg font-bold mb-6 relative z-10">Manage Store</h2>
                            <div className="space-y-3 relative z-10">
                                <Link
                                    href="/admin/wholesale/orders"
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ShoppingBag className="w-5 h-5 text-gray-300" />
                                        <span className="font-semibold">View Orders</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/admin/wholesale/products"
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-gray-300" />
                                        <span className="font-semibold">Inventory</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/admin/customers"
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-gray-300" />
                                        <span className="font-semibold">Customers</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

