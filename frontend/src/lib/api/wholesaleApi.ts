import { WholesaleProduct } from '@tntrends/shared';

// Backend is at port 5000, ensure /api suffix is present
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

/**
 * Get Firebase ID token
 */
const getAuthToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    const { auth } = await import('../firebase');
    const user = auth.currentUser;
    if (!user) return null;

    return await user.getIdToken();
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

        const response = await fetch(`${API_BASE}/wholesale/products`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
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

        const response = await fetch(`${API_BASE}/wholesale/products/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
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

        const response = await fetch(`${API_BASE}/wholesale/products`, {
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

        const response = await fetch(`${API_BASE}/wholesale/products/${id}`, {
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

        const response = await fetch(`${API_BASE}/wholesale/products/${id}`, {
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
 * Wholesale Checkout API Client
 */
export const wholesaleCheckoutApi = {
    /**
     * Calculate order totals with dynamic GST
     */
    calculate: async (items: any[], address: any) => {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_BASE}/wholesale/checkout/calculate`, {
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
        const response = await fetch(`${API_BASE}/settings`);
        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to fetch settings');
        }

        return data.data;
    },
};
