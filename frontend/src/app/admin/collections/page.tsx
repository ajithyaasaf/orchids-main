'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collectionApi } from '@/lib/api';
import { Collection } from '@orchids/shared';
import { Button } from '@/components/ui/Button';
import { Plus, Eye, Edit, Trash2, Globe, Calendar, Sparkles } from 'lucide-react';

import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';

/**
 * Admin Collections Management Page
 * Displays all collections with filtering and CRUD operations
 */
export default function AdminCollectionsPage() {
    const router = useRouter();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
    const { showToast } = useToast();

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        try {
            setLoading(true);
            const { data } = await collectionApi.getAllAdmin();
            setCollections(data);
        } catch (error: any) {
            console.error('Failed to load collections:', error);
            showToast('Failed to load collections: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Archive Collection',
            message: `Archive collection "${name}"? This will hide it from customers but keep the data.`,
            type: 'warning',
            confirmText: 'Archive',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await collectionApi.delete(id);
                    showToast('Collection archived successfully', 'success');
                    await loadCollections();
                } catch (error: any) {
                    showToast('Failed to archive collection: ' + error.message, 'error');
                }
            }
        });
    };

    const getStatusBadge = (status: Collection['status']) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            draft: 'bg-gray-100 text-gray-800',
            scheduled: 'bg-primary/10 text-primary',
            expired: 'bg-orange-100 text-orange-800',
            archived: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const filteredCollections = collections.filter(c => {
        if (filter === 'all') return true;
        return c.status === filter;
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Collections</h1>
                    <p className="text-gray-600 mt-1">
                        Manage product collections and campaigns
                    </p>
                </div>
                <Link href="/admin/collections/new">
                    <Button className="rounded-full shadow-sm shadow-primary/20 hover:shadow-md">
                        <Plus className="w-4 h-4 mr-2" />
                        New Collection
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {(['all', 'active', 'draft', 'archived'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === status
                            ? 'bg-primary text-white shadow-sm shadow-primary/20'
                            : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== 'all' && (
                            <span className="ml-2 text-xs opacity-75">
                                ({collections.filter(c => c.status === status).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-50 shadow-sm flex items-center gap-6">
                            <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-3">
                                <Skeleton className="w-1/3 h-6" />
                                <Skeleton className="w-1/2 h-4" />
                                <Skeleton className="w-20 h-4 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCollections.length === 0 ? (
                /* Empty State */
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {filter === 'all' ? 'No Collections Yet' : `No ${filter} Collections`}
                    </h3>
                    <p className="text-gray-600">
                        {filter === 'all'
                            ? 'Click "New Collection" above to create your first collection'
                            : `No collections with status "${filter}"`}
                    </p>
                </div>
            ) : (
                /* Collections Grid */
                <div className="grid grid-cols-1 gap-4">
                    {filteredCollections.map(collection => (
                        <div
                            key={collection.id}
                            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary/50 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start gap-6">
                                {/* Thumbnail */}
                                {collection.thumbnailImage && (
                                    <div className="flex-shrink-0">
                                        <img
                                            src={collection.thumbnailImage.url}
                                            alt={collection.name}
                                            className="w-24 h-24 rounded-lg object-cover"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                {collection.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mb-2">
                                                /{collection.slug}
                                            </p>
                                        </div>
                                        {getStatusBadge(collection.status)}
                                    </div>

                                    {collection.tagline && (
                                        <p className="text-sm text-gray-700 mb-3">
                                            {collection.tagline}
                                        </p>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {collection.displaySettings.showOnHomepage ? 'On Homepage' : 'Hidden'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(collection.startDate).toLocaleDateString()}
                                            {collection.endDate && ` - ${new Date(collection.endDate).toLocaleDateString()}`}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            {collection.productIds?.length || 0} products
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Link
                                        href={`/collection/${collection.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button variant="ghost" size="sm" title="Preview">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Link href={`/admin/collections/${collection.id}`}>
                                        <Button variant="ghost" size="sm" title="Edit">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(collection.id, collection.name)}
                                        title="Archive"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <ConfirmModal
                {...confirmModal}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
