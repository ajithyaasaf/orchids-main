'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { useToast } from '@/context/ToastContext';
import WholesaleProductForm, { WholesaleJobFormData } from '@/components/admin/WholesaleProductForm';
import { WholesaleProduct } from '@orchids/shared';

export default function EditWholesaleProductPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<Partial<WholesaleProduct> | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const product = await wholesaleProductsApi.getById(id);
                setInitialData(product);
            } catch (err: any) {
                console.error('Failed to load product:', err);
                setError('Failed to load product details. It may have been deleted.');
                showToast('Failed to load product', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, showToast]);

    const handleUpdate = async (data: WholesaleJobFormData) => {
        try {
            await wholesaleProductsApi.update(id, {
                ...data,
                mixedColors: true
            });
            showToast('Product updated successfully', 'success');
            router.push('/admin/wholesale/products');
        } catch (error: any) {
            showToast(error.message || 'Failed to update product', 'error');
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="flex bg-white items-center justify-center min-h-[400px] rounded-xl shadow-soft">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-soft text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => router.push('/admin/wholesale/products')}
                    className="text-primary hover:underline"
                >
                    Back to Products
                </button>
            </div>
        );
    }

    return (
        <WholesaleProductForm
            initialData={initialData}
            onSubmit={handleUpdate}
            isEditing={true}
        />
    );
}
