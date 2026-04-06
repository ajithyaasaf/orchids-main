import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for Wholesale-Only Site
 * Redirects retail URLs to wholesale equivalents
 * Prevents duplicate content and ensures consistent wholesale experience
 * Also provides Edge-side Route Protection for authenticated areas
 */

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = request.cookies.get('session')?.value;

    const protectedPaths = ['/admin', '/profile', '/wholesale/checkout', '/orders'];
    const authPaths = ['/auth/login', '/auth/register', '/auth/signup'];

    const isProtectedRoute = protectedPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    const isAuthRoute = authPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // Redirect to login if unauthenticated user tries to hit protected route
    if (isProtectedRoute && !session) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ========================================================================
    // Cart & Checkout Redirects (Retail → Wholesale)
    // ========================================================================
    if (pathname === '/cart') {
        return NextResponse.redirect(new URL('/wholesale/cart', request.url));
    }

    if (pathname === '/checkout') {
        return NextResponse.redirect(new URL('/wholesale/checkout', request.url));
    }

    // ========================================================================
    // Category Redirects (Retail → Wholesale)
    // ========================================================================
    const categoryRedirects: Record<string, string> = {
        '/category/men': '/products?category=boys',
        '/category/women': '/products?category=women',
        '/category/kids': '/products?category=newborn',
    };

    if (categoryRedirects[pathname]) {
        return NextResponse.redirect(new URL(categoryRedirects[pathname], request.url));
    }

    // ========================================================================
    // Duplicate Product URL Prevention (/products/[slug] → /product/[slug])
    // SEO: Ensures only ONE product detail URL exists
    // ========================================================================
    if (pathname.match(/^\/products\/[^/]+$/)) {
        // Extract product slug from /products/[slug]
        const productSlug = pathname.split('/').pop();
        return NextResponse.redirect(new URL(`/product/${productSlug}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /* Protected Routes */
        '/admin/:path*',
        '/profile/:path*',
        '/wholesale/checkout',
        '/orders/:path*',
        /* Auth Routes */
        '/auth/login',
        '/auth/register',
        '/auth/signup',
        /* Retail Redirect Routes */
        '/cart',
        '/checkout',
        '/category/:path*',
        '/collection/:path*',
        '/products/:id', // Catch old product detail URLs
    ],
};
