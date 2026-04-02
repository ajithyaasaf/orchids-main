'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { ReactNode } from 'react';
import { useHasMounted } from '@/hooks/useHasMounted';

export function ConditionalLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const hasMounted = useHasMounted();

    // Hide main site header/footer on admin pages
    const isAdminRoute = pathname?.startsWith('/admin');

    if (!hasMounted) {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <>
            {!isAdminRoute && <Header />}
            <main className="min-h-screen">{children}</main>
            {!isAdminRoute && <Footer />}
        </>
    );
}
