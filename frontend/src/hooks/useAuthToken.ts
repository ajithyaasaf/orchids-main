import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';

/**
 * useAuthToken Hook
 * 
 * Provides authenticated API call utilities
 * - Auto-refreshes token if expired
 * - Handles auth state changes
 * - Provides helper for authenticated fetch
 */

interface AuthTokenHook {
    token: string | null;
    loading: boolean;
    error: string | null;
    getToken: () => Promise<string>;
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export function useAuthToken(): AuthTokenHook {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const freshToken = await user.getIdToken();
                    setToken(freshToken);
                    setError(null);
                } catch (err: any) {
                    setError(err.message);
                    setToken(null);
                }
            } else {
                setToken(null);
                setError('Not authenticated');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getToken = async (): Promise<string> => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('Not authenticated');
        }
        const freshToken = await currentUser.getIdToken();
        setToken(freshToken);
        return freshToken;
    };

    const authenticatedFetch = async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        const token = await getToken();

        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            },
        });
    };

    return { token, loading, error, getToken, authenticatedFetch };
}
