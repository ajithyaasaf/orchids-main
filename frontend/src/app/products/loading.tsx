import React from 'react';
import { Breadcrumbs } from '@/components/seo/StructuredData';

/**
 * Modern 2026 Product Grid Skeleton
 * Provides instant visual feedback while data streams in
 */
export default function ProductsLoading() {
    // Generate 8 skeleton cards for the initial view
    const skeletonCards = Array.from({ length: 8 });

    return (
        <main className="min-h-screen bg-white">
            {/* Breadcrumbs Placeholder */}
            <div className="border-b border-gray-100 bg-gray-50/50">
                <div className="container-custom py-4">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            <div className="container-custom py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Skeleton */}
                    <div className="hidden lg:block w-64 space-y-6">
                        <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-4 w-full bg-gray-50 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="flex-1">
                        {/* Header Skeleton */}
                        <div className="mb-8">
                            <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                        </div>

                        {/* Product Grid Skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {skeletonCards.map((_, index) => (
                                <div key={index} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                    {/* Image Area */}
                                    <div className="aspect-[4/5] bg-gray-200 animate-pulse relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-4 space-y-3">
                                        <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                                        <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
                                        <div className="pt-4 flex justify-between">
                                            <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
                                            <div className="h-8 w-8 bg-gray-100 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
