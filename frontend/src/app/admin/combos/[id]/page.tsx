'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { comboApi } from '@/lib/api';
import ComboForm from '@/components/admin/ComboForm';
import { ComboOffer } from '@tntrends/shared';

export default function EditComboPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [combo, setCombo] = useState<ComboOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCombo();
    }, [params.id]);

    const fetchCombo = async () => {
        try {
            setLoading(true);
            const response = await comboApi.getById(params.id);
            setCombo(response.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: Partial<ComboOffer>) => {
        await comboApi.admin.update(params.id, data);
        router.push('/admin/combos');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-gray-600">Loading combo...</div>
            </div>
        );
    }

    if (error || !combo) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                Error: {error || 'Combo not found'}
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Combo</h1>
                <p className="text-gray-600 mt-1">Update combo offer settings</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <ComboForm
                    initialData={combo}
                    onSubmit={handleSubmit}
                    submitLabel="Update Combo"
                />
            </div>
        </div>
    );
}
