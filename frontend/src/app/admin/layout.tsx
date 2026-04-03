'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
    LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, X,
    Gift, Tag, Users, BarChart3, Sparkles
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useHasMounted } from '@/hooks/useHasMounted';

const navGroups = [
    {
        title: 'Overview',
        items: [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        ]
    },
    {
        title: 'Store',
        items: [
            { href: '/admin/wholesale/orders', label: 'Orders', icon: ShoppingBag },
            { href: '/admin/wholesale/products', label: 'Products', icon: Package },
            { href: '/admin/customers', label: 'Customers', icon: Users },
        ]
    },
    {
        title: 'Marketing',
        items: [
            { href: '/admin/collections', label: 'Collections', icon: Sparkles, superadminOnly: true },
            { href: '/admin/combos', label: 'Combos', icon: Gift },
            { href: '/admin/coupons', label: 'Coupons', icon: Tag },
        ]
    },
    {
        title: 'System',
        items: [
            { href: '/admin/settings', label: 'Settings', icon: Settings },
        ]
    }
];

// Core mobile tabs for bottom navigation
const mobileTabs = [
    { href: '/admin', label: 'Home', icon: LayoutDashboard },
    { href: '/admin/wholesale/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/wholesale/products', label: 'Products', icon: Package },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout, initialized, loading: authLoading } = useAuthStore();
    const { showToast } = useToast();
    const hasMounted = useHasMounted();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (hasMounted && initialized && !authLoading && !user) {
            router.push('/auth/login?redirect=' + encodeURIComponent(pathname));
            return;
        }

        if (hasMounted && initialized && user && user.role !== 'admin' && user.role !== 'superadmin') {
            showToast('Access denied. Admin privileges required.', 'error');
            router.push('/');
        }
    }, [user, initialized, authLoading, hasMounted, pathname]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    // Auth & Permission check
    const isAuthenticating = !initialized || authLoading;
    const isLoadingState = !hasMounted || isAuthenticating;

    // If fully loaded and still not authorized, we'll let the useEffect handle the redirect
    // but we don't want to show the admin UI during that brief moment.
    const isAuthorized = user && (user.role === 'admin' || user.role === 'superadmin');

    if (isLoadingState) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Guard: If not authorized and not loading, show nothing (useEffect will redirect)
    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f9fafb] text-gray-900 font-sans pb-16 lg:pb-0 transition-all duration-300">
            {/* Mobile Top Header */}
            <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-xl tracking-tight text-gray-900">Admin</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {user.role}
                    </span>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Desktop Sidebar & Mobile Drawer */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="p-6 flex-shrink-0 flex items-center justify-between">
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Orchid</h1>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 pb-6 flex-shrink-0">
                    <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3 border border-gray-100/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                            {user.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                    <nav className="space-y-6 pb-6">
                        {navGroups.map((group) => {
                            const visibleItems = group.items.filter(item =>
                                !(item.superadminOnly && user.role !== 'superadmin')
                            );

                            if (visibleItems.length === 0) return null;

                            return (
                                <div key={group.title}>
                                    <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        {group.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {visibleItems.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                        }`}
                                                    onClick={() => setSidebarOpen(false)}
                                                >
                                                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                                    <span className="font-medium text-sm">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t border-gray-100 flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-72 min-h-screen transition-all">
                <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation (App-like) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-around px-2">
                    {mobileTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href || (tab.href !== '/admin' && pathname.startsWith(tab.href));

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className="flex flex-col items-center justify-center w-full py-3 gap-1 relative"
                            >
                                <div className={`relative p-1.5 rounded-full transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-500'}`}>
                                    <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                                </div>
                                <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                                    {tab.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Mobile Menu Trigger */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex flex-col items-center justify-center w-full py-3 gap-1 relative"
                    >
                        <div className="relative p-1.5 rounded-full text-gray-500 hover:bg-gray-50 transition-colors">
                            <Menu className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-semibold tracking-wide text-gray-500">
                            Menu
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}