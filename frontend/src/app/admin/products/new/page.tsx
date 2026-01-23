'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, ProductImage, StockBySize } from '@tntrends/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productApi, uploadApi } from '@/lib/api';
import { Upload, X, Copy, Info, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';

/**
 * PRICING SYSTEM (Best Practices Implementation - UPDATED)
 * 
 * Admin Experience:
 * - Admin enters "Product Price" (the actual product cost)
 * - System automatically adds ₹79 shipping buffer
 * - Customer sees final "Display Price"
 * 
 * DISCOUNT LOGIC (NEW):
 * - Discounts now apply to the FULL display price (basePrice + ₹79)
 * - This ensures discount badges match actual customer savings
 * 
 * Example:
 * Admin enters Product Price: ₹100, 10% discount
 * → Stored as: { basePrice: 100, discountType: 'percentage', discountValue: 10 }
 * → Original display: ₹179 (100 + 79)
 * → After 10% off: ₹161 (179 × 0.9)
 * → Badge shows: "-10%" and customer gets true 10% off ₹179
 */

const SHIPPING_BUFFER = 79; // Standard shipping buffer added to all products

// Helper to wrap search params usage
function ProductForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sourceId = searchParams.get('sourceId');
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [fetchingSource, setFetchingSource] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        basePrice: 0,  // The actual product price (admin input)
        category: '',
        tags: [] as string[], // NEW: Tags for dual navigation
        styleCode: '',
        color: '',
        discountType: 'none' as 'percentage' | 'flat' | 'none',
        discountValue: 0,
        stockBySize: {} as StockBySize,
        images: [] as ProductImage[],
    });

    const [tagInput, setTagInput] = useState(''); // NEW: Tag input state

    // Size Management
    const [customSizeInput, setCustomSizeInput] = useState('');
    const [availableSizes, setAvailableSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);

    // Pricing Mode State
    const [pricingMode, setPricingMode] = useState<'simple' | 'discount'>('simple');
    const [validationErrors, setValidationErrors] = useState<{ price?: string; discount?: string }>({});

    // Magic Copy Logic (Load source product if copying)
    useEffect(() => {
        const loadSourceProduct = async () => {
            if (!sourceId) return;

            setFetchingSource(true);
            try {
                const { data: sourceProduct } = await productApi.getById(sourceId);
                if (sourceProduct) {
                    // Use basePrice if available, fallback to price for backward compatibility
                    const basePrice = sourceProduct.basePrice || sourceProduct.price || 0;

                    setFormData(prev => ({
                        ...prev,
                        title: sourceProduct.title + ' (Copy)',
                        description: sourceProduct.description,
                        basePrice: basePrice,
                        category: sourceProduct.category,
                        tags: sourceProduct.tags || [], // Load tags
                        styleCode: sourceProduct.styleCode || '',
                        discountType: sourceProduct.discountType,
                        discountValue: sourceProduct.discountValue,
                    }));

                    setAvailableSizes(sourceProduct.sizes);

                    // Set pricing mode based on discount
                    if (sourceProduct.discountType !== 'none' && sourceProduct.discountValue > 0) {
                        setPricingMode('discount');
                    }
                }
            } catch (error) {
                console.error('Failed to load source product', error);
            } finally {
                setFetchingSource(false);
            }
        };
        loadSourceProduct();
    }, [sourceId]);

    // Calculate what customer will see (with shipping buffer and discounts)
    // NEW: Discount now applies to FULL display price (basePrice + ₹79)
    const calculateCustomerPrice = (): { original: number; discounted: number; savings: number } => {
        if (formData.basePrice <= 0) {
            return { original: 0, discounted: 0, savings: 0 };
        }

        // Original display price (what customer sees before discount)
        const originalDisplayPrice = formData.basePrice + SHIPPING_BUFFER;

        // Apply discount to FULL display price (not just basePrice)
        let discountedDisplayPrice = originalDisplayPrice;
        if (formData.discountType === 'percentage') {
            discountedDisplayPrice = originalDisplayPrice * (1 - formData.discountValue / 100);
        } else if (formData.discountType === 'flat') {
            discountedDisplayPrice = Math.max(0, originalDisplayPrice - formData.discountValue);
        }

        const savings = originalDisplayPrice - discountedDisplayPrice;

        return {
            original: originalDisplayPrice,
            discounted: discountedDisplayPrice,
            savings: savings
        };
    };

    // Validation
    const validatePricing = (): boolean => {
        const errors: typeof validationErrors = {};

        if (formData.basePrice <= 0) {
            errors.price = 'Product price must be greater than 0';
        }

        if (formData.basePrice < 100) {
            errors.price = 'Product price seems too low. Minimum recommended: ₹100';
        }

        if (formData.discountType === 'percentage' && formData.discountValue > 100) {
            errors.discount = 'Discount cannot exceed 100%';
        }

        // Validate flat discount against display price (not just basePrice)
        const displayPrice = formData.basePrice + SHIPPING_BUFFER;
        if (formData.discountType === 'flat' && formData.discountValue >= displayPrice) {
            errors.discount = `Discount cannot exceed display price (₹${displayPrice})`;
        }

        if (formData.discountValue < 0) {
            errors.discount = 'Discount cannot be negative';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const { data } = await uploadApi.uploadImage(file);
            setFormData({
                ...formData,
                images: [...formData.images, data],
            });
        } catch (error) {
            showToast('Image upload failed', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, i) => i !== index),
        });
    };

    // Size Management
    const addCustomSize = () => {
        if (customSizeInput && !availableSizes.includes(customSizeInput)) {
            setAvailableSizes([...availableSizes, customSizeInput]);
            setCustomSizeInput('');
        }
    };

    const handleStockChange = (size: string, qty: string) => {
        setFormData(prev => ({
            ...prev,
            stockBySize: {
                ...prev.stockBySize,
                [size]: parseInt(qty) || 0
            }
        }));
    };

    // Tag Management
    const addTag = () => {
        const trimmed = tagInput.trim();
        if (!trimmed) return;

        if (formData.tags.includes(trimmed)) {
            showToast('Tag already added', 'error');
            return;
        }

        if (formData.tags.length >= 10) {
            showToast('Maximum 10 tags allowed', 'error');
            return;
        }

        setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed] }));
        setTagInput('');
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.images.length === 0) {
            showToast('Please upload at least one image', 'error');
            return;
        }

        if (!validatePricing()) {
            showToast('Please fix pricing errors before submitting', 'error');
            return;
        }

        setLoading(true);

        try {
            const activeSizes = availableSizes;

            // Prepare product data with basePrice
            const productData: any = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                tags: formData.tags, // NEW: Include tags
                styleCode: formData.styleCode,
                color: formData.color,
                sizes: activeSizes,
                stockBySize: formData.stockBySize,
                inStock: Object.values(formData.stockBySize).some(qty => qty > 0),
                images: formData.images,

                // CRITICAL: Save as basePrice (the actual product cost)
                basePrice: formData.basePrice,
                discountType: formData.discountType,
                discountValue: formData.discountValue,
            };

            await productApi.create(productData);
            showToast('Product created successfully', 'success');
            router.push('/admin/products');
        } catch (error: any) {
            showToast(error.message || 'Failed to create product', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingSource) return <div className="p-8">Loading source product...</div>;

    const customerPrice = calculateCustomerPrice();
    const hasDiscount = customerPrice.savings > 0;

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 md:mb-8">
                {sourceId ? 'Add Variant (Copy)' : 'Add New Product'}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-soft p-4 md:p-6 lg:p-8 max-w-4xl">
                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <Input
                                label="Product Title *"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">Category *</label>
                            <select
                                className="w-full px-4 py-2 border border-border rounded-lg"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <option value="">Select category</option>
                                <option value="Men">Men</option>
                                <option value="Women">Women</option>
                                <option value="Kids">Kids</option>
                            </select>
                        </div>

                        {/* Product Tags */}
                        <div className="md:col-span-2 bg-purple-50 p-6 rounded-xl border border-purple-200">
                            <h3 className="font-bold text-purple-900 mb-4">Product Tags</h3>
                            <p className="text-sm text-purple-700 mb-4">
                                Add product types (e.g., Shirts, Casual, Cotton)
                            </p>

                            {/* Tag Input */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Type tag and press Add..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <Button type="button" onClick={addTag} variant="outline">
                                    Add
                                </Button>
                            </div>

                            {/* Warning if no tags */}
                            {formData.tags.length === 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ No tags added - product won't appear in mega menu navigation
                                    </p>
                                </div>
                            )}

                            {/* Selected Tags */}
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-purple-900 transition"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-purple-600">
                                {formData.tags.length}/10 tags • Used for navigation and filtering
                            </p>
                        </div>
                    </div>

                    {/* PRICING SECTION - Best Practices Implementation */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                        <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" /> Product Pricing
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Product Price Input */}
                            <div>
                                <Input
                                    label="Product Price (₹) *"
                                    type="number"
                                    value={formData.basePrice || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 });
                                        setValidationErrors({});
                                    }}
                                    required
                                />
                                {validationErrors.price && (
                                    <p className="text-sm text-red-600 mt-1">{validationErrors.price}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    This is the base product cost (system adds ₹{SHIPPING_BUFFER} shipping buffer automatically)
                                </p>
                            </div>

                            {/* Customer Preview */}
                            <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                                <p className="text-xs text-gray-600 mb-2">Customer will see:</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{customerPrice.discounted.toFixed(0)}
                                </p>
                                {!hasDiscount && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        (₹{formData.basePrice} product + ₹{SHIPPING_BUFFER} buffer)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Discount Options */}
                        <div className="border-t border-green-200 pt-4">
                            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pricingMode === 'discount'}
                                    onChange={(e) => {
                                        setPricingMode(e.target.checked ? 'discount' : 'simple');
                                        if (!e.target.checked) {
                                            setFormData({ ...formData, discountType: 'none', discountValue: 0 });
                                        }
                                    }}
                                    className="w-4 h-4"
                                />
                                <span className="font-medium text-gray-700">Add Discount</span>
                            </label>

                            {pricingMode === 'discount' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">Discount Type</label>
                                        <select
                                            className="w-full px-4 py-2 border border-border rounded-lg"
                                            value={formData.discountType}
                                            onChange={(e) => {
                                                setFormData({ ...formData, discountType: e.target.value as any });
                                                setValidationErrors({});
                                            }}
                                        >
                                            <option value="none">No Discount</option>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="flat">Flat Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Input
                                            label={`Discount Value ${formData.discountType === 'percentage' ? '(%)' : '(₹)'}`}
                                            type="number"
                                            value={formData.discountValue || ''}
                                            onChange={(e) => {
                                                setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 });
                                                setValidationErrors({});
                                            }}
                                            disabled={formData.discountType === 'none'}
                                        />
                                        {validationErrors.discount && (
                                            <p className="text-sm text-red-600 mt-1">{validationErrors.discount}</p>
                                        )}
                                        <p className="text-xs text-blue-600 mt-1">
                                            ℹ️ Discount applies to final customer price (₹{formData.basePrice + SHIPPING_BUFFER})
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Discount Preview */}
                            {hasDiscount && (
                                <div className="mt-4 bg-white p-4 rounded-lg border-2 border-green-300">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl font-bold text-green-600">₹{customerPrice.discounted.toFixed(0)}</span>
                                        <span className="text-lg text-gray-400 line-through">₹{customerPrice.original.toFixed(0)}</span>
                                        <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                                            Save ₹{customerPrice.savings.toFixed(0)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Discount applies to full display price (₹{customerPrice.original.toFixed(0)})
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* H&M Variant Logic */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Copy className="w-4 h-4" /> Variant Linking (H&M Style)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Input
                                    label="Style Code (Link colors together)"
                                    placeholder="e.g. OX-2025"
                                    value={formData.styleCode}
                                    onChange={(e) => setFormData({ ...formData, styleCode: e.target.value })}
                                />
                                <p className="text-xs text-blue-600 mt-1">Products with the same code will show as colors.</p>
                            </div>
                            <Input
                                label="Color Name"
                                placeholder="e.g. Navy Blue"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Description *</label>
                        <textarea
                            className="w-full px-4 py-2 border border-border rounded-lg h-32"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Images *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                                    <Image src={img.url} alt="Preview" fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50">
                                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500">
                                    {uploadingImage ? 'Uploading...' : 'Add Image'}
                                </span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                        </div>
                    </div>

                    {/* Inventory & Sizes */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-text-primary">Inventory</h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAvailableSizes(['S', 'M', 'L', 'XL', 'XXL'])}
                                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                                >
                                    Reset Adults
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAvailableSizes(['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y'])}
                                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                                >
                                    Reset Kids
                                </button>
                            </div>
                        </div>

                        {/* Size Adder */}
                        <div className="flex gap-2 mb-4">
                            <Input
                                placeholder="Add custom size (e.g. 30, 6M)"
                                value={customSizeInput}
                                onChange={(e) => setCustomSizeInput(e.target.value)}
                                className="max-w-xs"
                            />
                            <Button type="button" onClick={addCustomSize} variant="outline">Add</Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
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

                    {/* Submit */}
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 border-t border-border">
                        <Button type="submit" isLoading={loading} className="w-full sm:flex-1 md:w-auto">
                            {sourceId ? 'Create Variant' : 'Create Product'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

// Main Page Component (Suspense wrapper required for useSearchParams)
export default function NewProductPageWrapper() {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <ProductForm />
        </Suspense>
    );
}