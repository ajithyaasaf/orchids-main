'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WholesaleProduct } from '@orchids/shared';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { RefreshCw, Plus } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

/**
 * Admin Product List Page Content
 * Displays all wholesale products with lock status, quick actions, and real-time freshness
 */
function AdminProductListContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const refreshKey = searchParams.get('refresh');
    const { showToast } = useToast();
    const [products, setProducts] = useState<WholesaleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
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

    const loadProducts = useCallback(async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError('');
            const data = await wholesaleProductsApi.getAll();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // 1. Initial mount & whenever navigation includes ?refresh=...
    useEffect(() => {
        loadProducts();
    }, [loadProducts, refreshKey]);

    // 2. Real-time event & focus listeners for automatic synchronization
    useEffect(() => {
        const handleCustomRefresh = () => {
            loadProducts(true);
        };

        const handleFocus = () => {
            // Revalidate on tab focus
            loadProducts(true);
        };

        window.addEventListener('admin:refresh-products', handleCustomRefresh);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('admin:refresh-products', handleCustomRefresh);
            window.removeEventListener('focus', handleFocus);
        };
    }, [loadProducts]);

    const handleDelete = async (id: string, title: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Product',
            message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete Now',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await wholesaleProductsApi.delete(id);
                    showToast('Product deleted successfully', 'success');
                    loadProducts();
                } catch (err: any) {
                    showToast(`Failed to delete: ${err.message}`, 'error');
                }
            }
        });
    };

    return (
        <div className="container-custom p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Wholesale Products</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage wholesale inventory, bundle tiers, and stock status</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => loadProducts(true)}
                        disabled={refreshing || loading}
                        className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                        title="Refresh product list"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
                        <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                    {(!loading && products.length > 0) && (
                        <button
                            onClick={() => router.push('/admin/wholesale/products/new')}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-sm shadow-primary/20 hover:shadow-md flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Product
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gray-50/50 border-b border-gray-100 py-3 px-6 h-10 w-full" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRowSkeleton key={i} columns={6} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-gray-600 mb-4">No products found</p>
                    <button
                        onClick={() => router.push('/admin/wholesale/products/new')}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                        + Add Your First Product
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bundle Config
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products
                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                .map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-text-primary">{product.title}</div>
                                            <div className="text-sm text-text-secondary">
                                                {product.category}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-text-primary">
                                                {product.bundleQty} pcs/bundle
                                            </div>
                                            <div className="text-text-secondary">
                                                {Object.entries(product.bundleComposition)
                                                    .map(([size, qty]) => `${size}:${qty}`)
                                                    .join(', ')}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-text-primary">
                                                ₹{product.bundlePrice.toFixed(2)}
                                            </div>
                                            <div className="text-sm text-text-secondary">
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
                                            <div className="text-sm text-text-secondary">
                                                {product.totalPieces} total pcs
                                            </div>
                                            {(product.reservedBundles ?? 0) > 0 && (
                                                <div className="text-xs text-amber-600 font-medium mt-0.5">
                                                    + {product.reservedBundles} reserved
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.isLocked ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-100">
                                                🔒 Locked
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-100">
                                                ✓ Unlocked
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/wholesale/products/${product.id}/edit`
                                                    )
                                                }
                                                className="text-indigo-600 hover:text-indigo-800 font-bold text-sm transition-colors"
                                            >
                                                Edit
                                            </button>
                                            {!product.isLocked && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(product.id, product.title)
                                                    }
                                                    className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
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

                    {/* Pagination Footer */}
                    {products.length > itemsPerPage && (
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-700">{Math.min(currentPage * itemsPerPage, products.length)}</span> of <span className="font-medium text-gray-700">{products.length}</span> products
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(products.length / itemsPerPage), p + 1))}
                                    disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                {...confirmModal}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

export default function AdminProductListPage() {
    return (
        <Suspense fallback={
            <div className="container-custom p-6">
                <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRowSkeleton key={i} columns={6} />
                    ))}
                </div>
            </div>
        }>
            <AdminProductListContent />
        </Suspense>
    );
}

