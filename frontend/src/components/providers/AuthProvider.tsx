'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        const unsubscribe = initialize();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [initialize]);

    return <>{children}</>;
};
