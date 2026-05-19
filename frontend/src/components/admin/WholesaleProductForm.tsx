'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WholesaleProduct, PRODUCT_CATEGORIES, getSizeGroupForCategory } from '@orchids/shared';
import { useToast } from '@/context/ToastContext';
import ImageUpload from './ImageUpload';

/**
 * Wholesale Product Form Component
 *
 * Reusable form for creating and editing wholesale products.
 * Handles:
 * - State management for product fields
 * - Dynamic size labels based on selected category (age-ranges for kids, S/M/L for adults)
 * - Bundle configuration with category-aware presets
 * - Image management
 * - Unsaved changes warning
 */

export interface WholesaleJobFormData {
    title: string;
    description: string;
    category: string;
    tags: string[];
    styleCode: string;
    colorName: string;
    /** HSN code for Indian GST compliance — auto-filled from category, editable by admin */
    hsnCode: string;
    bundleQty: number;
    bundleComposition: Record<string, number>;
    bundlePrice: number;
    availableBundles: number;
    reservedBundles: number;
    colorDescription: string;
    images: string[];
    mixedColors: boolean;
}

interface WholesaleProductFormProps {
    initialData?: Partial<WholesaleProduct>;
    onSubmit: (data: WholesaleJobFormData) => Promise<void>;
    isEditing?: boolean;
    isLoading?: boolean;
}

const INITIAL_FORM: WholesaleJobFormData = {
    title: '',
    description: '',
    category: PRODUCT_CATEGORIES[0]?.id || '',
    tags: [],
    styleCode: '',
    colorName: '',
    hsnCode: PRODUCT_CATEGORIES[0]?.defaultHsn || '6204',
    bundleQty: 20,
    bundleComposition: {},
    bundlePrice: 0,
    availableBundles: 0,
    reservedBundles: 0,
    colorDescription: 'Assorted colors',
    images: [],
    mixedColors: true,
};

/** Badge color/text by sizing dimension type */
const SIZING_TYPE_BADGE: Record<string, { label: string; className: string }> = {
    kids_age:    { label: 'Age Range (Kids)',     className: 'bg-purple-100 text-purple-700' },
    newborn_age: { label: 'Age Range (Newborn)',  className: 'bg-pink-100 text-pink-700' },
    standard:    { label: 'Standard Sizes',       className: 'bg-blue-100 text-blue-700' },
    unisex:      { label: 'Unisex Sizes',         className: 'bg-green-100 text-green-700' },
};

export default function WholesaleProductForm({
    initialData,
    onSubmit,
    isEditing = false,
    isLoading: externalLoading = false
}: WholesaleProductFormProps) {
    const router = useRouter();
    const { showToast } = useToast();

    // Form State
    const [form, setForm] = useState<WholesaleJobFormData>(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    
    const isLoading = externalLoading || isSubmitting;

    // Initialize with data (edit mode)
    useEffect(() => {
        if (initialData) {
            setForm({
                title: initialData.title || '',
                description: initialData.description || '',
                category: initialData.category || INITIAL_FORM.category,
                tags: initialData.tags || [],
                styleCode: initialData.styleCode || '',
                colorName: initialData.colorName || '',
                // Use saved HSN if present, otherwise fall back to the category default
                hsnCode: initialData.hsnCode ||
                    PRODUCT_CATEGORIES.find(c => c.id === (initialData.category || INITIAL_FORM.category))?.defaultHsn ||
                    '6204',
                bundleQty: initialData.bundleQty || 20,
                bundleComposition: initialData.bundleComposition || {},
                bundlePrice: initialData.bundlePrice || 0,
                availableBundles: initialData.availableBundles || 0,
                reservedBundles: initialData.reservedBundles || 0,
                colorDescription: initialData.colorDescription || '',
                images: initialData.images || [],
                mixedColors: initialData.mixedColors ?? true,
            });
        }
    }, [initialData]);

    // Warn on unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const handleFieldChange = (updates: Partial<WholesaleJobFormData>) => {
        setForm(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
        setError('');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Derived category configuration
    // ─────────────────────────────────────────────────────────────────────────

    const activeCategoryConfig = useMemo(
        () => PRODUCT_CATEGORIES.find(c => c.id === form.category),
        [form.category]
    );

    /** Size group for the active category — updates when category changes */
    const activeSizeGroup = useMemo(
        () => getSizeGroupForCategory(form.category),
        [form.category]
    );

    const availableTags = activeCategoryConfig?.subcategories ?? [];

    // ─────────────────────────────────────────────────────────────────────────
    // Tag helpers
    // ─────────────────────────────────────────────────────────────────────────

    const handleTagToggle = (tagValue: string) => {
        const newTags = form.tags.includes(tagValue)
            ? form.tags.filter(t => t !== tagValue)
            : [...form.tags, tagValue];
        handleFieldChange({ tags: newTags });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Bundle composition helpers
    // ─────────────────────────────────────────────────────────────────────────

    const totalPcs = Object.values(form.bundleComposition).reduce((a, b) => a + (Number(b) || 0), 0);
    // Treat empty string bundleQty as 0 for validation purposes
    const isValidComposition = totalPcs === (Number(form.bundleQty) || 0);

    /** When category changes, clear the composition and auto-fill the default HSN */
    const handleCategoryChange = (newCategoryId: string) => {
        const catConfig = PRODUCT_CATEGORIES.find(c => c.id === newCategoryId);
        handleFieldChange({
            category: newCategoryId,
            tags: [],
            bundleComposition: {},
            hsnCode: catConfig?.defaultHsn || '6204',
        });
    };

    /** Apply a preset from the active size group */
    const applyPreset = (composition: Record<string, number>) => {
        handleFieldChange({ bundleComposition: composition });
    };

    /** Update a single size key in the composition */
    const updateSize = (size: string, value: string) => {
        handleFieldChange({
            bundleComposition: {
                ...form.bundleComposition,
                // Allow empty string to temporarily exist in state so backspace works
                [size]: value === '' ? ('' as any) : Math.max(0, Number(value)),
            },
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Submit
    // ─────────────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        if (!isValidComposition) {
            setError('Bundle composition must sum to bundle quantity');
            return;
        }

        if (!form.title || !form.bundlePrice) {
            setError('Title and bundle price are required');
            return;
        }

        if (form.images.length === 0) {
            setFieldErrors({ images: 'At least one image is required' });
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(form);
            setIsDirty(false);
        } catch (err: any) {
            setError(err.message || 'Failed to save product');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    const sizingBadge = SIZING_TYPE_BADGE[activeSizeGroup.type] ?? SIZING_TYPE_BADGE.standard;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-soft">
            <h1 className="text-3xl font-bold mb-6">
                {isEditing ? 'Edit Wholesale Product' : 'Add Wholesale Product'}
            </h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Basic Info ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => handleFieldChange({ title: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Girls Cotton T-Shirt Mix"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Style Code (Variant Group ID)
                        </label>
                        <input
                            type="text"
                            value={form.styleCode}
                            onChange={e => handleFieldChange({ styleCode: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., G-TSHIRT-001"
                            disabled={isLoading}
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Used to group color variants together</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Color Name</label>
                        <input
                            type="text"
                            value={form.colorName}
                            onChange={e => handleFieldChange({ colorName: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Dusty Rose"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        value={form.description}
                        onChange={e => handleFieldChange({ description: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Product description..."
                        disabled={isLoading}
                    />
                </div>

                {/* ── Category & HSN Code ──────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.category}
                            onChange={e => handleCategoryChange(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                            required
                        >
                            {PRODUCT_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            HSN Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.hsnCode}
                            onChange={e => handleFieldChange({ hsnCode: e.target.value.trim() })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            placeholder="e.g. 6204"
                            maxLength={8}
                            disabled={isLoading}
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Auto-filled from category. Edit only if this product uses a different HSN.
                        </p>
                    </div>
                </div>

                {/* ── Tags ────────────────────────────────────────────── */}
                {availableTags.length > 0 && (
                    <div className="bg-gray-50 p-4 border rounded-lg">
                        <label className="block text-sm font-medium mb-2">
                            Product Tags (Select all that apply)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {availableTags.map(tag => (
                                <label
                                    key={tag.value}
                                    className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.tags.includes(tag.value)}
                                        onChange={() => handleTagToggle(tag.value)}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        disabled={isLoading}
                                    />
                                    <span className="text-sm text-gray-700">{tag.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Images ──────────────────────────────────────────── */}
                <div>
                    <ImageUpload
                        images={form.images}
                        onImagesChange={images => handleFieldChange({ images })}
                        maxImages={5}
                    />
                    {fieldErrors.images && (
                        <p className="text-sm text-red-600 mt-1">{fieldErrors.images}</p>
                    )}
                </div>

                {/* ── Bundle Configuration ─────────────────────────────── */}
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-blue-900">Bundle Configuration</h3>
                        {/* Sizing type badge — tells the admin which dimension they are configuring */}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sizingBadge.className}`}>
                            {sizingBadge.label}
                        </span>
                    </div>

                    {/* Quick Presets — derived from the active size group */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Quick Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {activeSizeGroup.presets.map(preset => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => applyPreset(preset.composition)}
                                    className="px-4 py-2 bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors font-medium text-blue-900 text-sm"
                                    disabled={isLoading}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Total Bundle Quantity */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Total Pieces per Bundle
                        </label>
                        <input
                            type="number"
                            value={form.bundleQty}
                            onChange={e => {
                                const val = e.target.value;
                                const newQty = val === '' ? ('' as any) : Number(val);
                                const oldQty = Number(form.bundleQty) || 0;
                                
                                let updates: Partial<WholesaleJobFormData> = { bundleQty: newQty };
                                
                                // Preserve the per-piece price if quantity changes
                                if (oldQty > 0 && (form.bundlePrice as any) !== '' && Number(form.bundlePrice) > 0) {
                                    const piecePrice = Number(form.bundlePrice) / oldQty;
                                    updates.bundlePrice = piecePrice * (Number(newQty) || 0);
                                }
                                
                                handleFieldChange(updates);
                            }}
                            onWheel={e => (e.target as HTMLElement).blur()}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            min={1}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Size Distribution Grid — dynamic labels */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            {activeSizeGroup.dimensionLabel} Distribution
                        </label>
                        <div
                            className="grid gap-3"
                            style={{ gridTemplateColumns: `repeat(${Math.min(activeSizeGroup.sizes.length, 5)}, minmax(0, 1fr))` }}
                        >
                            {activeSizeGroup.sizes.map(size => (
                                <div key={size} className="text-center">
                                    <label className="block text-xs font-semibold mb-1 text-gray-600">
                                        {size}
                                    </label>
                                    <input
                                        type="number"
                                        value={form.bundleComposition[size] ?? ''}
                                        onChange={e => updateSize(size, e.target.value)}
                                        onWheel={e => (e.target as HTMLElement).blur()}
                                        className="w-full px-2 py-2 border rounded-lg text-center text-lg font-semibold"
                                        min={0}
                                        disabled={isLoading}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Composition Validation */}
                    <div
                        className={`text-base font-semibold px-4 py-3 rounded-lg ${
                            isValidComposition
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                    >
                        Total: {totalPcs} / {Number(form.bundleQty) || 0}{' '}
                        {isValidComposition ? '✓ Valid Configuration' : '✗ Must match bundle qty'}
                    </div>
                </div>

                {/* ── Pricing ──────────────────────────────────────────── */}
                <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-green-900">Pricing</h3>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                        Price per piece <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-700">₹</span>
                        <input
                            type="number"
                            value={(form.bundlePrice as any) === '' ? '' : (Number(form.bundleQty) > 0 ? Number(form.bundlePrice) / Number(form.bundleQty) : '')}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === '') {
                                    handleFieldChange({ bundlePrice: '' as any });
                                } else {
                                    handleFieldChange({ bundlePrice: Number(val) * (Number(form.bundleQty) || 0) });
                                }
                            }}
                            onWheel={e => (e.target as HTMLElement).blur()}
                            className="flex-1 px-4 py-3 border-2 rounded-lg text-2xl font-semibold focus:ring-2 focus:ring-green-500"
                            placeholder="0"
                            step="0.01"
                            disabled={isLoading || !form.bundleQty}
                            required
                        />
                    </div>
                    {Number(form.bundlePrice) > 0 && Number(form.bundleQty) > 0 && (
                        <p className="text-sm text-gray-600 mt-2 font-medium">
                            Total Bundle Price ({form.bundleQty} pieces): <span className="font-bold text-green-800">₹{Number(form.bundlePrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </p>
                    )}
                </div>

                {/* ── Stock ────────────────────────────────────────────── */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Available Bundles (Stock)
                    </label>
                    <input
                        type="number"
                        value={form.availableBundles}
                        onChange={e => handleFieldChange({ availableBundles: e.target.value === '' ? ('' as any) : Number(e.target.value) })}
                        onWheel={e => (e.target as HTMLElement).blur()}
                        className="w-full px-4 py-2 border rounded-lg"
                        min={0}
                        disabled={isLoading}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mt-2 gap-2">
                        {Number(form.availableBundles) > 0 ? (
                            <p>Total pieces in stock: {Number(form.availableBundles) * (Number(form.bundleQty) || 0)}</p>
                        ) : (
                            <p>Out of stock</p>
                        )}
                        {form.reservedBundles > 0 && (
                            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md font-medium text-xs flex items-center gap-1.5 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                                {form.reservedBundles} bundles currently held in pending checkouts
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Color Description ────────────────────────────────── */}
                <div>
                    <label className="block text-sm font-medium mb-1">Color Description</label>
                    <input
                        type="text"
                        value={form.colorDescription}
                        onChange={e => handleFieldChange({ colorDescription: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                        placeholder="e.g., Assorted vibrant colors"
                        disabled={isLoading}
                    />
                </div>

                {/* ── Actions ──────────────────────────────────────────── */}
                <div className="flex gap-4 pt-4 border-t">
                    <button
                        type="submit"
                        disabled={isLoading || !isValidComposition}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
