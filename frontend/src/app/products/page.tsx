'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WholesaleProduct } from '@tntrends/shared';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';

/**
 * Products Listing Page
 * Display all available wholesale products for customers
 */

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<WholesaleProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await wholesaleProductsApi.getAll();
            setProducts(data.filter((p) => p.inStock));
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading products...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Wholesale Products</h1>
                <p className="text-gray-600">Bundle-based pricing for bulk orders</p>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No products available at the moment</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => router.push(`/products/${product.id}`)}
                            className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        >
                            {/* Product Image */}
                            <div className="relative h-64 bg-gray-100">
                                {product.images.length > 0 ? (
                                    <img
                                        src={product.images[0]}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}

                                {/* Stock Badge */}
                                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    {product.availableBundles} bundles
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                                <h3 className="text-xl font-semibold mb-2">{product.title}</h3>

                                {product.description && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}

                                {/* Bundle Config */}
                                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                                    <p className="text-sm font-semibold text-blue-900 mb-1">
                                        Bundle: {product.bundleQty} pieces
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {Object.entries(product.bundleComposition)
                                            .map(([size, qty]) => `${size}:${qty}`)
                                            .join(' • ')}
                                    </p>
                                </div>

                                {/* Pricing */}
                                <div className="flex items-baseline justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-green-600">
                                            ₹{product.bundlePrice.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            ₹{(product.bundlePrice / product.bundleQty).toFixed(2)}{' '}
                                            per piece
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/products/${product.id}`);
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
