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
    title: 'TNtrends - Modern Fashion E-commerce',
    description: 'Discover the latest trends in fashion',
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
