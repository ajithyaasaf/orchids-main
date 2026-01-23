'use client';

import React, { useState } from 'react';
import { Address, AddressError } from '@tntrends/shared';
import { Input } from './Input';
import { Button } from './Button';
import { validateAddress } from '@/lib/addressUtils';

interface AddressFormProps {
    initialAddress?: Address;
    onSubmit: (address: Address, label: string) => Promise<void>;
    onCancel: () => void;
    mode: 'add' | 'edit';
    submitLabel?: string;
}

export const AddressForm: React.FC<AddressFormProps> = ({
    initialAddress,
    onSubmit,
    onCancel,
    mode,
    submitLabel = mode === 'add' ? 'Add Address' : 'Update Address',
}) => {
    const [formData, setFormData] = useState<Address>(
        initialAddress || {
            name: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
        }
    );
    const [label, setLabel] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof Address | 'label', string>>>({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const handleChange = (field: keyof Address, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setGeneralError('');

        // Validate label
        if (!label.trim()) {
            setErrors({ label: 'Please provide a label (e.g., Home, Office)' });
            return;
        }

        // Validate address
        const validationError = validateAddress(formData);
        if (validationError) {
            if (validationError.field) {
                setErrors({ [validationError.field]: validationError.message });
            } else {
                setGeneralError(validationError.message);
            }
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData, label);
        } catch (error: any) {
            // Handle different error types
            if (error.type === 'DUPLICATE_ADDRESS') {
                setGeneralError(error.message);
            } else if (error.type === 'MAX_ADDRESSES_REACHED') {
                setGeneralError(error.message);
            } else if (error.type === 'VALIDATION_FAILED') {
                if (error.field) {
                    setErrors({ [error.field]: error.message });
                } else {
                    setGeneralError(error.message);
                }
            } else {
                setGeneralError(error.message || 'Failed to save address. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
                <div className="p-4 bg-error/10 border border-error rounded-lg text-error text-sm">
                    {generalError}
                </div>
            )}

            {/* Address Label */}
            <Input
                label="Address Label *"
                type="text"
                placeholder="e.g., Home, Office, Mom's Place"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                error={errors.label}
                maxLength={50}
            />

            {/* Name */}
            <Input
                label="Full Name *"
                type="text"
                placeholder="Enter recipient's full name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                autoCapitalize="words"
                maxLength={100}
            />

            {/* Phone */}
            <Input
                label="Phone Number *"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    handleChange('phone', value);
                }}
                error={errors.phone}
                maxLength={10}
            />

            {/* Address Line 1 */}
            <Input
                label="Address Line 1 *"
                type="text"
                placeholder="House No, Building, Street"
                value={formData.addressLine1}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                error={errors.addressLine1}
                autoCapitalize="words"
                maxLength={200}
            />

            {/* Address Line 2 */}
            <Input
                label="Address Line 2"
                type="text"
                placeholder="Landmark, Area (Optional)"
                value={formData.addressLine2}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                error={errors.addressLine2}
                autoCapitalize="words"
                maxLength={200}
            />

            <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <Input
                    label="City *"
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    error={errors.city}
                    autoCapitalize="words"
                    maxLength={100}
                />

                {/* State */}
                <Input
                    label="State *"
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    error={errors.state}
                    autoCapitalize="words"
                    maxLength={100}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Pincode */}
                <Input
                    label="Pincode *"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit pincode"
                    value={formData.pincode}
                    onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '');
                        handleChange('pincode', value);
                    }}
                    error={errors.pincode}
                    maxLength={6}
                />

                {/* Country */}
                <Input
                    label="Country *"
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    error={errors.country}
                    disabled
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                >
                    {loading ? 'Saving...' : submitLabel}
                </Button>
                <Button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    variant="secondary"
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
};
