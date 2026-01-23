'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, X, Gift, Tag, Users, BarChart3, Sparkles } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/collections', label: 'Collections', icon: Sparkles },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/combos', label: 'Combos', icon: Gift },
    { href: '/admin/coupons', label: 'Coupons', icon: Tag },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { showToast } = useToast();

    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/auth/login?redirect=/admin');
            return;
        }

        // Firestore role check
        // (THIS IS WHAT YOU ACTUALLY USE)
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            showToast('Access denied. Admin privileges required.', 'error');
            router.push('/');
        }
    }, [user]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header - Enhanced Touch Targets */}
            <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-border px-4 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-lg text-gradient">TNtrends Admin</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200"
                    aria-label="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Backdrop Overlay for Mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-border z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold text-gradient">TNtrends</h1>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm text-text-secondary">Logged in as:</p>
                        <p className="font-semibold text-text-primary truncate">{user.email}</p>

                        {/* FIRESTORE ROLE DISPLAY */}
                        <span className="inline-block mt-2 px-2 py-1 bg-primary text-white text-xs rounded-full">
                            {user.role}
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2">
                        {adminNavItems
                            .filter(item => {
                                // Hide Collections from regular admins
                                if (item.href === '/admin/collections' && user.role !== 'superadmin') {
                                    return false;
                                }
                                return true;
                            })
                            .map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive
                                                ? 'bg-primary text-white'
                                                : 'text-text-secondary hover:bg-gray-100'
                                            }`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-border">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error/10 rounded-lg transition w-full"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <main className="lg:ml-64 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
    );
}
