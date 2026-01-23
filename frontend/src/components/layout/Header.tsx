'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ShoppingCart, User, Search, Menu, LogOut, ChevronDown } from 'lucide-react';
import { productApi } from '@/lib/api';
import { tagToSlug } from '@tntrends/shared';

export const Header: React.FC = () => {
    const { getTotalItems } = useCartStore();
    const { user, logout } = useAuthStore();

    // HYDRATION FIX
    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => setIsMounted(true), []);

    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);
    const [tagsByCategory, setTagsByCategory] = React.useState<Record<string, string[]>>({});
    const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Fetch tags for mega menu
        productApi.getTagsByCategory()
            .then(({ data }) => setTagsByCategory(data || {}))
            .catch(() => { }); // Silent fail is fine

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const cartItemsCount = getTotalItems();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100'
                : 'bg-white border-b border-transparent'
                }`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 relative z-10">
                        <div className="relative w-56 h-16">
                            <Image
                                src="/images/logo.png"
                                alt="Orchid Export Surplus Store"
                                fill
                                className="object-contain object-left"
                                priority
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8 h-full">
                        <Link
                            href="/"
                            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                        >
                            Home
                        </Link>

                        {[
                            { name: 'Men', href: '/category/men', tags: tagsByCategory['Men'] || [] },
                            { name: 'Women', href: '/category/women', tags: tagsByCategory['Women'] || [] },
                            { name: 'Kids', href: '/category/kids', tags: tagsByCategory['Kids'] || [] },
                        ].map((category) => (
                            <div
                                key={category.name}
                                className="relative h-full flex items-center group"
                                onMouseEnter={() => setActiveCategory(category.name)}
                                onMouseLeave={() => setActiveCategory(null)}
                            >
                                <Link
                                    href={category.href}
                                    className="text-sm font-medium text-slate-600 hover:text-primary transition-colors flex items-center gap-1 py-8"
                                >
                                    {category.name}
                                    {category.tags.length > 0 && <ChevronDown className="w-3 h-3 opacity-50" />}
                                </Link>

                                {/* Professional Minimalist Mega Menu */}
                                {activeCategory === category.name && category.tags.length > 0 && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[600px] animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                                        <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden flex">

                                            {/* Left Column: Tags Grid */}
                                            <div className="flex-1 p-6">
                                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                                    <h3 className="font-bold text-gray-900 tracking-tight text-sm uppercase">
                                                        Shop {category.name}
                                                    </h3>
                                                    <Link
                                                        href={category.href}
                                                        className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                                                    >
                                                        View All
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </Link>
                                                </div>

                                                <div className="grid grid-cols-2 gap-y-2 gap-x-6">
                                                    {category.tags.map(tag => (
                                                        <Link
                                                            key={tag}
                                                            href={`/shop/${tagToSlug(tag)}?category=${category.name}`}
                                                            className="text-sm text-gray-500 hover:text-gray-900 hover:translate-x-1 transition-all duration-200 flex items-center gap-2 group/link py-1"
                                                        >
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 group-hover/link:bg-primary transition-colors"></span>
                                                            {tag}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Right Column: Featured / Visual Interest (Gray Background) */}
                                            <div className="w-48 bg-gray-50 p-6 flex flex-col justify-center items-center text-center border-l border-gray-100">
                                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-primary">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                </div>
                                                <h4 className="font-bold text-gray-900 text-sm mb-1">New Arrivals</h4>
                                                <p className="text-xs text-gray-500 mb-4 leading-relaxed">Check out the latest trends for {category.name}</p>
                                                <Link
                                                    href={category.href}
                                                    className="text-xs font-bold bg-white border border-gray-200 px-4 py-2 rounded hover:border-primary hover:text-primary transition-colors shadow-sm"
                                                >
                                                    Shop Now
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center space-x-6">
                        <Link href="/search" className="text-slate-600 hover:text-primary transition-colors">
                            <Search className="w-5 h-5" />
                        </Link>

                        {/* User Dropdown */}
                        {isMounted && user ? (
                            <div className="relative group">
                                <button className="flex items-center space-x-2 text-slate-600 hover:text-primary transition-colors">
                                    <User className="w-5 h-5" />
                                </button>

                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
                                    opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all 
                                    origin-top-right border border-gray-100 p-2">

                                    {/* User Email */}
                                    <div className="px-4 py-2 border-b border-gray-50 mb-2">
                                        <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                                    </div>

                                    {/* SUPERADMIN MENU */}
                                    {user.role === 'superadmin' && (
                                        <Link
                                            href="/admin"
                                            className="block px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-lg"
                                        >
                                            Superadmin Panel
                                        </Link>
                                    )}

                                    {/* ADMIN MENU */}
                                    {user.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            className="block px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            Admin Dashboard
                                        </Link>
                                    )}

                                    {/* CUSTOMER/COMMON OPTIONS */}
                                    <Link
                                        href="/profile"
                                        className="block px-4 py-2 text-sm text-slate-600 hover:bg-gray-50 rounded-lg"
                                    >
                                        My Profile
                                    </Link>

                                    <Link
                                        href="/profile#orders"
                                        className="block px-4 py-2 text-sm text-slate-600 hover:bg-gray-50 rounded-lg"
                                    >
                                        My Orders
                                    </Link>

                                    {/* Logout */}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 
                                        rounded-lg flex items-center space-x-2 mt-1"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link href="/auth/login" className="text-slate-600 hover:text-primary transition-colors">
                                <User className="w-5 h-5" />
                            </Link>
                        )}

                        {/* Cart */}
                        <Link href="/cart" className="relative text-slate-600 hover:text-primary transition-colors group">
                            <div className="relative">
                                <ShoppingCart className="w-5 h-5" />
                                {isMounted && cartItemsCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-white 
                                        text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </div>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-slate-900"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl z-50">
                    <nav className="container-custom py-6 flex flex-col space-y-2">
                        {[
                            { name: 'Home', href: '/' },
                            { name: 'Men', href: '/category/men' },
                            { name: 'Women', href: '/category/women' },
                            { name: 'Kids', href: '/category/kids' },
                            { name: 'Search', href: '/search' },
                        ].map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-lg font-medium text-slate-900 hover:text-primary transition-colors px-4 py-3 hover:bg-gray-50 rounded-lg"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* MOBILE SUPERADMIN */}
                        {isMounted && user?.role === 'superadmin' && (
                            <Link
                                href="/admin"
                                className="text-lg font-semibold text-purple-600 px-4 py-3 hover:bg-purple-50 rounded-lg"
                            >
                                Superadmin Panel
                            </Link>
                        )}

                        {/* MOBILE ADMIN */}
                        {isMounted && user?.role === 'admin' && (
                            <Link
                                href="/admin"
                                className="text-lg font-semibold text-blue-600 px-4 py-3 hover:bg-blue-50 rounded-lg"
                            >
                                Admin Dashboard
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};
