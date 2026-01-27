'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WholesaleProduct } from '@tntrends/shared';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';

/**
 * Admin Product List Page
 * Displays all wholesale products with lock status and quick actions
 */

export default function AdminProductListPage() {
    const router = useRouter();
    const [products, setProducts] = useState<WholesaleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await wholesaleProductsApi.getAll();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await wholesaleProductsApi.delete(id);
            alert('Product deleted successfully');
            loadProducts();
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Wholesale Products</h1>
                <button
                    onClick={() => router.push('/admin/wholesale/products/new')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                    + Add New Product
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {products.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">No products found</p>
                    <button
                        onClick={() => router.push('/admin/wholesale/products/new')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Bundle Config
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold">{product.title}</div>
                                            <div className="text-sm text-gray-500">
                                                {product.category}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <div className="font-medium">
                                                {product.bundleQty} pcs/bundle
                                            </div>
                                            <div className="text-gray-500">
                                                {Object.entries(product.bundleComposition)
                                                    .map(([size, qty]) => `${size}:${qty}`)
                                                    .join(', ')}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold">
                                                ₹{product.bundlePrice.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                ₹
                                                {(product.bundlePrice / product.bundleQty).toFixed(
                                                    2
                                                )}{' '}
                                                /pc
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div
                                                className={`font-medium ${product.inStock
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}
                                            >
                                                {product.availableBundles} bundles
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {product.totalPieces} total pcs
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.isLocked ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                🔒 Locked
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✓ Unlocked
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/wholesale/products/${product.id}/edit`
                                                    )
                                                }
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            >
                                                Edit
                                            </button>
                                            {!product.isLocked && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(product.id, product.title)
                                                    }
                                                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
