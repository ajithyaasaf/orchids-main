'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { couponApi } from '@/lib/api';
import { Coupon } from '@tntrends/shared';
import { Plus, Edit2, Trash2, Tag, Calendar, Users, TrendingUp, X } from 'lucide-react';

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'flat' as 'flat' | 'percentage',
        value: 0,
        minOrder: 0,
        maxDiscount: 0,
        appliesTo: 'all' as 'all' | 'firstOrder' | 'category',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        usageLimit: 1000,
        perUserLimit: 1,
        active: true,
    });

    // Load coupons on mount
    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const response = await couponApi.getAll();
            if (response.success) {
                setCoupons(response.data);
            }
        } catch (error) {
            console.error('Failed to load coupons:', error);
            setError('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Validate
            if (!formData.code.trim()) {
                setError('Coupon code is required');
                return;
            }

            if (formData.value <= 0) {
                setError('Discount value must be greater than 0');
                return;
            }

            if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
                setError('End date must be after start date');
                return;
            }

            const payload = {
                ...formData,
                code: formData.code.toUpperCase().trim(),
                minOrder: formData.minOrder || undefined,
                maxDiscount: formData.type === 'percentage' ? formData.maxDiscount || undefined : undefined,
            };

            if (editingCoupon) {
                // Update existing
                await couponApi.update(editingCoupon.id, payload);
            } else {
                // Create new
                await couponApi.create(payload);
            }

            // Reset and reload
            resetForm();
            fetchCoupons();
            setShowForm(false);
        } catch (error: any) {
            setError(error.message || 'Failed to save coupon');
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description || '',
            type: coupon.type,
            value: coupon.value,
            minOrder: coupon.minOrder || 0,
            maxDiscount: coupon.maxDiscount || 0,
            appliesTo: coupon.appliesTo,
            validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
            validUntil: new Date(coupon.validUntil).toISOString().split('T')[0],
            usageLimit: coupon.usageLimit || 1000,
            perUserLimit: coupon.perUserLimit,
            active: coupon.active,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this coupon?')) return;

        try {
            await couponApi.delete(id);
            fetchCoupons();
        } catch (error) {
            setError('Failed to delete coupon');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            type: 'flat',
            value: 0,
            minOrder: 0,
            maxDiscount: 0,
            appliesTo: 'all',
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            usageLimit: 1000,
            perUserLimit: 1,
            active: true,
        });
        setEditingCoupon(null);
        setError('');
    };

    const setPresetDate = (years: number) => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + years);
        setFormData(prev => ({ ...prev, validUntil: futureDate.toISOString().split('T')[0] }));
    };

    const getCouponStatus = (coupon: Coupon) => {
        if (!coupon.active) return { label: 'Inactive', color: 'bg-gray-500' };

        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (now < validFrom) return { label: 'Scheduled', color: 'bg-blue-500' };
        if (now > validUntil) return { label: 'Expired', color: 'bg-red-500' };
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { label: 'Used Up', color: 'bg-orange-500' };

        return { label: 'Active', color: 'bg-green-500' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading coupons...</div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Coupon Management</h1>
                    <p className="text-text-secondary mt-1">Create and manage discount codes</p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Coupon
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Coupon Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-text-primary">
                                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Basic Information</h3>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Coupon Code *
                                    </label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        placeholder="e.g., TNFIRST50"
                                        required
                                        maxLength={20}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Will be auto-converted to uppercase</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Description (Internal Note)
                                    </label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="e.g., First-time customer discount"
                                    />
                                </div>
                            </div>

                            {/* Discount Configuration */}
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="font-semibold text-lg">Discount Settings</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Discount Type *</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                        >
                                            <option value="flat">Flat Amount (₹)</option>
                                            <option value="percentage">Percentage (%)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {formData.type === 'flat' ? 'Amount (₹)' : 'Percentage (%)'} *
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.value}
                                            onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Minimum Order (₹)
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.minOrder}
                                            onChange={(e) => setFormData(prev => ({ ...prev, minOrder: Number(e.target.value) }))}
                                            min="0"
                                            placeholder="0 = No minimum"
                                        />
                                    </div>

                                    {formData.type === 'percentage' && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Max Discount Cap (₹)
                                            </label>
                                            <Input
                                                type="number"
                                                value={formData.maxDiscount}
                                                onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: Number(e.target.value) }))}
                                                min="0"
                                                placeholder="0 = No cap"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Applicability */}
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="font-semibold text-lg">Applicability</h3>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Applies To *</label>
                                    <select
                                        value={formData.appliesTo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, appliesTo: e.target.value as any }))}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                                    >
                                        <option value="all">All Customers (Campaigns, Newsletters)</option>
                                        <option value="firstOrder">First-Time Customers Only</option>
                                        <option value="category">Specific Category (Coming Soon)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Validity Period */}
                            <div className="space-y-4 border-t pt-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg">Validity Period</h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPresetDate(1)}
                                            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                                        >
                                            1 Year
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPresetDate(5)}
                                            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                                        >
                                            5 Years
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPresetDate(10)}
                                            className="text-xs px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded transition"
                                        >
                                            Permanent (10Y)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Valid From *</label>
                                        <Input
                                            type="date"
                                            value={formData.validFrom}
                                            onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Valid Until *</label>
                                        <Input
                                            type="date"
                                            value={formData.validUntil}
                                            onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Usage Limits */}
                            <div className="space-y-4 border-t pt-6">
                                <h3 className="font-semibold text-lg">Usage Limits</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Total Usage Limit
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.usageLimit}
                                            onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                                            min="1"
                                            placeholder="e.g., 1000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Per User Limit
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.perUserLimit}
                                            onChange={(e) => setFormData(prev => ({ ...prev, perUserLimit: Number(e.target.value) }))}
                                            min="1"
                                            placeholder="Usually 1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-4 border-t pt-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                        className="w-4 h-4"
                                    />
                                    <span className="font-medium">Active (Coupon is live and usable)</span>
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-4 pt-6">
                                <Button type="submit" className="flex-1">
                                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Coupons List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {coupons.length === 0 ? (
                    <div className="text-center py-12">
                        <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Coupons Yet</h3>
                        <p className="text-gray-500 mb-6">Create your first coupon to get started</p>
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="w-5 h-5 mr-2" />
                            Create Coupon
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Applies To
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Validity
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {coupons.map((coupon) => {
                                    const status = getCouponStatus(coupon);
                                    return (
                                        <tr key={coupon.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Tag className="w-5 h-5 text-primary mr-2" />
                                                    <div>
                                                        <div className="font-semibold text-text-primary">{coupon.code}</div>
                                                        {coupon.description && (
                                                            <div className="text-xs text-gray-500">{coupon.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium">
                                                    {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                                                </div>
                                                {coupon.minOrder && coupon.minOrder > 0 && (
                                                    <div className="text-xs text-gray-500">Min: ₹{coupon.minOrder}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${coupon.appliesTo === 'firstOrder'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {coupon.appliesTo === 'firstOrder' ? 'First Order' : 'All Customers'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center text-gray-600">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {new Date(coupon.validUntil).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm">
                                                    <Users className="w-4 h-4 mr-1 text-gray-500" />
                                                    <span className="font-medium">{coupon.usedCount}</span>
                                                    {coupon.usageLimit && (
                                                        <span className="text-gray-500">/{coupon.usageLimit}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color} text-white`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleEdit(coupon)}
                                                    className="text-primary hover:text-primary-dark mr-4 transition"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="text-red-600 hover:text-red-800 transition"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            {coupons.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Coupons</p>
                                <p className="text-2xl font-bold text-text-primary mt-1">{coupons.length}</p>
                            </div>
                            <Tag className="w-10 h-10 text-primary" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {coupons.filter(c => getCouponStatus(c).label === 'Active').length}
                                </p>
                            </div>
                            <TrendingUp className="w-10 h-10 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Uses</p>
                                <p className="text-2xl font-bold text-text-primary mt-1">
                                    {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                                </p>
                            </div>
                            <Users className="w-10 h-10 text-primary" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">First-Order Only</p>
                                <p className="text-2xl font-bold text-purple-600 mt-1">
                                    {coupons.filter(c => c.appliesTo === 'firstOrder').length}
                                </p>
                            </div>
                            <Calendar className="w-10 h-10 text-purple-600" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
