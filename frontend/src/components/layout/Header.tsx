'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/wholesaleCartStore';
import { useAuthStore } from '@/store/authStore';
import { ShoppingCart, User, Search, Menu, LogOut, ChevronDown } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@orchids/shared';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';

/**
 * Main Header Component - Wholesale Platform
 *
 * Dynamic Navigation Architecture:
 * - The PRODUCT_CATEGORIES shared config acts as a "master definition" for
 *   labels, subcategory metadata, and ordering. It is the single source of truth
 *   for what categories and tags *can* exist.
 * - The Header fetches /api/wholesale/products/active-nav on mount to learn
 *   which categories and subcategory tags *actually have products* right now.
 * - Only the intersection of (master definition ∩ active DB data) is rendered.
 *
 * Client Workflow:
 * - Admin uploads a "Girls → Frocks" product → "Girls" and "Frocks & Dresses"
 *   automatically appear in the nav. Zero code changes needed.
 * - Admin deletes all "Boys" products → "Boys" disappears from the nav.
 */

// ============================================================================
// TYPES
// ============================================================================

interface NavSection {
    title: string;
    items: { label: string; href: string }[];
}

interface NavCategory {
    id: string;
    name: string;
    href: string;
    sections: NavSection[];
}

// ============================================================================
// HELPER — Build navigation from DB data + shared config labels
// ============================================================================

/**
 * Merges the live database navigation data with the shared category config
 * to produce a fully-resolved navigation structure.
 *
 * @param activeData - Map of { categoryId → string[] of active tag values }
 * @returns Ordered list of NavCategory objects, ready to render
 */
function buildNavigation(activeData: Record<string, string[]>): NavCategory[] {
    const nav: NavCategory[] = [];

    for (const categoryDef of PRODUCT_CATEGORIES) {
        // Skip categories that have no products in the DB
        if (!activeData[categoryDef.id]) continue;

        const activeTags = activeData[categoryDef.id];

        // Generate short display name
        let navName = categoryDef.label
            .replace(' Collection', '')
            .replace(' Apparel', '')
            .replace(' Wear', '');

        // Resolve only the subcategories that have at least one product tagged
        const activeSubcategories = categoryDef.subcategories.filter(sub =>
            activeTags.includes(sub.value)
        );

        // Split into columns of max 7 for the mega-menu layout
        const maxPerColumn = 7;
        const columns: typeof activeSubcategories[number][][] = [];
        for (let i = 0; i < activeSubcategories.length; i += maxPerColumn) {
            columns.push(activeSubcategories.slice(i, i + maxPerColumn));
        }

        nav.push({
            id: categoryDef.id,
            name: navName,
            href: `/products?category=${categoryDef.id}`,
            sections: columns.map((col, idx) => ({
                title: idx === 0 ? 'Categories' : `More ${navName}${idx > 1 ? ` ${idx}` : ''}`,
                items: col.map(sub => ({
                    label: sub.label,
                    href: `/products?category=${categoryDef.id}&tag=${sub.value}`,
                })),
            })),
        });
    }

    return nav;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Header: React.FC = () => {
    const { getTotalBundles } = useCartStore();
    const { user, logout } = useAuthStore();

    // ========================================
    // State Management
    // ========================================

    const [isMounted, setIsMounted] = React.useState(false);
    const [activeMegaMenu, setActiveMegaMenu] = React.useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    // Dynamic navigation built from live DB data
    const [navigation, setNavigation] = React.useState<NavCategory[]>([]);

    const pathname = usePathname();

    // ========================================
    // Effects
    // ========================================

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Scroll detection for sticky header styling
    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch active navigation data from DB on mount
    // This runs once per page load. The backend caches the result for 5 minutes,
    // so this is not an expensive operation.
    React.useEffect(() => {
        wholesaleProductsApi.getActiveNavigation().then(activeData => {
            setNavigation(buildNavigation(activeData));
        });
    }, []);

    // ========================================
    // Handlers
    // ========================================

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    // ========================================
    // Computed Values
    // ========================================

    const cartItemsCount = getTotalBundles();

    // Mobile nav: flat list of active categories
    const mobileNavItems = [
        { name: 'Home', href: '/' },
        ...navigation.map(cat => ({ name: cat.name, href: cat.href })),
        { name: 'All Products', href: '/products' },
    ];

    // ========================================
    // Render
    // ========================================

    return (
        <header
            className={`sticky top-0 z-[999] transition-all duration-300 ${scrolled
                ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100'
                : 'bg-white border-b border-transparent'
                }`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-20">
                    {/* LOGO */}
                    <Link href="/" className="flex items-center gap-2 relative z-10">
                        <div className="relative w-40 h-10 md:w-56 md:h-16 transition-all duration-300">
                            <Image
                                src="/images/logo.png"
                                alt="ORCHID Wholesale Clothing - Tirupur"
                                fill
                                className="object-contain object-left"
                                sizes="(max-width: 768px) 160px, 224px"
                                priority
                            />
                        </div>
                    </Link>

                    {/* DESKTOP NAV */}
                    <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
                        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                            Home
                        </Link>

                        {navigation.map((category) => (
                            <div
                                key={category.id}
                                className="group"
                                onMouseEnter={() => setActiveMegaMenu(category.id)}
                                onMouseLeave={() => setActiveMegaMenu(null)}
                            >
                                <Link
                                    href={category.href}
                                    className={`flex items-center gap-1 text-sm font-medium transition-colors py-8 ${
                                        pathname?.startsWith(category.href) || activeMegaMenu === category.id
                                            ? 'text-primary'
                                            : 'text-slate-600 hover:text-primary'
                                    }`}
                                >
                                    {category.name}
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeMegaMenu === category.id ? 'rotate-180' : ''}`} />
                                </Link>

                                {/* MEGA MENU DROPDOWN — only rendered when subcategories exist */}
                                {category.sections.length > 0 && (
                                    <div
                                        style={{ backgroundColor: '#ffffff', zIndex: 1000 }}
                                        className={`absolute left-0 w-full bg-white shadow-xl border-t border-gray-100 transition-all duration-300 ease-in-out origin-top ${
                                            activeMegaMenu === category.id
                                                ? 'opacity-100 visible translate-y-0'
                                                : 'opacity-0 invisible -translate-y-2'
                                        }`}
                                    >
                                        <div className="container-custom py-8">
                                            <div className="grid grid-cols-4 gap-8">
                                                {/* Featured placeholder */}
                                                <div className="col-span-1 relative h-64 rounded-xl overflow-hidden hidden lg:block">
                                                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400">
                                                        <span>{category.name} Collection</span>
                                                    </div>
                                                    <div className="absolute bottom-4 left-4 text-gray-900 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                                                        New Arrivals
                                                    </div>
                                                </div>

                                                {/* Active subcategories */}
                                                {category.sections.map((section) => (
                                                    <div key={section.title} className="col-span-1">
                                                        <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                                                            {section.title}
                                                        </h3>
                                                        <ul className="space-y-3">
                                                            {section.items.map((item) => (
                                                                <li key={item.label}>
                                                                    <Link
                                                                        href={item.href}
                                                                        className="text-slate-600 hover:text-primary hover:pl-1 transition-all text-sm block"
                                                                        onClick={() => setActiveMegaMenu(null)}
                                                                    >
                                                                        {item.label}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <Link
                            href="/products"
                            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                        >
                            All Products
                        </Link>
                    </nav>

                    {/* RIGHT SIDE ACTIONS */}
                    <div className="flex items-center space-x-3 md:space-x-6">
                        {/* Search */}
                        <Link
                            href="/search"
                            className="text-slate-600 hover:text-primary transition-colors"
                            aria-label="Search products"
                        >
                            <Search className="w-5 h-5" />
                        </Link>

                        {/* User Menu / Login */}
                        {isMounted && user ? (
                            <UserDropdown user={user} onLogout={handleLogout} />
                        ) : (
                            <Link
                                href="/auth/login"
                                className="text-slate-600 hover:text-primary transition-colors"
                                aria-label="Login"
                            >
                                <User className="w-5 h-5" />
                            </Link>
                        )}

                        {/* Cart */}
                        <Link
                            href="/wholesale/cart"
                            className="relative text-slate-600 hover:text-primary transition-colors group"
                            aria-label={`Shopping cart with ${cartItemsCount} items`}
                        >
                            <div className="relative">
                                <ShoppingCart className="w-5 h-5" />
                                {isMounted && cartItemsCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                                        {cartItemsCount}
                                    </span>
                                )}
                            </div>
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-slate-900"
                            aria-label="Toggle mobile menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE MENU */}
            {mobileMenuOpen && (
                <MobileMenu
                    user={user}
                    isMounted={isMounted}
                    navItems={mobileNavItems}
                    onClose={closeMobileMenu}
                />
            )}
        </header>
    );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface UserDropdownProps {
    user: { email: string | null; role: string };
    onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ user, onLogout }) => (
    <div className="relative group">
        <button
            className="flex items-center space-x-2 text-slate-600 hover:text-primary transition-colors"
            aria-label="User menu"
        >
            <User className="w-5 h-5" />
        </button>

        <div
            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
                opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all 
                origin-top-right border border-gray-100 p-2"
            role="menu"
        >
            <div className="px-4 py-2 border-b border-gray-50 mb-2">
                <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
            </div>

            {user.role === 'superadmin' && (
                <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-lg"
                    role="menuitem"
                >
                    Superadmin Panel
                </Link>
            )}

            {user.role === 'admin' && (
                <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg"
                    role="menuitem"
                >
                    Admin Dashboard
                </Link>
            )}

            <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-slate-600 hover:bg-gray-50 rounded-lg"
                role="menuitem"
            >
                My Profile
            </Link>

            <Link
                href="/profile#orders"
                className="block px-4 py-2 text-sm text-slate-600 hover:bg-gray-50 rounded-lg"
                role="menuitem"
            >
                My Orders
            </Link>

            <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg flex items-center space-x-2 mt-1"
                role="menuitem"
            >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
            </button>
        </div>
    </div>
);

interface MobileMenuProps {
    user: { email: string | null; role: string } | null;
    isMounted: boolean;
    navItems: { name: string; href: string }[];
    onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ user, isMounted, navItems, onClose }) => (
    <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl z-50">
        <nav className="container-custom py-6 flex flex-col space-y-2" aria-label="Mobile navigation">
            {navItems.map((link) => (
                <Link
                    key={link.name}
                    href={link.href}
                    className="text-lg font-medium text-slate-900 hover:text-primary transition-colors px-4 py-3 hover:bg-gray-50 rounded-lg"
                    onClick={onClose}
                >
                    {link.name}
                </Link>
            ))}

            {isMounted && user?.role === 'superadmin' && (
                <Link
                    href="/admin"
                    className="text-lg font-semibold text-purple-600 px-4 py-3 hover:bg-purple-50 rounded-lg"
                    onClick={onClose}
                >
                    Superadmin Panel
                </Link>
            )}

            {isMounted && user?.role === 'admin' && (
                <Link
                    href="/admin"
                    className="text-lg font-semibold text-primary px-4 py-3 hover:bg-primary-light rounded-lg"
                    onClick={onClose}
                >
                    Admin Dashboard
                </Link>
            )}
        </nav>
    </div>
);
