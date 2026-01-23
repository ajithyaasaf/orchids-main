'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collectionApi, uploadApi } from '@/lib/api';
import { Collection, CollectionSelectionType, CollectionTheme, CollectionStatus } from '@tntrends/shared';
import { Button } from '@/components/ui/Button';
import { Upload, X, Loader2, Save, ArrowLeft } from 'lucide-react';
import { ProductPicker } from '@/components/admin/ProductPicker';
import { AutoRulesBuilder } from '@/components/admin/AutoRulesBuilder';

interface CollectionFormProps {
    /**
     * Existing collection for edit mode, undefined for create mode
     */
    existingCollection?: Collection;
    /**
     * Form mode
     */
    mode: 'create' | 'edit';
}

/**
 * Reusable Collection Form Component
 * Used for both creating new collections and editing existing ones
 * 
 * Features:
 * - Form validation
 * - Image upload with preview
 * - Product selection (manual/automatic/hybrid)
 * - Auto-rules builder
 * - SEO fields
 * - Status management
 */
export const CollectionForm: React.FC<CollectionFormProps> = ({ existingCollection, mode }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<Collection>>({
        name: existingCollection?.name || '',
        slug: existingCollection?.slug || '',
        tagline: existingCollection?.tagline || '',
        description: existingCollection?.description || '',
        selectionType: existingCollection?.selectionType || 'manual',
        productIds: existingCollection?.productIds || [],
        autoRules: existingCollection?.autoRules || {},
        status: existingCollection?.status || 'draft',
        startDate: existingCollection?.startDate || new Date() as any,
        endDate: existingCollection?.endDate || undefined,
        timezone: existingCollection?.timezone || 'Asia/Kolkata',
        bannerImage: existingCollection?.bannerImage,
        thumbnailImage: existingCollection?.thumbnailImage,
        displaySettings: {
            showOnHomepage: existingCollection?.displaySettings?.showOnHomepage ?? true,
            homepageOrder: existingCollection?.displaySettings?.homepageOrder || 1,
            showCountdown: existingCollection?.displaySettings?.showCountdown ?? false,
            customCTA: existingCollection?.displaySettings?.customCTA || 'Shop Now',
            theme: existingCollection?.displaySettings?.theme || 'default',
        },
        seo: {
            metaTitle: existingCollection?.seo?.metaTitle || '',
            metaDescription: existingCollection?.seo?.metaDescription || '',
            keywords: existingCollection?.seo?.keywords || [],
            ogImage: existingCollection?.seo?.ogImage || '',
        },
        associatedCoupon: existingCollection?.associatedCoupon || '',
        associatedCombo: existingCollection?.associatedCombo || '',
    });

    // Auto-generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            // Only auto-generate slug in create mode or if slug is empty
            slug: mode === 'create' || !prev.slug ? generateSlug(name) : prev.slug
        }));
    };

    const handleImageUpload = async (file: File, type: 'banner' | 'thumbnail') => {
        try {
            const setUploading = type === 'banner' ? setUploadingBanner : setUploadingThumbnail;
            setUploading(true);

            const formData = new FormData();
            formData.append('image', file);

            const { url, publicId } = await uploadApi.uploadImage(formData);

            setFormData(prev => ({
                ...prev,
                [type === 'banner' ? 'bannerImage' : 'thumbnailImage']: {
                    url,
                    publicId,
                    alt: prev.name || 'Collection image'
                }
            }));
        } catch (error: any) {
            alert(`Failed to upload ${type}: ` + error.message);
        } finally {
            const setUploading = type === 'banner' ? setUploadingBanner : setUploadingThumbnail;
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.slug) {
            alert('Name and slug are required');
            return;
        }

        if (formData.selectionType === 'manual' && (!formData.productIds || formData.productIds.length === 0)) {
            alert('Please select at least one product for manual selection');
            return;
        }

        if (formData.selectionType === 'automatic' && !formData.autoRules) {
            alert('Please configure auto-selection rules');
            return;
        }

        try {
            setLoading(true);

            if (mode === 'create') {
                const { data } = await collectionApi.create(formData);
                alert('Collection created successfully!');
                router.push(`/admin/collections/${data.id}`);
            } else {
                await collectionApi.update(existingCollection!.id, formData);
                alert('Collection updated successfully!');
                router.push('/admin/collections');
            }
        } catch (error: any) {
            alert(`Failed to ${mode} collection: ` + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    type="button"
                    onClick={() => router.push('/admin/collections')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Collections
                </button>
                <h1 className="text-3xl font-bold text-gray-900">
                    {mode === 'create' ? 'Create Collection' : 'Edit Collection'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {mode === 'create'
                        ? 'Create a new collection to showcase products'
                        : 'Update collection details and settings'}
                </p>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Collection Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Winter Sale 2024"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL Slug *
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">/collection/</span>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="winter-sale-2024"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            URL-friendly identifier (lowercase, hyphens only)
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tagline
                        </label>
                        <input
                            type="text"
                            value={formData.tagline}
                            onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                            placeholder="Up to 70% OFF on Winter Essentials"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your collection..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Banner Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Banner Image
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Recommended: 1920x500px
                        </p>

                        {formData.bannerImage ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={formData.bannerImage.url}
                                    alt="Banner"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, bannerImage: undefined }))}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
                                    className="hidden"
                                    disabled={uploadingBanner}
                                />
                                {uploadingBanner ? (
                                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">Upload Banner</span>
                                    </>
                                )}
                            </label>
                        )}
                    </div>

                    {/* Thumbnail Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thumbnail Image
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Recommended: 600x800px
                        </p>

                        {formData.thumbnailImage ? (
                            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={formData.thumbnailImage.url}
                                    alt="Thumbnail"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, thumbnailImage: undefined }))}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'thumbnail')}
                                    className="hidden"
                                    disabled={uploadingThumbnail}
                                />
                                {uploadingThumbnail ? (
                                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">Upload Thumbnail</span>
                                    </>
                                )}
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Selection</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Selection Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['manual', 'automatic', 'hybrid'] as CollectionSelectionType[]).map(type => (
                            <label
                                key={type}
                                className={`relative flex items-center p-4 cursor-pointer border-2 rounded-lg transition-all ${formData.selectionType === type
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="selectionType"
                                    value={type}
                                    checked={formData.selectionType === type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, selectionType: e.target.value as CollectionSelectionType }))}
                                    className="mr-3"
                                />
                                <div>
                                    <div className="font-medium text-gray-900 capitalize">{type}</div>
                                    <div className="text-xs text-gray-600">
                                        {type === 'manual' && 'Pick products manually'}
                                        {type === 'automatic' && 'Rule-based selection'}
                                        {type === 'hybrid' && 'Manual + automatic'}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Manual/Hybrid Product Picker */}
                {(formData.selectionType === 'manual' || formData.selectionType === 'hybrid') && (
                    <ProductPicker
                        selectedProductIds={formData.productIds || []}
                        onProductsChange={(productIds) => setFormData(prev => ({ ...prev, productIds }))}
                    />
                )}

                {/* Automatic/Hybrid Rules Builder */}
                {(formData.selectionType === 'automatic' || formData.selectionType === 'hybrid') && (
                    <AutoRulesBuilder
                        rules={formData.autoRules || {}}
                        onRulesChange={(autoRules) => setFormData(prev => ({ ...prev, autoRules }))}
                    />
                )}
            </div>

            {/* Schedule & Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule & Status</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status *
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CollectionStatus }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="draft">Draft</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                        </label>
                        <select
                            value={formData.timezone}
                            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date *
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) as any }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date (Optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                endDate: e.target.value ? new Date(e.target.value) as any : undefined
                            }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty for permanent collection
                        </p>
                    </div>
                </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Display Settings</h2>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showOnHomepage"
                            checked={formData.displaySettings?.showOnHomepage}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                displaySettings: { ...prev.displaySettings!, showOnHomepage: e.target.checked }
                            }))}
                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="showOnHomepage" className="text-sm font-medium text-gray-700">
                            Show on Homepage
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="showCountdown"
                            checked={formData.displaySettings?.showCountdown}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                displaySettings: { ...prev.displaySettings!, showCountdown: e.target.checked }
                            }))}
                            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label htmlFor="showCountdown" className="text-sm font-medium text-gray-700">
                            Show Countdown Timer
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Theme
                            </label>
                            <select
                                value={formData.displaySettings?.theme}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    displaySettings: { ...prev.displaySettings!, theme: e.target.value as CollectionTheme }
                                }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="default">Default</option>
                                <option value="winter">Winter ❄️</option>
                                <option value="summer">Summer ☀️</option>
                                <option value="flash">Flash Sale ⚡</option>
                                <option value="clearance">Clearance 🔖</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom CTA Text
                            </label>
                            <input
                                type="text"
                                value={formData.displaySettings?.customCTA}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    displaySettings: { ...prev.displaySettings!, customCTA: e.target.value }
                                }))}
                                placeholder="Shop Now"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {formData.displaySettings?.showOnHomepage && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Homepage Order
                                </label>
                                <input
                                    type="number"
                                    value={formData.displaySettings?.homepageOrder}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        displaySettings: { ...prev.displaySettings!, homepageOrder: parseInt(e.target.value) }
                                    }))}
                                    min="1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Lower numbers appear first
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO Settings</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta Title
                        </label>
                        <input
                            type="text"
                            value={formData.seo?.metaTitle}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                seo: { ...prev.seo!, metaTitle: e.target.value }
                            }))}
                            placeholder="Winter Sale 2024 - Up to 70% OFF | TNtrends"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty to auto-generate from collection name
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meta Description
                        </label>
                        <textarea
                            value={formData.seo?.metaDescription}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                seo: { ...prev.seo!, metaDescription: e.target.value }
                            }))}
                            placeholder="Discover our winter collection with amazing discounts..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Keywords (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={formData.seo?.keywords?.join(', ')}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                seo: {
                                    ...prev.seo!,
                                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                }
                            }))}
                            placeholder="winter sale, clothing, fashion"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            OG Image URL
                        </label>
                        <input
                            type="url"
                            value={formData.seo?.ogImage}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                seo: { ...prev.seo!, ogImage: e.target.value }
                            }))}
                            placeholder="https://example.com/og-image.jpg"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            For social sharing. Leave empty to use banner image
                        </p>
                    </div>
                </div>
            </div>

            {/* Integration */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Associated Coupon Code
                        </label>
                        <input
                            type="text"
                            value={formData.associatedCoupon}
                            onChange={(e) => setFormData(prev => ({ ...prev, associatedCoupon: e.target.value }))}
                            placeholder="WINTER50"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Display coupon banner on collection page
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Associated Combo ID
                        </label>
                        <input
                            type="text"
                            value={formData.associatedCombo}
                            onChange={(e) => setFormData(prev => ({ ...prev, associatedCombo: e.target.value }))}
                            placeholder="combo-id-123"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Link to a bundle/combo deal
                        </p>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/collections')}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            {mode === 'create' ? 'Create Collection' : 'Update Collection'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};
