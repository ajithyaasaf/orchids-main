'use client';

import { useRouter } from 'next/navigation';
import { comboApi } from '@/lib/api';
import ComboForm from '@/components/admin/ComboForm';
import { ComboOffer } from '@tntrends/shared';

export default function NewComboPage() {
    const router = useRouter();

    const handleSubmit = async (data: Partial<ComboOffer>) => {
        await comboApi.admin.create(data);
        router.push('/admin/combos');
    };

    return (
        <div className="max-w-3xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create New Combo</h1>
                <p className="text-gray-600 mt-1">Set up a quantity-based combo offer</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <ComboForm onSubmit={handleSubmit} submitLabel="Create Combo" />
            </div>
        </div>
    );
}
