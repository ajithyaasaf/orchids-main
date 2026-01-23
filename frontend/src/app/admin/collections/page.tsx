'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collectionApi } from '@/lib/api';
import { Collection } from '@tntrends/shared';
import { Button } from '@/components/ui/Button';
import { Plus, Eye, Edit, Trash2, Globe, Calendar, Sparkles } from 'lucide-react';

/**
 * Admin Collections Management Page
 * Displays all collections with filtering and CRUD operations
 */
export default function AdminCollectionsPage() {
    const router = useRouter();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

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
            alert('Failed to load collections: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Archive collection "${name}"? This will hide it from customers but keep the data.`)) {
            return;
        }

        try {
            await collectionApi.delete(id);
            await loadCollections();
        } catch (error: any) {
            alert('Failed to archive collection: ' + error.message);
        }
    };

    const getStatusBadge = (status: Collection['status']) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            draft: 'bg-gray-100 text-gray-800',
            scheduled: 'bg-blue-100 text-blue-800',
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
                    <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
                    <p className="text-gray-600 mt-1">
                        Manage product collections and campaigns
                    </p>
                </div>
                <Link href="/admin/collections/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Collection
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {(['all', 'active', 'draft', 'archived'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading collections...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredCollections.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {filter === 'all' ? 'No Collections Yet' : `No ${filter} Collections`}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {filter === 'all'
                            ? 'Create your first collection to showcase products'
                            : `No collections with status "${filter}"`}
                    </p>
                    {filter === 'all' && (
                        <Link href="/admin/collections/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Collection
                            </Button>
                        </Link>
                    )}
                </div>
            )}

            {/* Collections Grid */}
            {!loading && filteredCollections.length > 0 && (
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
                                            {collection.selectionType}
                                        </div>
                                        <div>
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
        </div>
    );
}
