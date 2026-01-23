'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ComboOffer, ComboType } from '@tntrends/shared';
import { useToast } from '@/context/ToastContext';

interface ComboFormProps {
    initialData?: Partial<ComboOffer>;
    onSubmit: (data: Partial<ComboOffer>) => Promise<void>;
    submitLabel: string;
}

export default function ComboForm({ initialData, onSubmit, submitLabel }: ComboFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        type: (initialData?.type || 'quantity_based') as ComboType,
        minimumQuantity: initialData?.minimumQuantity || 2,
        comboPrice: initialData?.comboPrice || 0,
        active: initialData?.active !== undefined ? initialData.active : true,
        startDate: initialData?.startDate
            ? new Date(initialData.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        endDate: initialData?.endDate
            ? new Date(initialData.endDate).toISOString().split('T')[0]
            : '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Combo name is required';
        }

        if (formData.minimumQuantity < 2) {
            newErrors.minimumQuantity = 'Minimum quantity must be at least 2';
        }

        if (formData.comboPrice <= 0) {
            newErrors.comboPrice = 'Combo price must be greater than 0';
        }

        if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
            newErrors.endDate = 'End date must be after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                startDate: new Date(formData.startDate),
                endDate: formData.endDate ? new Date(formData.endDate) : undefined,
            });
            showToast('Combo saved successfully', 'success');
        } catch (err: any) {
            showToast(`Failed to save combo: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Combo Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Combo Name *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="e.g., Summer Flash Sale"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Combo Type (MVP: Only quantity_based, but UI ready for expansion) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Combo Type
                </label>
                <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled
                >
                    <option value="quantity_based">Quantity-Based (Buy X for ₹Y)</option>
                    {/* Path 2 options - currently disabled */}
                    <option value="category_based" disabled>
                        Category-Based (Coming Soon)
                    </option>
                    <option value="bundle" disabled>
                        Product Bundle (Coming Soon)
                    </option>
                </select>
                <p className="text-gray-500 text-sm mt-1">
                    Currently only quantity-based combos are available
                </p>
            </div>

            {/* Minimum Quantity & Combo Price */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Quantity *
                    </label>
                    <input
                        type="number"
                        value={formData.minimumQuantity}
                        onChange={(e) => handleChange('minimumQuantity', parseInt(e.target.value))}
                        min="2"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.minimumQuantity ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.minimumQuantity && (
                        <p className="text-red-500 text-sm mt-1">{errors.minimumQuantity}</p>
                    )}
                    <p className="text-gray-500 text-sm mt-1">Items needed for combo</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Combo Price (₹) *
                    </label>
                    <input
                        type="number"
                        value={formData.comboPrice}
                        onChange={(e) => handleChange('comboPrice', parseFloat(e.target.value))}
                        min="1"
                        step="0.01"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.comboPrice ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.comboPrice && (
                        <p className="text-red-500 text-sm mt-1">{errors.comboPrice}</p>
                    )}
                    <p className="text-gray-500 text-sm mt-1">Final price for combo</p>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">Preview:</p>
                <p className="text-lg text-blue-700 mt-1">
                    🎁 Buy {formData.minimumQuantity} items for ₹{formData.comboPrice}
                </p>
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                    </label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date (Optional)
                    </label>
                    <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                    <p className="text-gray-500 text-sm mt-1">Leave empty for permanent combo</p>
                </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => handleChange('active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                    Activate this combo immediately
                </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                    {loading ? 'Saving...' : submitLabel}
                </button>
            </div>
        </form>
    );
}
