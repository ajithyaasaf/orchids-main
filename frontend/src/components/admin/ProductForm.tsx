'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductImage, StockBySize } from '@tntrends/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { uploadApi } from '@/lib/api';
import { Upload, X, Copy, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

const SHIPPING_BUFFER = 79; // Standard shipping buffer

export interface ProductFormData {
    title: string;
    description: string;
    basePrice: number;
    category: string;
    tags: string[];
    styleCode: string;
    color: string;
    discountType: 'percentage' | 'flat' | 'none';
    discountValue: number;
    stockBySize: StockBySize;
    images: ProductImage[];
}

interface ProductFormProps {
    initialData?: Partial<ProductFormData>;
    onSubmit: (data: ProductFormData) => Promise<void>;
    isEditing?: boolean;
    submitLabel?: string;
}

export default function ProductForm({
    initialData,
    onSubmit,
    isEditing = false,
    submitLabel
}: ProductFormProps) {
    const router = useRouter();
    const { showToast } = useToast();

    // Form State
    const [formData, setFormData] = useState<ProductFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        basePrice: initialData?.basePrice || 0,
        category: initialData?.category || '',
        tags: initialData?.tags || [],
        styleCode: initialData?.styleCode || '',
        color: initialData?.color || '',
        discountType: initialData?.discountType || 'none',
        discountValue: initialData?.discountValue || 0,
        stockBySize: initialData?.stockBySize || {},
        images: initialData?.images || [],
    });

    // UI/Auxiliary State
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [availableSizes, setAvailableSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
    const [pricingMode, setPricingMode] = useState<'simple' | 'discount'>('simple');
    const [validationErrors, setValidationErrors] = useState<{ price?: string; discount?: string }>({});
    const [isDirty, setIsDirty] = useState(false);

    // Initialize pricing mode and available sizes based on data
    useEffect(() => {
        if (initialData) {
            if (initialData.discountType !== 'none' && (initialData.discountValue || 0) > 0) {
                setPricingMode('discount');
            }
            if (initialData.stockBySize) {
                const sizes = Object.keys(initialData.stockBySize);
                if (sizes.length > 0) {
                    // Merge existing standard sizes with any custom ones found in data
                    const standardSizes = ['S', 'M', 'L', 'XL', 'XXL', '2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'];
                    const newSizes = Array.from(new Set([...availableSizes, ...sizes]));
                    setAvailableSizes(newSizes);
                }
            }
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

    const handleFieldChange = (updates: Partial<ProductFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
        setValidationErrors({});
    };

    // Calculate Customer Price
    const calculateCustomerPrice = (): { original: number; discounted: number; savings: number } => {
        if (formData.basePrice <= 0) return { original: 0, discounted: 0, savings: 0 };

        const originalDisplayPrice = formData.basePrice + SHIPPING_BUFFER;

        let discountedDisplayPrice = originalDisplayPrice;
        if (formData.discountType === 'percentage') {
            discountedDisplayPrice = originalDisplayPrice * (1 - formData.discountValue / 100);
        } else if (formData.discountType === 'flat') {
            discountedDisplayPrice = Math.max(0, originalDisplayPrice - formData.discountValue);
        }

        return {
            original: originalDisplayPrice,
            discounted: discountedDisplayPrice,
            savings: originalDisplayPrice - discountedDisplayPrice
        };
    };

    // Validations
    const validatePricing = (): boolean => {
        const errors: typeof validationErrors = {};

        if (formData.basePrice <= 0) errors.price = 'Product price must be greater than 0';
        if (formData.basePrice < 100) errors.price = 'Product price seems too low. Minimum recommended: ₹100';

        if (formData.discountType === 'percentage' && formData.discountValue > 100) {
            errors.discount = 'Discount cannot exceed 100%';
        }

        const displayPrice = formData.basePrice + SHIPPING_BUFFER;
        if (formData.discountType === 'flat' && formData.discountValue >= displayPrice) {
            errors.discount = `Discount cannot exceed display price (₹${displayPrice})`;
        }

        if (formData.discountValue < 0) errors.discount = 'Discount cannot be negative';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handlers
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const uploadedImage = await uploadApi.uploadImage(file);
            handleFieldChange({ images: [...formData.images, uploadedImage] });
        } catch (error) {
            showToast('Image upload failed', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index: number) => {
        handleFieldChange({ images: formData.images.filter((_, i) => i !== index) });
    };

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (!trimmed) return;
        if (formData.tags.includes(trimmed)) return showToast('Tag already added', 'error');
        if (formData.tags.length >= 10) return showToast('Maximum 10 tags allowed', 'error');

        handleFieldChange({ tags: [...formData.tags, trimmed] });
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        handleFieldChange({ tags: formData.tags.filter(t => t !== tag) });
    };

    const addCustomSize = () => {
        if (customSizeInput && !availableSizes.includes(customSizeInput)) {
            setAvailableSizes([...availableSizes, customSizeInput]);
            setCustomSizeInput('');
        }
    };

    const handleStockChange = (size: string, qty: string) => {
        handleFieldChange({
            stockBySize: {
                ...formData.stockBySize,
                [size]: parseInt(qty) || 0
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.images.length === 0) return showToast('Please upload at least one image', 'error');
        if (!validatePricing()) return showToast('Please fix pricing errors', 'error');

        setLoading(true);
        try {
            await onSubmit(formData);
            setIsDirty(false); // Reset dirty state on success
        } catch (error) {
            // Error handled by parent or API wrapper usually, but safe to keep loading false here
        } finally {
            setLoading(false);
        }
    };

    const customerPrice = calculateCustomerPrice();
    const hasDiscount = customerPrice.savings > 0;

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-soft p-4 md:p-6 lg:p-8 max-w-4xl">
            <div className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <Input
                            label="Product Title *"
                            value={formData.title}
                            onChange={(e) => handleFieldChange({ title: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Category *</label>
                        <select
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={formData.category}
                            onChange={(e) => handleFieldChange({ category: e.target.value })}
                            required
                        >
                            <option value="">Select category</option>
                            <option value="Men">Men</option>
                            <option value="Women">Women</option>
                            <option value="Kids">Kids</option>
                        </select>
                    </div>

                    {/* Tags */}
                    <div className="md:col-span-2 bg-purple-50/50 p-6 rounded-xl border border-purple-100">
                        <h3 className="font-bold text-purple-900 mb-2">Product Tags</h3>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                className="flex-1 px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                placeholder="Add tag (e.g. Cotton, Summer)..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            />
                            <Button type="button" onClick={addTag} variant="outline" size="sm">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 bg-white text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-100 shadow-sm">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 p-6 rounded-xl border border-green-100">
                    <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" /> Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Input
                                label="Base Price (₹) *"
                                type="number"
                                value={formData.basePrice || ''}
                                onChange={(e) => handleFieldChange({ basePrice: parseFloat(e.target.value) || 0 })}
                                required
                            />
                            {validationErrors.price && <p className="text-sm text-red-600 mt-1">{validationErrors.price}</p>}
                            <p className="text-xs text-gray-500 mt-1">+ ₹{SHIPPING_BUFFER} shipping buffer will be added</p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg border border-green-200 backdrop-blur-sm">
                            <p className="text-xs text-gray-600 mb-1">Customer Price:</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-green-700">₹{customerPrice.discounted.toFixed(0)}</span>
                                {hasDiscount && <span className="text-sm text-gray-400 line-through">₹{customerPrice.original.toFixed(0)}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-green-200/50">
                        <label className="flex items-center gap-2 mb-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={pricingMode === 'discount'}
                                onChange={(e) => {
                                    setPricingMode(e.target.checked ? 'discount' : 'simple');
                                    if (!e.target.checked) handleFieldChange({ discountType: 'none', discountValue: 0 });
                                }}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="font-medium text-gray-700">Apply Discount</span>
                        </label>

                        {pricingMode === 'discount' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">Type</label>
                                    <select
                                        className="w-full px-4 py-2 border border-border rounded-lg"
                                        value={formData.discountType}
                                        onChange={(e) => handleFieldChange({ discountType: e.target.value as any })}
                                    >
                                        <option value="none">None</option>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <Input
                                        label="Value"
                                        type="number"
                                        value={formData.discountValue || ''}
                                        onChange={(e) => handleFieldChange({ discountValue: parseFloat(e.target.value) || 0 })}
                                    />
                                    {validationErrors.discount && <p className="text-sm text-red-600 mt-1">{validationErrors.discount}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Variants */}
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <Copy className="w-4 h-4" /> Variants (H&M Style)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Input
                                label="Style Code"
                                placeholder="e.g. OX-2025"
                                value={formData.styleCode}
                                onChange={(e) => handleFieldChange({ styleCode: e.target.value })}
                            />
                            <p className="text-xs text-blue-600 mt-1">Products with same code appear as colors</p>
                        </div>
                        <Input
                            label="Color Name"
                            placeholder="e.g. Navy Blue"
                            value={formData.color}
                            onChange={(e) => handleFieldChange({ color: e.target.value })}
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Description *</label>
                    <textarea
                        className="w-full px-4 py-2 border border-border rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={formData.description}
                        onChange={(e) => handleFieldChange({ description: e.target.value })}
                        required
                    />
                </div>

                {/* Images */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Images *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {formData.images.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                <Image src={img.url} alt="Product" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">{uploadingImage ? 'Uploading...' : 'Add Image'}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                    </div>
                </div>

                {/* Inventory */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-text-primary">Stock by Size</h3>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setAvailableSizes(['S', 'M', 'L', 'XL', 'XXL'])} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Adults</button>
                            <button type="button" onClick={() => setAvailableSizes(['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'])} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200">Kids</button>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="Add Custom Size..."
                            value={customSizeInput}
                            onChange={(e) => setCustomSizeInput(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button type="button" onClick={addCustomSize} variant="outline">Add</Button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {availableSizes.map((size) => (
                            <div key={size}>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{size}</label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={formData.stockBySize[size] || ''}
                                    onChange={(e) => handleStockChange(size, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                    <Button type="submit" isLoading={loading} className="w-full sm:flex-1">
                        {submitLabel || (isEditing ? 'Update Product' : 'Create Product')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                </div>
            </div>
        </form>
    );
}
