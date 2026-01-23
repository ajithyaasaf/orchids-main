'use client';

import React, { useState, useEffect } from 'react';
import { SavedAddress, Address } from '@tntrends/shared';
import { useAuthStore } from '@/store/authStore';
import { MapPin, Plus, Check } from 'lucide-react';
import { formatAddressOneLine } from '@/lib/addressUtils';

interface AddressSelectorProps {
    onAddressSelect: (address: Address, addressId?: string) => void;
    selectedAddressId?: string | null;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
    onAddressSelect,
    selectedAddressId,
}) => {
    const { user } = useAuthStore();
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-select default address on mount
    useEffect(() => {
        if (user && user.addresses.length > 0 && !selectedAddressId) {
            const defaultAddress = user.addresses.find((a) => a.isDefault);
            if (defaultAddress) {
                onAddressSelect(defaultAddress, defaultAddress.id);
            }
        }
    }, [user, selectedAddressId]);

    if (!user || user.addresses.length === 0) {
        return null; // Show manual entry form only
    }

    const selectedAddress = selectedAddressId
        ? user.addresses.find((a) => a.id === selectedAddressId)
        : null;

    return (
        <div className="space-y-4">
            {/* Selected Address Display */}
            {selectedAddress && !isExpanded && (
                <div className="bg-primary/5 border-2 border-primary rounded-xl p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-text-primary">
                                        {selectedAddress.label}
                                    </h3>
                                    {selectedAddress.isDefault && (
                                        <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-text-primary font-medium">
                                    {selectedAddress.name}
                                </p>
                                <p className="text-text-secondary text-sm mt-1">
                                    {formatAddressOneLine(selectedAddress)}
                                </p>
                                <p className="text-text-secondary text-sm">
                                    Phone: {selectedAddress.phone}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-primary text-sm font-medium hover:underline ml-4"
                        >
                            Change
                        </button>
                    </div>
                </div>
            )}

            {/* Address List (Expanded) */}
            {(isExpanded || !selectedAddress) && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-text-primary">
                            Select Delivery Address
                        </h3>
                        {selectedAddress && (
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-text-secondary text-sm hover:text-text-primary"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                        {user.addresses.map((address) => (
                            <button
                                key={address.id}
                                onClick={() => {
                                    onAddressSelect(address, address.id);
                                    setIsExpanded(false);
                                }}
                                className={`text-left p-4 rounded-xl border-2 transition hover:border-primary/50 ${selectedAddressId === address.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-text-primary">
                                                {address.label}
                                            </h4>
                                            {address.isDefault && (
                                                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-text-primary font-medium text-sm">
                                            {address.name}
                                        </p>
                                        <p className="text-text-secondary text-sm mt-1">
                                            {formatAddressOneLine(address)}
                                        </p>
                                    </div>
                                    {selectedAddressId === address.id && (
                                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        ))}

                        {/* Add New Address Option */}
                        <button
                            onClick={() => {
                                onAddressSelect({
                                    name: '',
                                    phone: '',
                                    addressLine1: '',
                                    addressLine2: '',
                                    city: '',
                                    state: '',
                                    pincode: '',
                                    country: 'India',
                                }, undefined);
                                setIsExpanded(false);
                            }}
                            className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 transition flex items-center justify-center gap-2 text-primary font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New Address</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
