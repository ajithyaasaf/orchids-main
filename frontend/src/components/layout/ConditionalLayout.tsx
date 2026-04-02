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

    if (!hasMounted) {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <>
            {!isHideLayout && <PromotionalBanner />}
            {!isAdminRoute && <Header />}
            <main className="min-h-screen">{children}</main>
            {!isAdminRoute && <Footer />}
        </>
    );
}
