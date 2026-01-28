import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for Wholesale-Only Site
 * Redirects retail URLs to wholesale equivalents
 * Prevents duplicate content and ensures consistent wholesale experience
 */

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

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
    // Collections Redirect (Not applicable to wholesale)
    // ========================================================================
    if (pathname.startsWith('/collection/')) {
        return NextResponse.redirect(new URL('/products', request.url));
    }

    // ========================================================================
    // Duplicate Product URL Prevention (/products/[id] → /product/[id])
    // SEO: Ensures only ONE product detail URL exists
    // ========================================================================
    if (pathname.match(/^\/products\/[^/]+$/)) {
        // Extract product ID from /products/[id]
        const productId = pathname.split('/').pop();
        return NextResponse.redirect(new URL(`/product/${productId}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/cart',
        '/checkout',
        '/category/:path*',
        '/collection/:path*',
        '/products/:id', // Catch old product detail URLs
    ],
};
