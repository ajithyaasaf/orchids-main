import React from 'react';
import { Search } from 'lucide-react';

/**
 * Search Page Loading Skeleton
 * Matches the layout of SearchPageClient.tsx
 */
export default function SearchLoading() {
    return (
        <div className="container-custom section animate-pulse">
            <h1 className="text-3xl font-bold text-gray-200 mb-8">Search Products</h1>

            {/* Search Bar Skeleton */}
            <div className="bg-white rounded-xl shadow-soft p-6 mb-8 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 h-12 bg-gray-100 rounded-lg" />
                    <div className="w-full md:w-48 h-12 bg-gray-100 rounded-lg" />
                </div>
            </div>

            {/* Results Count Skeleton */}
            <div className="mb-6 w-48 h-6 bg-gray-200 rounded" />

            {/* Products Grid Skeleton (8 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-soft border border-gray-100">
                        <div className="aspect-[3/4] bg-gray-100" />
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <div className="w-16 h-3 bg-gray-100 rounded" />
                                <div className="w-12 h-3 bg-gray-100 rounded" />
                            </div>
                            <div className="w-full h-4 bg-gray-100 rounded" />
                            <div className="pt-4 border-t border-gray-50 flex justify-between">
                                <div className="w-20 h-5 bg-gray-100 rounded" />
                                <div className="w-8 h-8 bg-gray-100 rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
