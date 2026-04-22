'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WholesaleProduct } from '@orchids/shared';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { getCloudinaryUrl, PRODUCT_CARD_IMG_OPTS } from '@/lib/cloudinaryImage';
import { useRecentlyViewedStore } from '@/store/recentlyViewedStore';
import { Loader2, History, XCircle } from 'lucide-react';
import { useHasMounted } from '@/hooks/useHasMounted';

interface RecentlyViewedProductsProps {
    currentProductId: string;
}

/**
 * Recently Viewed Products Component
 * Displays the user's browsing history with real-time price & stock checks.
 * 
 * Features:
 * - Persisted state (from store)
 * - Automatic filtering of current product
 * - Privacy control (Clear History)
 * - Dynamic loading states
 */
export const RecentlyViewedProducts: React.FC<RecentlyViewedProductsProps> = ({ currentProductId }) => {
    const { productIds, clearHistory } = useRecentlyViewedStore();
    const [products, setProducts] = useState<WholesaleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const hasMounted = useHasMounted();

    useEffect(() => {
        const fetchRecentProducts = async () => {
            // Only show history if we have at least 1 other product
            const filteredIds = productIds.filter(id => id !== currentProductId);
            
            if (filteredIds.length === 0) {
                setLoading(false);
                return;
            }

            try {
                // Fetch each product individually since we have the specific IDs
                // Using Promise.all for parallel network requests
                const fetchedProducts = await Promise.all(
                    filteredIds.map(async (id) => {
                        try {
                            return await wholesaleProductsApi.getById(id);
                        } catch (err) {
                            console.warn(`Failed to fetch recent product ${id}:`, err);
                            return null;
                        }
                    })
                );

                // Filter out any products that failed to load (e.g., deleted by admin)
                setProducts(fetchedProducts.filter((p): p is WholesaleProduct => p !== null));
            } catch (error) {
                console.error('RecentlyViewedProducts Error:', error);
            } finally {
                setLoading(false);
            }
        };

        if (hasMounted && productIds.length > 0) {
            fetchRecentProducts();
        } else {
            setLoading(false);
        }
    }, [productIds, currentProductId, hasMounted]);

    // Avoid hydration mismatch by waiting for mount
    if (!hasMounted) return null;
    if (loading) return null; // Silently load in the background for better UX
    if (products.length === 0) return null;

    return (
        <section className="py-12 border-t border-gray-100 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-heading font-bold text-gray-900">Recently Viewed</h2>
                </div>
                
                <button 
                    onClick={clearHistory}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                    <XCircle className="w-4 h-4" />
                    Clear History
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {products.map((product) => (
                    <Link 
                        key={product.id}
                        href={`/product/${product.slug}`}
                        className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
                    >
                        {/* Compact Thumbnail for history */}
                        <div className="aspect-[4/5] relative overflow-hidden bg-gray-50">
                            {product.images[0] ? (
                                <Image
                                    src={getCloudinaryUrl(product.images[0], PRODUCT_CARD_IMG_OPTS)}
                                    alt={product.title}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 16vw"
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                    No Image
                                </div>
                            )}
                            {!product.inStock && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="bg-gray-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        Sold Out
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-3">
                            <h3 className="text-xs font-bold text-gray-700 line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                {product.title}
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-bold text-primary">₹{product.bundlePrice}</span>
                                <span className="text-[10px] text-gray-400 font-medium">/ bundle</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};
