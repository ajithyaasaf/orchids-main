'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WholesaleProduct } from '@tntrends/shared';
import { useAuthToken } from '@/hooks/useAuthToken';
import { useToast } from '@/context/ToastContext';
import ImageUpload from './ImageUpload';

/**
 * High-Speed Admin Product Entry Form
 * Optimized for rapid manual product entry with:
 * - Smart defaults (bundleQty: 20, mixedColors: true)
 * - Composition presets for common size splits
 * - Real-time validation feedback
 * - "Save & Add Another" workflow
 * - Image upload with Cloudinary integration
 * - Authentication token handling
 * - Toast notifications
 */

interface ProductForm {
    title: string;
    description: string;
    category: string;
    bundleQty: number;
    bundleComposition: Record<string, number>;
    bundlePrice: number;
    availableBundles: number;
    colorDescription: string;
    images: string[];
}

const INITIAL_FORM: ProductForm = {
    title: '',
    description: '',
    category: 'Girls - T-Shirts',  // Default to most common category
    bundleQty: 20,
    bundleComposition: {},
    bundlePrice: 0,
    availableBundles: 0,
    colorDescription: 'Assorted colors',
    images: [],
};

// Available product categories (Wholesale Clothing Business)
const CATEGORIES = [
    // Newborn (0-12 months)
    'Newborn - Jubba',
    'Newborn - Gift Box',
    'Newborn - Cord Sets',
    'Newborn - Frocks',
    'Newborn - Rompers',
    'Newborn - Jumpsuits',
    'Newborn - Diapers',
    'Newborn - Underwear',
    'Newborn - Towels',
    'Newborn - Napkins',
    'Newborn - Socks',
    'Newborn - Gloves',
    'Newborn - Caps',
    'Newborn - Bibs',
    'Newborn - Baby Beds',
    'Newborn - Bed Sheets',

    // Girls
    'Girls - T-Shirts',
    'Girls - Frocks',
    'Girls - Skirts',
    'Girls - Pants',
    'Girls - Leggings',
    'Girls - Tights',
    'Girls - Palazzo Pants',
    'Girls - Slips',
    'Girls - Underwear',
    'Girls - Shorts',
    'Girls - 3/4 Pants',

    // Boys
    'Boys - T-Shirts',
    'Boys - Pants',
    'Boys - Shorts',
    'Boys - Underwear',
    'Boys - 3/4 Pants',

    // Women
    'Women - T-Shirts',
    'Women - Pants',
    'Women - Shorts',
    'Women - Leggings',
    'Women - 3/4 Pants',
    'Women - Long Polos',
    'Women - Feeding Dresses',
    'Women - Dresses',
    'Women - Underwear',
    'Women - Tights',
    'Women - Bed Sheets',
];

// Composition presets for common size distributions
const PRESETS = {
    '8-7-5': { M: 8, L: 7, XL: 5 },
    '10-10': { M: 10, L: 10 },
    '6-7-7': { S: 6, M: 7, L: 7 },
    '5-5-5-5': { S: 5, M: 5, L: 5, XL: 5 },
};

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export default function WholesaleProductForm() {
    const router = useRouter();
    const { authenticatedFetch, loading: authLoading } = useAuthToken();
    const { showToast } = useToast();

    const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Calculate total pieces in composition
    const totalPcs = Object.values(form.bundleComposition).reduce((a, b) => a + b, 0);
    const isValidComposition = totalPcs === form.bundleQty;

    // Apply composition preset
    const applyPreset = (presetKey: keyof typeof PRESETS) => {
        setForm({ ...form, bundleComposition: PRESETS[presetKey] });
    };

    // Update single size quantity
    const updateSize = (size: string, qty: number) => {
        setForm({
            ...form,
            bundleComposition: {
                ...form.bundleComposition,
                [size]: Math.max(0, qty),
            },
        });
    };

    // Submit product
    const handleSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
        e.preventDefault();
        setError('');

        if (!isValidComposition) {
            setError('Bundle composition must sum to bundle quantity');
            return;
        }

        if (!form.title || !form.bundlePrice) {
            setError('Title and bundle price are required');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await authenticatedFetch('/api/wholesale/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    mixedColors: true,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to create product');
            }

            if (addAnother) {
                // Reset form for next product
                setForm(INITIAL_FORM);
                alert('Product created successfully! Ready for next entry.');
            } else {
                // Navigate back
                router.push('/admin/wholesale/products');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create product');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Add Wholesale Product</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                {/* Basic Info */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Girls Cotton T-Shirt Mix"
                        autoFocus
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Product description..."
                    />
                </div>

                {/* Category Selection */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Image Upload */}
                <ImageUpload
                    images={form.images}
                    onImagesChange={(images) => setForm({ ...form, images })}
                    maxImages={5}
                />
                {fieldErrors.images && (
                    <p className="text-sm text-red-600 -mt-2">{fieldErrors.images}</p>
                )}

                {/* Bundle Configuration */}
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-blue-900">
                        Bundle Configuration
                    </h3>

                    {/* Composition Presets */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Quick Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {Object.keys(PRESETS).map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => applyPreset(preset as keyof typeof PRESETS)}
                                    className="px-4 py-2 bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors font-medium text-blue-900"
                                >
                                    {preset} Split
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bundle Quantity */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Total Pieces per Bundle
                        </label>
                        <input
                            type="number"
                            value={form.bundleQty}
                            onChange={(e) => setForm({ ...form, bundleQty: Number(e.target.value) })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            min={1}
                        />
                    </div>

                    {/* Size Distribution */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Size Distribution
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {SIZES.map((size) => (
                                <div key={size} className="text-center">
                                    <label className="block text-xs font-semibold mb-1 text-gray-600">
                                        {size}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.bundleComposition[size] || 0}
                                        onChange={(e) => updateSize(size, Number(e.target.value))}
                                        className="w-full px-2 py-2 border rounded-lg text-center text-lg font-semibold"
                                        min={0}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Validation Feedback */}
                    <div
                        className={`text-base font-semibold px-4 py-3 rounded-lg ${isValidComposition
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                            }`}
                    >
                        Total: {totalPcs} / {form.bundleQty}{' '}
                        {isValidComposition ? '✓ Valid Configuration' : '✗ Must match bundle qty'}
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-green-900">Pricing</h3>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                        Bundle Price (Total for {form.bundleQty} pieces){' '}
                        <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-700">₹</span>
                        <input
                            type="number"
                            value={form.bundlePrice}
                            onChange={(e) =>
                                setForm({ ...form, bundlePrice: Number(e.target.value) })
                            }
                            className="flex-1 px-4 py-3 border-2 rounded-lg text-2xl font-semibold focus:ring-2 focus:ring-green-500"
                            placeholder="0"
                            step="0.01"
                            required
                        />
                    </div>
                    {form.bundlePrice > 0 && form.bundleQty > 0 && (
                        <p className="text-sm text-gray-600 mt-2 font-medium">
                            Price per piece: ₹{(form.bundlePrice / form.bundleQty).toFixed(2)}
                        </p>
                    )}
                </div>

                {/* Stock */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Available Bundles (Stock)
                    </label>
                    <input
                        type="number"
                        value={form.availableBundles}
                        onChange={(e) =>
                            setForm({ ...form, availableBundles: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2 border rounded-lg"
                        min={0}
                    />
                    {form.availableBundles > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            Total pieces in stock: {form.availableBundles * form.bundleQty}
                        </p>
                    )}
                </div>

                {/* Color Description */}
                <div>
                    <label className="block text-sm font-medium mb-1">Color Description</label>
                    <input
                        type="text"
                        value={form.colorDescription}
                        onChange={(e) => setForm({ ...form, colorDescription: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="e.g., Assorted vibrant colors"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t">
                    <button
                        type="submit"
                        disabled={isSubmitting || !isValidComposition}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Saving...' : '💾 Save Product'}
                    </button>

                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e as any, true)}
                        disabled={isSubmitting || !isValidComposition}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Saving...' : '⚡ Save & Add Another'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
