'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collectionApi } from '@/lib/api';
import { Collection } from '@tntrends/shared';
import { CollectionForm } from '@/components/admin/CollectionForm';
import { Loader2 } from 'lucide-react';

/**
 * Admin page: Edit existing collection
 */
export default function EditCollectionPage() {
    const params = useParams();
    const collectionId = params.id as string;

    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCollection();
    }, [collectionId]);

    const loadCollection = async () => {
        try {
            setLoading(true);
            const { data } = await collectionApi.getById(collectionId);
            setCollection(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load collection');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading collection...</p>
                </div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Collection not found'}</p>
                    <a href="/admin/collections" className="text-primary hover:underline">
                        ← Back to Collections
                    </a>
                </div>
            </div>
        );
    }

    return <CollectionForm mode="edit" existingCollection={collection} />;
}
