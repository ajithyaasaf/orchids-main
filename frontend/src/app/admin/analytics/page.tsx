'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import type { DashboardAnalytics } from '@orchids/shared';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import {
    TrendingUp,
    Calendar,
    ShoppingBag,
    CreditCard,
    Clock,
    Package,
    Truck,
    CheckCircle2,
    XCircle,
    Users,
    AlertCircle,
    RotateCcw,
    RefreshCw,
    MapPin,
    Layers
} from 'lucide-react';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRebuilding, setIsRebuilding] = useState(false);
    const { showToast } = useToast();

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
        onConfirm: () => {}
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await dashboardApi.getAnalytics();
            setAnalytics(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleRebuild = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Rebuild Analytics Cache',
            message: 'This will recalculate all business metrics from raw database orders. Continue?',
            type: 'warning',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    setIsRebuilding(true);
                    await dashboardApi.rebuildCache();
                    await fetchAnalytics();
                    showToast('Analytics cache rebuilt successfully!', 'success');
                } catch (err: any) {
                    showToast('Failed to rebuild cache: ' + err.message, 'error');
                } finally {
                    setIsRebuilding(false);
                }
            }
        });
    };

    // Calculate pipeline total for percentage calculations
    const pipelineTotal = analytics ? (
        (analytics.placedCount || 0) +
        (analytics.processingCount || 0) +
        (analytics.shippedCount || 0) +
        (analytics.deliveredCount || 0) +
        (analytics.cancelledCount || 0)
    ) : 0;

    const getStagePercent = (count: number) => {
        if (!pipelineTotal || pipelineTotal === 0) return 0;
        return Math.round((count / pipelineTotal) * 100);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Business Analytics
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            Live Metrics
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Comprehensive revenue insights, order pipeline, and performance tracking
                    </p>
                </div>
                {!loading && (
                    <button
                        onClick={handleRebuild}
                        disabled={isRebuilding}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-sm hover:shadow text-sm font-semibold disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${isRebuilding ? 'animate-spin' : ''}`} />
                        <span>{isRebuilding ? 'Rebuilding Cache...' : 'Rebuild Cache'}</span>
                    </button>
                )}
            </div>

            {loading ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <StatCardSkeleton key={i} />
                        ))}
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm h-80 animate-pulse" />
                </>
            ) : (error || !analytics) ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-base">Unable to load analytics</p>
                        <p className="text-sm text-red-600 mt-1">{error || 'No analytics data available'}</p>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    {/* Primary Key Performance Indicators */}
                    <section>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <ModernMetricCard
                                title="Total Revenue"
                                value={`₹${analytics.totalRevenue.toLocaleString()}`}
                                icon={TrendingUp}
                                accentColor="emerald"
                                subtitle={
                                    <span className="flex items-center justify-between">
                                        <span>Today</span>
                                        <span className="font-semibold text-slate-700">₹{analytics.revenueToday.toLocaleString()}</span>
                                    </span>
                                }
                            />
                            <ModernMetricCard
                                title="This Month"
                                value={`₹${analytics.revenueThisMonth.toLocaleString()}`}
                                icon={Calendar}
                                accentColor="blue"
                                subtitle={
                                    <span className="flex items-center justify-between">
                                        <span>This Year</span>
                                        <span className="font-semibold text-slate-700">₹{analytics.revenueThisYear.toLocaleString()}</span>
                                    </span>
                                }
                            />
                            <ModernMetricCard
                                title="Total Orders"
                                value={analytics.totalOrders.toLocaleString()}
                                icon={ShoppingBag}
                                accentColor="purple"
                                subtitle={
                                    <span className="flex items-center justify-between">
                                        <span>Today: <strong className="text-slate-700">{analytics.ordersToday}</strong></span>
                                        <span>Month: <strong className="text-slate-700">{analytics.ordersThisMonth}</strong></span>
                                    </span>
                                }
                            />
                            <ModernMetricCard
                                title="Average Order Value"
                                value={`₹${Math.round(analytics.averageOrderValue).toLocaleString()}`}
                                icon={CreditCard}
                                accentColor="amber"
                                subtitle={
                                    <span className="text-slate-500 truncate block">
                                        Across {analytics.totalOrders} total orders
                                    </span>
                                }
                            />
                        </div>
                    </section>

                    {/* Fulfillment Pipeline */}
                    <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-slate-500" />
                                    <h2 className="text-lg font-bold text-slate-900">Fulfillment Pipeline</h2>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Live order distribution across fulfillment stages ({pipelineTotal} active orders)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <PipelineStageCard
                                title="Placed"
                                count={analytics.placedCount || 0}
                                description="Pending initial review"
                                percentage={getStagePercent(analytics.placedCount || 0)}
                                icon={Clock}
                                accent="blue"
                            />
                            <PipelineStageCard
                                title="Processing"
                                count={analytics.processingCount || 0}
                                description="In preparation & packing"
                                percentage={getStagePercent(analytics.processingCount || 0)}
                                icon={Package}
                                accent="amber"
                            />
                            <PipelineStageCard
                                title="Shipped"
                                count={analytics.shippedCount || 0}
                                description="In transit with carrier"
                                percentage={getStagePercent(analytics.shippedCount || 0)}
                                icon={Truck}
                                accent="purple"
                            />
                            <PipelineStageCard
                                title="Delivered"
                                count={analytics.deliveredCount || 0}
                                description="Fulfillment complete"
                                percentage={getStagePercent(analytics.deliveredCount || 0)}
                                icon={CheckCircle2}
                                accent="emerald"
                            />
                            <PipelineStageCard
                                title="Cancelled"
                                count={analytics.cancelledCount || 0}
                                description="Total cancellations"
                                percentage={getStagePercent(analytics.cancelledCount || 0)}
                                icon={XCircle}
                                accent="slate"
                            />
                        </div>
                    </section>

                    {/* Customer & Financial Health */}
                    <section>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <ModernMetricCard
                                title="Total Customers"
                                value={analytics.totalCustomers.toLocaleString()}
                                icon={Users}
                                accentColor="indigo"
                                subtitle={
                                    <span className="flex items-center justify-between">
                                        <span>New Today: <strong className="text-slate-700">{analytics.newCustomersToday}</strong></span>
                                        <span>This Month: <strong className="text-slate-700">{analytics.newCustomersThisMonth}</strong></span>
                                    </span>
                                }
                            />
                            <ModernMetricCard
                                title="Unpaid Liability"
                                value={`₹${(analytics.unpaidAmount || 0).toLocaleString()}`}
                                icon={AlertCircle}
                                accentColor="rose"
                                subtitle={
                                    <span className="text-slate-500">Outstanding payment receivables</span>
                                }
                            />
                            <ModernMetricCard
                                title="Returning Customer Rate"
                                value={`${analytics.returningCustomerRate.toFixed(1)}%`}
                                icon={RotateCcw}
                                accentColor="teal"
                                subtitle={
                                    <span className="text-slate-500">Customers with 2+ completed orders</span>
                                }
                            />
                        </div>
                    </section>

                    {/* Revenue Trend Chart */}
                    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-slate-900">Revenue Trend</h2>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        Last 30 Days
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Daily wholesale revenue volume and order performance
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Peak Day</span>
                                    <span className="font-bold text-slate-800">
                                        ₹{Math.max(...analytics.revenueTrend.map(d => d.revenue), 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-6 w-px bg-slate-200" />
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">30-Day Gross</span>
                                    <span className="font-bold text-emerald-600">
                                        ₹{analytics.revenueTrend.reduce((acc, d) => acc + d.revenue, 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="h-64 flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-2 border-b border-slate-100">
                            {analytics.revenueTrend.map((day, index) => {
                                const maxRevenue = Math.max(...analytics.revenueTrend.map(d => d.revenue), 1);
                                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                                const isPositive = day.revenue > 0;

                                return (
                                    <div key={index} className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer">
                                        <div
                                            className={`w-full rounded-t-sm transition-all duration-200 ${
                                                isPositive
                                                    ? 'bg-gradient-to-t from-primary/80 to-primary group-hover:from-primary group-hover:to-primary-dark group-hover:scale-y-105 origin-bottom'
                                                    : 'bg-slate-100 group-hover:bg-slate-200'
                                            }`}
                                            style={{ height: `${Math.max(height, 4)}%` }}
                                        />

                                        {/* Floating Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:-translate-y-1 z-20">
                                            <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-slate-700/50 whitespace-nowrap">
                                                <p className="font-medium text-slate-300 text-[10px]">
                                                    {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="font-bold text-sm text-white mt-0.5">₹{day.revenue.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{day.orders} {day.orders === 1 ? 'order' : 'orders'}</p>
                                            </div>
                                            <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span>{new Date(analytics.revenueTrend[0]?.date || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                            <span className="flex items-center gap-1.5 text-slate-500">
                                <span className="w-2 h-2 rounded-full bg-primary" /> Hover over bars to view daily revenue & order volume
                            </span>
                            <span>{new Date(analytics.revenueTrend[analytics.revenueTrend.length - 1]?.date || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </section>

                    {/* Top Products & Top States */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top Products */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Top Products by Revenue</h2>
                                        <p className="text-xs text-slate-500">Highest grossing wholesale products</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {analytics.topProducts.length === 0 ? (
                                    <p className="text-xs text-slate-400 py-6 text-center">No product data available yet</p>
                                ) : (
                                    analytics.topProducts.map((product, index) => {
                                        const maxRev = analytics.topProducts[0]?.revenue || 1;
                                        const share = Math.round((product.revenue / maxRev) * 100);

                                        return (
                                            <div key={product.productId} className="group">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                                        index === 0 ? 'bg-amber-100 text-amber-800' :
                                                        index === 1 ? 'bg-slate-200 text-slate-700' :
                                                        index === 2 ? 'bg-amber-50 text-amber-700' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        #{index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-slate-800 truncate group-hover:text-primary transition-colors">
                                                            {product.productTitle}
                                                        </p>
                                                        <p className="text-xs text-slate-400">{product.unitsSold} units sold</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm text-slate-900">₹{product.revenue.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary/70 rounded-full transition-all duration-500" style={{ width: `${share}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Top Regions */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Top Regions by Revenue</h2>
                                        <p className="text-xs text-slate-500">Geographic distribution of demand</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {analytics.topStates.length === 0 ? (
                                    <p className="text-xs text-slate-400 py-6 text-center">No state data available yet</p>
                                ) : (
                                    analytics.topStates.map((state, index) => {
                                        const maxRev = analytics.topStates[0]?.revenue || 1;
                                        const share = Math.round((state.revenue / maxRev) * 100);

                                        return (
                                            <div key={state.state} className="group">
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                                        index === 0 ? 'bg-emerald-100 text-emerald-800' :
                                                        index === 1 ? 'bg-slate-200 text-slate-700' :
                                                        index === 2 ? 'bg-emerald-50 text-emerald-700' :
                                                        'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        #{index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                                                            {state.state}
                                                        </p>
                                                        <p className="text-xs text-slate-400">{state.orderCount} {state.orderCount === 1 ? 'order' : 'orders'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm text-emerald-600">₹{state.revenue.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500/70 rounded-full transition-all duration-500" style={{ width: `${share}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                {...confirmModal}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ModernMetricCardProps {
    title: string;
    value: string | number;
    subtitle?: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'indigo' | 'rose' | 'teal' | 'slate';
    badge?: string;
}

const ACCENT_STYLES = {
    emerald: {
        iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100/80',
        glow: 'from-emerald-500/[0.04] to-transparent',
    },
    blue: {
        iconBg: 'bg-blue-50 text-blue-600 border-blue-100/80',
        glow: 'from-blue-500/[0.04] to-transparent',
    },
    purple: {
        iconBg: 'bg-purple-50 text-purple-600 border-purple-100/80',
        glow: 'from-purple-500/[0.04] to-transparent',
    },
    amber: {
        iconBg: 'bg-amber-50 text-amber-600 border-amber-100/80',
        glow: 'from-amber-500/[0.04] to-transparent',
    },
    indigo: {
        iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100/80',
        glow: 'from-indigo-500/[0.04] to-transparent',
    },
    rose: {
        iconBg: 'bg-rose-50 text-rose-600 border-rose-100/80',
        glow: 'from-rose-500/[0.04] to-transparent',
    },
    teal: {
        iconBg: 'bg-teal-50 text-teal-600 border-teal-100/80',
        glow: 'from-teal-500/[0.04] to-transparent',
    },
    slate: {
        iconBg: 'bg-slate-50 text-slate-600 border-slate-100/80',
        glow: 'from-slate-500/[0.04] to-transparent',
    },
};

function ModernMetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    accentColor,
    badge
}: ModernMetricCardProps) {
    const style = ACCENT_STYLES[accentColor] || ACCENT_STYLES.blue;

    return (
        <div className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${style.glow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

            <div className="relative">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {title}
                    </span>
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${style.iconBg}`}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-feature-numeric">
                        {value}
                    </p>
                    {badge && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {badge}
                        </span>
                    )}
                </div>
            </div>

            {subtitle && (
                <div className="relative pt-2.5 border-t border-slate-100/80 text-xs text-slate-500">
                    {subtitle}
                </div>
            )}
        </div>
    );
}

interface PipelineStageProps {
    title: string;
    count: number;
    description: string;
    percentage: number;
    icon: React.ComponentType<{ className?: string }>;
    accent: 'blue' | 'amber' | 'purple' | 'emerald' | 'slate';
}

const PIPELINE_STYLES = {
    blue: {
        dot: 'bg-blue-500',
        badge: 'bg-blue-50 text-blue-700 border-blue-100',
        bar: 'bg-blue-500',
        hoverBorder: 'hover:border-blue-200',
    },
    amber: {
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-100',
        bar: 'bg-amber-500',
        hoverBorder: 'hover:border-amber-200',
    },
    purple: {
        dot: 'bg-purple-500',
        badge: 'bg-purple-50 text-purple-700 border-purple-100',
        bar: 'bg-purple-500',
        hoverBorder: 'hover:border-purple-200',
    },
    emerald: {
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        bar: 'bg-emerald-500',
        hoverBorder: 'hover:border-emerald-200',
    },
    slate: {
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
        bar: 'bg-slate-400',
        hoverBorder: 'hover:border-slate-300',
    },
};

function PipelineStageCard({
    title,
    count,
    description,
    percentage,
    icon: Icon,
    accent
}: PipelineStageProps) {
    const style = PIPELINE_STYLES[accent];

    return (
        <div className={`bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] ${style.hoverBorder} transition-all duration-200 flex flex-col justify-between group`}>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span className="text-xs font-bold text-slate-700">
                            {title}
                        </span>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs ${style.badge}`}>
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                </div>

                <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-feature-numeric">
                        {count.toLocaleString()}
                    </p>
                    <span className="text-[11px] font-semibold text-slate-400">
                        {percentage}%
                    </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-3">{description}</p>
            </div>

            <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                    className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                />
            </div>
        </div>
    );
}
