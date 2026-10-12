'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    WholesaleProduct,
    PRODUCT_CATEGORIES,
    getSizeGroupForCategory,
    tagToSlug,
    slugToTag,
    MAX_TAGS_PER_PRODUCT,
} from '@orchids/shared';
import { Plus, X, Tag, Search, Check } from 'lucide-react';
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
    kids_age: { label: 'Age Range (Kids)', className: 'bg-purple-100 text-purple-700' },
    newborn_age: { label: 'Age Range (Newborn)', className: 'bg-pink-100 text-pink-700' },
    standard: { label: 'Standard Sizes', className: 'bg-blue-100 text-blue-700' },
    unisex: { label: 'Unisex Sizes', className: 'bg-green-100 text-green-700' },
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
    // Tag helpers (Standard presets + Custom tag management)
    // ─────────────────────────────────────────────────────────────────────────

    const [customTagInput, setCustomTagInput] = useState('');
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [tagError, setTagError] = useState('');

    const handleTagToggle = (tagValue: string) => {
        setTagError('');
        const newTags = form.tags.includes(tagValue)
            ? form.tags.filter(t => t !== tagValue)
            : [...form.tags, tagValue];
        handleFieldChange({ tags: newTags });
    };

    const handleRemoveTag = (tagValue: string) => {
        setTagError('');
        handleFieldChange({ tags: form.tags.filter(t => t !== tagValue) });
    };

    const getTagDisplayLabel = (tagValue: string) => {
        const found = availableTags.find(t => t.value === tagValue);
        if (found) return found.label;

        for (const cat of PRODUCT_CATEGORIES) {
            const sub = cat.subcategories.find(s => s.value === tagValue);
            if (sub) return sub.label;
        }

        return slugToTag(tagValue);
    };

    const handleAddCustomTag = () => {
        setTagError('');
        const trimmed = customTagInput.trim().replace(/\s+/g, ' ');
        if (!trimmed) return;

        if (trimmed.length < 2) {
            setTagError('Tag must be at least 2 characters.');
            return;
        }

        if (trimmed.length > 50) {
            setTagError('Tag cannot exceed 50 characters.');
            return;
        }

        if (form.tags.length >= MAX_TAGS_PER_PRODUCT) {
            setTagError(`Maximum of ${MAX_TAGS_PER_PRODUCT} tags allowed per product.`);
            return;
        }

        const generatedSlug = tagToSlug(trimmed);

        // Check if already selected
        if (form.tags.includes(generatedSlug)) {
            setTagError(`Tag "${trimmed}" is already selected.`);
            return;
        }

        // Check if it matches an existing standard category tag (by slug or label)
        const matchedStandardTag = availableTags.find(
            t => t.value.toLowerCase() === generatedSlug || t.label.toLowerCase() === trimmed.toLowerCase()
        );

        if (matchedStandardTag) {
            if (form.tags.includes(matchedStandardTag.value)) {
                setTagError(`Tag "${matchedStandardTag.label}" is already selected.`);
            } else {
                handleFieldChange({ tags: [...form.tags, matchedStandardTag.value] });
                setCustomTagInput('');
            }
            return;
        }

        handleFieldChange({ tags: [...form.tags, generatedSlug] });
        setCustomTagInput('');
    };

    const filteredAvailableTags = useMemo(() => {
        if (!tagSearchQuery.trim()) return availableTags;
        const q = tagSearchQuery.toLowerCase().trim();
        return availableTags.filter(
            t => t.label.toLowerCase().includes(q) || t.value.toLowerCase().includes(q)
        );
    }, [availableTags, tagSearchQuery]);

    // ─────────────────────────────────────────────────────────────────────────
    // Bundle composition helpers
    // ─────────────────────────────────────────────────────────────────────────

    const totalPcs = Object.values(form.bundleComposition).reduce((a, b) => a + (Number(b) || 0), 0);
    // Treat empty string bundleQty as 0 for validation purposes
    const isValidComposition = totalPcs === (Number(form.bundleQty) || 0);

    /** When category changes, clear the composition, reset tags, and auto-fill the default HSN */
    const handleCategoryChange = (newCategoryId: string) => {
        const catConfig = PRODUCT_CATEGORIES.find(c => c.id === newCategoryId);
        setCustomTagInput('');
        setTagSearchQuery('');
        setTagError('');
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

                {/* ── Product Tags (Hybrid Quick-Select + Custom) ─────────── */}
                <div className="bg-gray-50/70 p-5 border border-gray-200/80 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900">
                                Product Tags
                            </label>
                            <p className="text-xs text-gray-500">
                                Tags power customer search, filters, and mega-menu navigation.
                            </p>
                        </div>
                        <span className="text-xs font-medium text-gray-500 self-start sm:self-auto bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-2xs">
                            {form.tags.length} / {MAX_TAGS_PER_PRODUCT} selected
                        </span>
                    </div>

                    {/* Selected Tags Chips (Removable) */}
                    {form.tags.length > 0 && (
                        <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Selected Tags
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {form.tags.map(tagValue => {
                                    const isCustom = !availableTags.some(t => t.value === tagValue);
                                    return (
                                        <span
                                            key={tagValue}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                                isCustom
                                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}
                                        >
                                            <span>{getTagDisplayLabel(tagValue)}</span>
                                            {isCustom && (
                                                <span className="text-[10px] bg-purple-200/60 text-purple-800 px-1.5 py-0.2 rounded font-medium">
                                                    custom
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tagValue)}
                                                className="text-gray-400 hover:text-red-600 transition-colors ml-0.5 rounded-full p-0.5"
                                                title="Remove tag"
                                                disabled={isLoading}
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quick-Select Category Presets */}
                    {availableTags.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    Quick-Select Category Styles
                                </span>
                                {availableTags.length > 8 && (
                                    <div className="relative w-48">
                                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={tagSearchQuery}
                                            onChange={e => setTagSearchQuery(e.target.value)}
                                            placeholder="Find standard tag..."
                                            className="w-full pl-8 pr-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 bg-white/60 border border-gray-100 rounded-lg">
                                {filteredAvailableTags.map(tag => {
                                    const isSelected = form.tags.includes(tag.value);
                                    return (
                                        <button
                                            key={tag.value}
                                            type="button"
                                            onClick={() => handleTagToggle(tag.value)}
                                            disabled={isLoading}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                                                isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600'
                                            }`}
                                        >
                                            {isSelected ? (
                                                <Check className="w-3 h-3 text-white" />
                                            ) : (
                                                <Plus className="w-3 h-3 text-gray-400" />
                                            )}
                                            <span>{tag.label}</span>
                                        </button>
                                    );
                                })}
                                {filteredAvailableTags.length === 0 && (
                                    <p className="text-xs text-gray-400 py-1 px-2">No matching standard tags found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* + Add Custom Tag Section */}
                    <div className="pt-2 border-t border-gray-200/80 space-y-2">
                        <label className="block text-xs font-semibold text-gray-700">
                            Can't find a tag? Add a custom one:
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={customTagInput}
                                    onChange={e => {
                                        setCustomTagInput(e.target.value);
                                        setTagError('');
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddCustomTag();
                                        }
                                    }}
                                    placeholder="e.g. Muslin Dhoti, Silk Frock, Summer Special..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    disabled={isLoading || form.tags.length >= MAX_TAGS_PER_PRODUCT}
                                    maxLength={50}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddCustomTag}
                                disabled={isLoading || !customTagInput.trim() || form.tags.length >= MAX_TAGS_PER_PRODUCT}
                                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Tag</span>
                            </button>
                        </div>
                        {tagError && (
                            <p className="text-xs text-red-600 font-medium">{tagError}</p>
                        )}
                    </div>
                </div>

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
                        className={`text-base font-semibold px-4 py-3 rounded-lg ${isValidComposition
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
