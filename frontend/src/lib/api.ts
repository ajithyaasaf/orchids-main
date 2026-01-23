const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Validate API URL configuration
if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn("Warning: NEXT_PUBLIC_API_URL is missing, using fallback: http://localhost:5000");
}

/**
 * Get auth token from Firebase
 */
const getAuthToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;

    const { auth } = await import('./firebase');
    const user = auth.currentUser;
    if (!user) return null;

    return await user.getIdToken();
};

/**
 * API fetch wrapper with auth
 */
async function apiFetch<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// Products API
export const productApi = {
    getAll: (params?: Record<string, any>) => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (key === 'tags' && Array.isArray(value)) {
                    if (value.length > 0) queryParams.append(key, value.join(','));
                } else if (value !== undefined && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });
        }
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return apiFetch(`/api/products${query}`);
    },
    getTagsByCategory: () => apiFetch('/api/products/tags/by-category'),
    getById: (id: string) => apiFetch(`/api/products/${id}`),
    create: (data: any) => apiFetch('/api/products/admin', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiFetch(`/api/products/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch(`/api/products/admin/${id}`, {
        method: 'DELETE',
    }),
    updateStock: (id: string, size: string, quantity: number) =>
        apiFetch(`/api/products/admin/${id}/stock`, {
            method: 'PATCH',
            body: JSON.stringify({ size, quantity }),
        }),
};

// Orders API
export const orderApi = {
    create: (data: any) => apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    getById: (id: string) => apiFetch(`/api/orders/${id}`),
    getByUserId: (userId: string) => apiFetch(`/api/orders/user/${userId}`),
    getAll: (params?: Record<string, any>) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        return apiFetch(`/api/orders/admin/all${query}`);
    },
    updateStatus: (id: string, orderStatus: string) =>
        apiFetch(`/api/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ orderStatus }),
        }),
};

// Payment API
export const paymentApi = {
    /**
     * Create Razorpay payment order
     * SECURITY: Now sends orderId instead of amount to prevent price manipulation
     */
    createOrder: (orderId: string) => apiFetch('/api/payment/create-order', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
    }),
    verify: (data: any) => apiFetch('/api/payment/verify', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    getKey: () => apiFetch('/api/payment/key'),
};

// Upload API
export const uploadApi = {
    uploadImage: async (file: File) => {
        const token = await getAuthToken();
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        return data;
    },
};

// Settings API
export const settingsApi = {
    get: () => apiFetch('/api/settings'),
    update: (data: any) => apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};

// Combos API
export const comboApi = {
    // Public APIs
    getActiveCombos: () => apiFetch('/api/combos/active'),
    getById: (id: string) => apiFetch(`/api/combos/${id}`),
    calculate: (cartItems: any[]) => apiFetch('/api/combos/calculate', {
        method: 'POST',
        body: JSON.stringify({ cartItems }),
    }),
    validate: (cartItems: any[], comboId: string) => apiFetch('/api/combos/validate', {
        method: 'POST',
        body: JSON.stringify({ cartItems, comboId }),
    }),

    // Admin APIs
    admin: {
        getAll: () => apiFetch('/api/combos'),
        create: (data: any) => apiFetch('/api/combos', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => apiFetch(`/api/combos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => apiFetch(`/api/combos/${id}`, {
            method: 'DELETE',
        }),
        getAnalytics: (id: string, params?: Record<string, any>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : '';
            return apiFetch(`/api/combos/analytics/${id}${query}`);
        },
        getAllAnalytics: (params?: Record<string, any>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : '';
            return apiFetch(`/api/combos/analytics${query}`);
        },
    },
};

// Shipping API
export const shippingApi = {
    checkPincode: (pincode: string) => apiFetch(`/api/shipping/check?pincode=${pincode}`),
};

// Checkout API
export const checkoutApi = {
    calculate: (items: any[], pincode: string, couponCode?: string) => apiFetch('/api/checkout/calculate', {
        method: 'POST',
        body: JSON.stringify({ items, pincode, couponCode }),
    }),
};

// Cart API
export interface CartValidationItem {
    productId: string;
    size: string;
    quantity: number;
}

export interface ValidationResult {
    productId: string;
    size: string;
    status: 'VALID' | 'PRODUCT_NOT_FOUND' | 'SIZE_OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'PRICE_CHANGED';
    message?: string;
    currentStock?: number;
    requestedQuantity?: number;
    currentPrice?: number;
    currentBasePrice?: number;
}

export interface CartValidationResponse {
    valid: ValidationResult[];
    invalid: ValidationResult[];
    totalValid: number;
    totalInvalid: number;
}

export const cartApi = {
    validate: (items: CartValidationItem[]): Promise<CartValidationResponse> =>
        apiFetch('/api/cart/validate', {
            method: 'POST',
            body: JSON.stringify({ items }),
        }),
};

// Coupon API
export const couponApi = {
    /**
     * Validate coupon code (public)
     */
    validate: (code: string, cartValue: number) =>
        apiFetch('/api/coupons/validate', {
            method: 'POST',
            body: JSON.stringify({ code, cartValue }),
        }),

    /**
     * Get all coupons (admin only)
     */
    getAll: () => apiFetch('/api/coupons'),

    /**
     * Get coupon by ID (admin only)
     */
    getById: (id: string) => apiFetch(`/api/coupons/${id}`),

    /**
     * Create new coupon (admin only)
     */
    create: (data: any) =>
        apiFetch('/api/coupons', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Update coupon (admin only)
     */
    update: (id: string, data: any) =>
        apiFetch(`/api/coupons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /**
     * Delete/deactivate coupon (admin only)
     */
    delete: (id: string) =>
        apiFetch(`/api/coupons/${id}`, {
            method: 'DELETE',
        }),
};

// Customer API
export const customerApi = {
    /**
     * Get all customers with analytics (admin only)
     */
    getAll: (params?: {
        segment?: string;
        state?: string;
        minSpent?: number;
        search?: string;
        limit?: number;
        lastDocId?: string;
    }) => {
        const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        return apiFetch(`/api/customers${query}`);
    },

    /**
     * Get single customer with full details (admin only)
     */
    getById: (userId: string) => apiFetch(`/api/customers/${userId}`),

    /**
     * Export customers as CSV (admin only)
     */
    exportCSV: (params?: { segment?: string; state?: string; minSpent?: number; search?: string }) => {
        const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        return fetch(`${API_URL}/api/customers/export/csv${query}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        }).then(res => res.blob());
    },

    /**
     * Resync customer metrics from orders (admin only)
     * WARNING: Expensive operation
     */
    resync: () => apiFetch('/api/customers/resync', { method: 'POST' }),
};

// Dashboard API
export const dashboardApi = {
    /**
     * Get comprehensive business analytics (admin only)
     */
    getAnalytics: () => apiFetch('/api/dashboard/analytics'),

    /**
     * Rebuild analytics cache from scratch (admin only)
     * WARNING: Expensive operation
     */
    rebuildCache: () => apiFetch('/api/dashboard/analytics/rebuild', { method: 'POST' }),
};

// ============================================
// INVOICE API
// ============================================

export interface InvoiceStatus {
    canGenerateInvoice: boolean;
    invoiceNumber: string | null;
    invoiceGeneratedAt: string | null;
    invoiceSent: boolean;
    packingSlipPrinted: boolean;
    refunds: Array<{
        creditNoteNumber: string;
        refundAmount: number;
        refundReason: string;
        refundDate: string;
        originalInvoiceNumber: string;
        refundMethod: string;
    }>;
}

export interface CreateRefundPayload {
    orderId: string;
    refundAmount: number;
    refundReason: string;
    refundMethod?: 'razorpay' | 'bank_transfer' | 'store_credit';
}

export const invoiceApi = {
    /**
     * Get invoice status for an order
     */
    getStatus: (orderId: string) =>
        apiFetch<InvoiceStatus>(`/api/invoices/${orderId}/status`),

    /**
     * Get invoice PDF URL (for viewing in browser)
     */
    getViewUrl: (orderId: string) =>
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/invoices/${orderId}?download=false`,

    /**
     * Get invoice PDF URL (for downloading)
     */
    getDownloadUrl: (orderId: string) =>
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/invoices/${orderId}?download=true`,

    /**
     * Get packing slip PDF URL (admin only)
     */
    getPackingSlipUrl: (orderId: string) =>
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/invoices/${orderId}/packing-slip?download=true`,

    /**
     * Get credit note PDF URL
     */
    getCreditNoteUrl: (orderId: string, creditNoteNumber: string) =>
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/invoices/${orderId}/credit-notes/${creditNoteNumber}?download=false`,

    /**
     * Force generate invoice (admin only)
     */
    generateInvoice: (orderId: string) =>
        apiFetch<{ invoiceNumber: string }>(`/api/invoices/${orderId}/generate`, { method: 'POST' }),

    /**
     * Create refund with credit note (admin only)
     */
    createRefund: (data: CreateRefundPayload) =>
        apiFetch<{ creditNoteNumber: string }>('/api/invoices/refunds', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Download invoice as blob (for programmatic download)
     */
    downloadInvoice: async (orderId: string, token: string): Promise<Blob> => {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/invoices/${orderId}?download=true`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (!response.ok) {
            throw new Error('Failed to download invoice');
        }
        return response.blob();
    },

    /**
     * Download packing slip as blob (admin only)
     */
    downloadPackingSlip: async (orderId: string, token: string): Promise<Blob> => {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/invoices/${orderId}/packing-slip?download=true`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        if (!response.ok) {
            throw new Error('Failed to download packing slip');
        }
        return response.blob();
    },
};

// ============================================================================
// COLLECTIONS API
// ============================================================================

import { Collection, CollectionWithProducts, CollectionQueryParams } from '@tntrends/shared';

export const collectionApi = {
    /**
     * Get all active collections for homepage
     */
    getAll: async (): Promise<{ success: boolean; data: Collection[] }> => {
        return apiFetch('/api/collections');
    },

    /**
     * Get collection by slug with products
     */
    getBySlug: async (slug: string): Promise<{ success: boolean; data: CollectionWithProducts }> => {
        return apiFetch(`/api/collections/${slug}`);
    },

    // ADMIN ENDPOINTS

    /**
     * Get all collections with filters (admin only)
     */
    getAllAdmin: async (params?: CollectionQueryParams): Promise<{ success: boolean; data: Collection[] }> => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.showOnHomepage !== undefined) queryParams.append('showOnHomepage', String(params.showOnHomepage));
        if (params?.limit) queryParams.append('limit', String(params.limit));

        const query = queryParams.toString();
        return apiFetch(`/api/collections/admin/all${query ? `?${query}` : ''}`);
    },

    /**
     * Get collection by ID (admin only)
     */
    getById: async (id: string): Promise<{ success: boolean; data: Collection }> => {
        return apiFetch(`/api/collections/admin/${id}`);
    },

    /**
     * Create new collection (admin only)
     */
    create: async (data: Partial<Collection>): Promise<{ success: boolean; data: { id: string } }> => {
        return apiFetch('/api/collections/admin', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Update collection (admin only)
     */
    update: async (id: string, data: Partial<Collection>): Promise<{ success: boolean; message: string }> => {
        return apiFetch(`/api/collections/admin/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete/archive collection (admin only)
     */
    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
        return apiFetch(`/api/collections/admin/${id}`, {
            method: 'DELETE',
        });
    },
};
