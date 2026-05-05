import React from 'react';

/**
 * Collection Page Loading Skeleton
 * Provides immediate visual feedback when navigating to a collection.
 * Matches the layout of CollectionPageClient.tsx
 */
export default function CollectionLoading() {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            {/* Hero Banner Skeleton */}
            <section className="relative h-[300px] md:h-[400px] bg-gray-200">
                <div className="container-custom h-full flex flex-col justify-center">
                    <div className="max-w-4xl space-y-4">
                        {/* Badge Skeleton */}
                        <div className="w-32 h-6 bg-gray-300 rounded-full" />
                        {/* Title Skeleton */}
                        <div className="w-2/3 h-12 md:h-16 bg-gray-300 rounded-lg" />
                        {/* Tagline Skeleton */}
                        <div className="w-1/2 h-6 bg-gray-300 rounded-lg" />
                        {/* Description Skeleton */}
                        <div className="w-3/4 h-4 bg-gray-300 rounded-lg" />
                    </div>
                </div>
            </section>

            {/* Products Grid Skeleton */}
            <section className="section py-12">
                <div className="container-custom">
                    {/* Toolbar Skeleton */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                        <div className="space-y-2">
                            <div className="w-40 h-6 bg-gray-200 rounded" />
                            <div className="w-24 h-4 bg-gray-200 rounded" />
                        </div>
                    </div>

                    {/* Grid of 8 skeletons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-soft">
                                <div className="aspect-[3/4] bg-gray-200" />
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <div className="w-20 h-3 bg-gray-200 rounded" />
                                        <div className="w-16 h-3 bg-gray-200 rounded" />
                                    </div>
                                    <div className="w-full h-4 bg-gray-200 rounded" />
                                    <div className="pt-4 border-t border-gray-100 flex justify-between">
                                        <div className="w-24 h-6 bg-gray-200 rounded" />
                                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
