import { WholesaleProduct } from '@orchids/shared';

// Backend is at port 5000, ensure /api suffix is present
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

/**
 * Get Authentication Token
 * If running on the Server (SSR), securely extracts the HttpOnly 'session' cookie
 * If running on the Client, elegantly falls back to the Firebase SDK ID Token
 */
const getAuthToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') {
        const { cookies } = await import('next/headers');
        return cookies().get('session')?.value || null;
    }

    const { auth } = await import('../firebase');
    const user = auth.currentUser;
    return user ? await user.getIdToken(false) : null;
};

/**
 * Internal Fetch Wrapper
 * Globally intercepts 401 Unauthorized responses to handle Session Expiry gracefully.
 * Note: Since this is a utility file (not a React component), we cannot use the Next.js useRouter hook.
 * A hard redirect (window.location.href) is preferred here anyway to ensure the React tree dumps any stale memory state.
 */
const apiFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, options);

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            window.location.href = '/login?expired=true';
        }
        throw new Error('Session Expired or Unauthorized');
    }

    return response;
};

/**
 * Wholesale Products API Client
 */

export const wholesaleProductsApi = {
    /**
     * Get all wholesale products
     */
    getAll: async (): Promise<WholesaleProduct[]> => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/products`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store', // SECURITY FIX: Never cache protected user-specific wholesale data
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch products');
        }

        return data.data;
    },

    /**
     * Get single wholesale product by ID
     */
    getById: async (id: string): Promise<WholesaleProduct> => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/products/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch product');
        }

        return data.data;
    },

    /**
     * Get single wholesale product by Slug (SEO)
     */
    getBySlug: async (slug: string): Promise<WholesaleProduct> => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/products/slug/${slug}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch product');
        }

        return data.data;
    },

    /**
     * Create new product (admin only)
     */
    create: async (productData: Partial<WholesaleProduct>): Promise<WholesaleProduct> => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(productData),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to create product');
        }

        return data.data;
    },

    /**
     * Update product (admin only)
     */
    update: async (id: string, updates: Partial<WholesaleProduct>): Promise<WholesaleProduct> => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/products/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to update product');
        }

        return data.data;
    },

    /**
     * Delete product (admin only)
     */
    delete: async (id: string): Promise<void> => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete product');
        }
    },
};

/**
 * Wholesale Orders API Client
 */
export const wholesaleOrdersApi = {
    /**
     * Get all wholesale orders (with optional status filter)
     */
    getAll: async (status?: string) => {
        const token = await getAuthToken();
        const query = status ? `?status=${status}` : '';

        const response = await apiFetch(`${API_BASE}/wholesale/orders${query}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch orders');
        }

        return data.data;
    },

    /**
     * Get single order by ID
     */
    getById: async (id: string) => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/orders/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch order');
        }

        return data.data;
    },

    /**
     * Update order status
     */
    updateStatus: async (id: string, orderStatus: string, notes?: string) => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ orderStatus, notes }),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to update order status');
        }

        return data.data;
    },
};

/**
 * Wholesale Dashboard API Client
 */
export const wholesaleDashboardApi = {
    /**
     * Get comprehensive business analytics
     */
    getAnalytics: async () => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/dashboard/analytics`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch analytics');
        }

        return data.data;
    },

    /**
     * Rebuild analytics cache (admin only)
     */
    rebuildCache: async () => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/dashboard/analytics/rebuild`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to rebuild analytics');
        }

        return data.data;
    },
};

/**
 * Wholesale Checkout API Client
 */
export const wholesaleCheckoutApi = {
    /**
     * Calculate order totals with dynamic GST
     */
    calculate: async (items: any[], address: any) => {
        const token = await getAuthToken();

        const response = await apiFetch(`${API_BASE}/wholesale/checkout/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ items, address }),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to calculate order');
        }

        return data.data;
    },
};

/**
 * Settings API Client
 */
export const settingsApi = {
    /**
     * Get global settings (includes GST configuration)
     */
    get: async () => {
        const response = await apiFetch(`${API_BASE}/settings`);
        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to fetch settings');
        }

        return data.data;
    },
};
