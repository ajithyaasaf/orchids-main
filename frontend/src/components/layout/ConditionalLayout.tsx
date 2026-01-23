'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { ReactNode } from 'react';

export function ConditionalLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Hide main site header/footer on admin pages
    const isAdminRoute = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdminRoute && <Header />}
            <main className="min-h-screen">{children}</main>
            {!isAdminRoute && <Footer />}
        </>
    );
}
