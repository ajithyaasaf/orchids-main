'use client';

import { useRouter } from 'next/navigation';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { useToast } from '@/context/ToastContext';
import WholesaleProductForm, { WholesaleJobFormData } from '@/components/admin/WholesaleProductForm';

/**
 * Add New Wholesale Product Page
 * Route: /admin/wholesale/products/new
 */
export default function NewWholesaleProductPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const handleCreate = async (data: WholesaleJobFormData) => {
        try {
            await wholesaleProductsApi.create(data);
            showToast('Product created successfully', 'success');
            router.push('/admin/wholesale/products');
        } catch (error: any) {
            showToast(error.message || 'Failed to create product', 'error');
            throw error;
        }
    };

    return <WholesaleProductForm onSubmit={handleCreate} />;
}
