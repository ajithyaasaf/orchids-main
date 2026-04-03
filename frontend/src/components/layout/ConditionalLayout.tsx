'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { PromotionalBanner } from './PromotionalBanner';
import { ReactNode } from 'react';
import { useHasMounted } from '@/hooks/useHasMounted';

export function ConditionalLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const hasMounted = useHasMounted();

    // Hide main site layout elements on admin and auth pages
    const isAdminRoute = pathname?.startsWith('/admin');
    const isAuthRoute = pathname?.startsWith('/auth');
    const isHideLayout = isAdminRoute || isAuthRoute;

    return (
        <div className="flex flex-col min-h-screen">
            {hasMounted && !isHideLayout && <PromotionalBanner />}
            {hasMounted && !isAdminRoute && <Header />}
            <main className="flex-1">
                {children}
            </main>
            {hasMounted && !isAdminRoute && <Footer />}
        </div>
    );
}
