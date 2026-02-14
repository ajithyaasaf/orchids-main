'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { productApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

function NewProductPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sourceId = searchParams.get('sourceId');
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<Partial<ProductFormData> | undefined>(undefined);
    const [fetchingSource, setFetchingSource] = useState(false);

    // Copy Logic
    useEffect(() => {
        const loadSourceProduct = async () => {
            if (!sourceId) return;

            setFetchingSource(true);
            try {
                const { data: sourceProduct } = await productApi.getById(sourceId);
                if (sourceProduct) {
                    setInitialData({
                        title: `${sourceProduct.title} (Copy)`,
                        description: sourceProduct.description,
                        basePrice: sourceProduct.basePrice || sourceProduct.price || 0,
                        category: sourceProduct.category,
                        tags: sourceProduct.tags || [],
                        styleCode: sourceProduct.styleCode || '',
                        color: '', // Clear color for new variant
                        discountType: sourceProduct.discountType,
                        discountValue: sourceProduct.discountValue,
                        stockBySize: {}, // Reset stock
                        images: sourceProduct.images || [],
                    });
                }
            } catch (error) {
                console.error('Failed to load source product', error);
                showToast('Failed to load source product', 'error');
            } finally {
                setFetchingSource(false);
            }
        };
        loadSourceProduct();
    }, [sourceId, showToast]);

    const handleCreate = async (data: ProductFormData) => {
        // Transform form data to API payload if needed
        // The API likely expects 'sizes' array computed from stockBySize
        const sizes = Object.keys(data.stockBySize).filter(size => data.stockBySize[size] > 0);

        // Also ensure all available sizes in the form are tracked if the backend requires 'sizes' field 
        // irrespective of stock (though typically 'sizes' implies available sizes).
        // Looking at previous valid implementation:
        // const activeSizes = availableSizes;
        // logic was: set activeSizes based on UI state. 
        // Here we can infer sizes from stock or just pass all keys.
        // Let's pass keys that have been touched/added to stockBySize.

        const payload = {
            ...data,
            sizes: Object.keys(data.stockBySize),
            inStock: Object.values(data.stockBySize).some(qty => qty > 0),
        };

        try {
            await productApi.create(payload);
            showToast('Product created successfully', 'success');
            router.push('/admin/products');
        } catch (error: any) {
            showToast(error.message || 'Failed to create product', 'error');
            throw error;
        }
    };

    if (fetchingSource) {
        return (
            <div className="flex bg-white items-center justify-center min-h-[400px] rounded-xl shadow-soft">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading source product...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 md:mb-8">
                {sourceId ? 'Add Variant (Copy)' : 'Add New Product'}
            </h1>
            <ProductForm
                initialData={initialData}
                onSubmit={handleCreate}
                submitLabel={sourceId ? 'Create Variant' : 'Create Product'}
            />
        </div>
    );
}

export default function NewProductPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewProductPageContent />
        </Suspense>
    );
}