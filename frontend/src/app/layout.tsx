import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { PromotionalBanner } from '@/components/layout/PromotionalBanner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ToastProvider } from '@/context/ToastContext';
import { GoogleTagManager } from '@/components/analytics/GoogleTagManager';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: {
        default: 'ORCHID Wholesale Clothing | B2B Apparel Tirupur',
        template: '%s | ORCHID Wholesale',
    },
    description: 'Wholesale clothing supplier in Tirupur. Baby wear, kids clothing, women\'s apparel with bundle pricing for retailers. GST included. Minimum order quantities apply.',
    keywords: [
        'wholesale clothing Tirupur',
        'B2B apparel India',
        'wholesale baby clothes',
        'kids wear wholesale',
        'women clothing wholesale',
        'bulk clothing supplier',
        'Tirupur garments wholesale',
        'newborn clothes wholesale',
        'girls clothing wholesale',
        'boys wear wholesale',
    ],
    authors: [{ name: 'ORCHID' }],
    creator: 'ORCHID',
    publisher: 'ORCHID',
    openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        siteName: 'ORCHID Wholesale Clothing',
        title: 'ORCHID Wholesale | B2B Apparel Supplier Tirupur',
        description: 'Wholesale baby wear, kids clothing, and women\'s apparel from Tirupur. Bundle pricing for retailers.',
        images: [
            {
                url: '/images/og-image.png',
                width: 1200,
                height: 630,
                alt: 'ORCHID Wholesale Clothing - Tirupur',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ORCHID Wholesale | B2 Apparel Tirupur',
        description: 'Wholesale clothing supplier in Tirupur specializing in baby wear, kids clothing, and women\'s apparel',
        images: ['/images/twitter-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
            <body className="font-body antialiased bg-background-primary text-text-primary">
                <GoogleTagManager />
                <ToastProvider>
                    <AuthProvider>
                        <PromotionalBanner />
                        <ConditionalLayout>{children}</ConditionalLayout>
                    </AuthProvider>
                </ToastProvider>
            </body>
            {/* Razorpay Payment Gateway Script */}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />
        </html>
    );
}
