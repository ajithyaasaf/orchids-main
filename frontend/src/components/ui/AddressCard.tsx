'use client';

import React, { useState } from 'react';
import { SavedAddress } from '@tntrends/shared';
import { formatAddressOneLine, formatLastUsed, getAddressLabel } from '@/lib/addressUtils';
import { MapPin, Edit2, Trash2, Star } from 'lucide-react';

interface AddressCardProps {
    address: SavedAddress;
    onEdit: (address: SavedAddress) => void;
    onDelete: (addressId: string) => void;
    onSetDefault: (addressId: string) => void;
    loading?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
    address,
    onEdit,
    onDelete,
    onSetDefault,
    loading = false,
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState<'edit' | 'delete' | 'default' | null>(null);

    const handleDelete = async () => {
        setActionLoading('delete');
        try {
            await onDelete(address.id);
        } finally {
            setActionLoading(null);
            setShowDeleteConfirm(false);
        }
    };

    const handleSetDefault = async () => {
        if (address.isDefault) return;
        setActionLoading('default');
        try {
            await onSetDefault(address.id);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEdit = () => {
        setActionLoading('edit');
        onEdit(address);
        setActionLoading(null);
    };

    return (
        <div
            className={`relative bg-white rounded-xl shadow-soft p-6 border-2 transition-all ${address.isDefault
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:border-gray-200'
                }`}
        >
            {/* Default Badge */}
            {address.isDefault && (
                <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                </div>
            )}

            {/* Address Info */}
            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary text-lg mb-1">
                            {address.label}
                        </h3>
                        <p className="text-text-primary font-medium">{address.name}</p>
                        <p className="text-text-secondary text-sm mt-1">
                            {formatAddressOneLine(address)}
                        </p>
                        <p className="text-text-secondary text-sm mt-1">
                            Phone: {address.phone}
                        </p>
                    </div>
                </div>

                {/* Last Used */}
                {address.lastUsedAt && (
                    <p className="text-xs text-text-secondary italic">
                        {formatLastUsed(address.lastUsedAt)}
                    </p>
                )}
            </div>

            {/* Actions */}
            {!showDeleteConfirm ? (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <button
                        onClick={handleEdit}
                        disabled={loading || actionLoading !== null}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Edit</span>
                    </button>

                    {!address.isDefault && (
                        <button
                            onClick={handleSetDefault}
                            disabled={loading || actionLoading !== null}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Star className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {actionLoading === 'default' ? 'Setting...' : 'Set Default'}
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading || actionLoading !== null}
                        className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-error mb-3 font-medium">
                        Are you sure you want to delete this address?
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={actionLoading === 'delete'}
                            className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition disabled:opacity-50"
                        >
                            {actionLoading === 'delete' ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={actionLoading === 'delete'}
                            className="flex-1 px-4 py-2 bg-gray-200 text-text-primary rounded-lg hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
