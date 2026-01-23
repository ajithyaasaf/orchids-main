'use client';

import React, { useState } from 'react';
import { SavedAddress, Address } from '@tntrends/shared';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/context/ToastContext';
import { AddressCard } from './AddressCard';
import { AddressForm } from './AddressForm';
import { Plus, MapPin, Download } from 'lucide-react';
import { Button } from './Button';

export const AddressManager: React.FC = () => {
    const { user, addAddress, updateAddress, deleteAddress, setDefaultAddress, exportUserData } =
        useAuthStore();
    const { showToast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
    const [loading, setLoading] = useState(false);

    if (!user) {
        return null;
    }

    const handleAddAddress = async (address: Address, label: string) => {
        setLoading(true);
        try {
            await addAddress(address, label);
            setShowForm(false);
            showToast('Address added successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to add address', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAddress = async (address: Address, label: string) => {
        if (!editingAddress) return;
        setLoading(true);
        try {
            await updateAddress(editingAddress.id, address, label);
            setEditingAddress(null);
            showToast('Address updated successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to update address', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (address: SavedAddress) => {
        setEditingAddress(address);
        setShowForm(false);
    };

    const handleDelete = async (addressId: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        setLoading(true);
        try {
            await deleteAddress(addressId);
            showToast('Address deleted successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to delete address', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (addressId: string) => {
        setLoading(true);
        try {
            await setDefaultAddress(addressId);
            showToast('Default address updated', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to set default address', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingAddress(null);
    };

    const handleExportData = () => {
        try {
            exportUserData();
            showToast('Data exported successfully', 'success');
        } catch (error: any) {
            showToast(error.message || 'Failed to export data', 'error');
        }
    };

    // Sort addresses: default first, then by lastUsedAt
    const sortedAddresses = [...user.addresses].sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        if (a.lastUsedAt && b.lastUsedAt) {
            return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
        }
        if (a.lastUsedAt) return -1;
        if (b.lastUsedAt) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">My Addresses</h2>
                    <p className="text-text-secondary text-sm mt-1">
                        Manage your saved shipping addresses ({user.addresses.length}/10)
                    </p>
                </div>
                <Button
                    onClick={handleExportData}
                    variant="secondary"
                    className="flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Export Data
                </Button>
            </div>

            {/* Add/Edit Form */}
            {(showForm || editingAddress) && (
                <div className="bg-white rounded-xl shadow-soft p-6">
                    <h3 className="text-xl font-bold text-text-primary mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <AddressForm
                        initialAddress={editingAddress || undefined}
                        onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress}
                        onCancel={handleCancel}
                        mode={editingAddress ? 'edit' : 'add'}
                    />
                </div>
            )}

            {/* Add Address Button */}
            {!showForm && !editingAddress && user.addresses.length < 10 && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-primary hover:bg-primary/5 transition flex flex-col items-center justify-center gap-3 group"
                >
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition">
                        <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-text-primary">Add New Address</p>
                        <p className="text-sm text-text-secondary mt-1">
                            Save time on your next order
                        </p>
                    </div>
                </button>
            )}

            {/* Address List */}
            {user.addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedAddresses.map((address) => (
                        <AddressCard
                            key={address.id}
                            address={address}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSetDefault={handleSetDefault}
                            loading={loading}
                        />
                    ))}
                </div>
            ) : (
                !showForm &&
                !editingAddress && (
                    <div className="bg-white rounded-xl shadow-soft p-12 text-center">
                        <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-text-primary mb-2">
                            No addresses saved yet
                        </h3>
                        <p className="text-text-secondary mb-6">
                            Add your first address to speed up checkout!
                        </p>
                        <Button onClick={() => setShowForm(true)}>Add Your First Address</Button>
                    </div>
                )
            )}

            {/* Max Addresses Warning */}
            {user.addresses.length >= 10 && !editingAddress && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                    <strong>Maximum addresses reached.</strong> You've saved the maximum of 10
                    addresses. Please delete an address to add a new one.
                </div>
            )}
        </div>
    );
};
