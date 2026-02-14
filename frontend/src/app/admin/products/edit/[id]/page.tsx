'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<Partial<ProductFormData> | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await productApi.getById(id);
                // Handle case where API might return just the object without { data: ... } wrapper 
                // Adjust based on existing api structure. Checking api.ts...
                // api.ts: getById: (id: string) => apiFetch(`/api/products/${id}`)
                // apiFetch returns data directly if response is JSON and ok.
                // But let's check if the return value of getById is the product itself or { data: product }
                // Looking at NewPage refactor: const { data: sourceProduct } = await productApi.getById(sourceId);
                // This implies the API returns { data: ... } structure.

                // However, let's be safe.
                const product = data || (await productApi.getById(id)).data;

                if (!product) throw new Error('Product not found');

                setInitialData({
                    title: product.title,
                    description: product.description,
                    basePrice: product.basePrice || product.price || 0,
                    category: product.category,
                    tags: product.tags || [],
                    styleCode: product.styleCode || '',
                    color: product.color || '',
                    discountType: product.discountType,
                    discountValue: product.discountValue,
                    stockBySize: product.stockBySize || {},
                    images: product.images || [],
                });
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

    const handleUpdate = async (data: ProductFormData) => {
        const sizes = Object.keys(data.stockBySize).filter(size => data.stockBySize[size] > 0);

        const payload = {
            ...data,
            sizes: Object.keys(data.stockBySize),
            inStock: Object.values(data.stockBySize).some(qty => qty > 0),
        };

        try {
            await productApi.update(id, payload);
            showToast('Product updated successfully', 'success');
            router.push('/admin/products');
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
                    onClick={() => router.push('/admin/products')}
                    className="text-primary hover:underline"
                >
                    Back to Products
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 md:mb-8">
                Edit Product
            </h1>
            <ProductForm
                initialData={initialData}
                onSubmit={handleUpdate}
                isEditing={true}
                submitLabel="Update Product"
            />
        </div>
    );
}
