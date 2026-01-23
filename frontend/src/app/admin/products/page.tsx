'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productApi } from '@/lib/api';
import { Product } from '@tntrends/shared';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Plus, Search, Copy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getProductPricing } from '@/lib/pricingUtils';
import { useToast } from '@/context/ToastContext';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await productApi.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteCandidate(id);
    };

    const confirmDelete = async () => {
        if (!deleteCandidate) return;

        setIsDeleting(true);
        try {
            await productApi.delete(deleteCandidate);
            setProducts(products.filter(p => p.id !== deleteCandidate));
            showToast('Product deleted successfully', 'success');
            setDeleteCandidate(null);
        } catch (error: any) {
            showToast(error.message || 'Failed to delete product', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            p.title.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term) ||
            p.color?.toLowerCase().includes(term) ||
            p.styleCode?.toLowerCase().includes(term)
        );
    });

    // Calculate total stock across all sizes
    const getTotalStock = (product: Product) => {
        if (!product.stockBySize) return 0;
        return Object.values(product.stockBySize).reduce((sum: number, qty: number) => sum + qty, 0);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Product Inventory ({products.length})</h1>
                <Link href="/admin/products/new">
                    <Button className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        New Product
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-4 md:p-6 mb-4 md:mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by title, color, or style code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading products...</div>
            ) : (
                <>
                    {/* Desktop: Table View */}
                    <div className="hidden lg:block bg-white rounded-xl shadow-soft overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-gray-50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider min-w-[250px]">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Style/Color
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Tags
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                                        Total Stock
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider min-w-[150px]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                                                    <Image
                                                        src={product.images[0]?.url || '/placeholder-product.jpg'}
                                                        alt={product.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-text-primary truncate max-w-[200px]">{product.title}</p>
                                                    <p className="text-xs text-text-secondary uppercase">
                                                        {product.category}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {product.styleCode ? (
                                                <div>
                                                    <p className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mb-1">
                                                        {product.styleCode}
                                                    </p>
                                                    {product.color && (
                                                        <p className="text-xs text-text-secondary">
                                                            Color: <span className="font-medium text-text-primary">{product.color}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No Style Code</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {product.tags && product.tags.length > 0 ? (
                                                    product.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No tags</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-semibold text-text-primary">₹{getProductPricing(product).displayPrice.toFixed(0)}</p>
                                            {getProductPricing(product).hasDiscount && (
                                                <p className="text-xs text-gray-500 line-through">₹{getProductPricing(product).originalDisplayPrice.toFixed(0)}</p>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.inStock ? `${getTotalStock(product)} units` : 'SOLD OUT'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                {product.styleCode && (
                                                    <Link href={`/admin/products/new?sourceId=${product.id}`}>
                                                        <button
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Duplicate / Add New Color"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                )}

                                                <Link href={`/admin/products/edit/${product.id}`}>
                                                    <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition" title="Edit">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </Link>

                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 text-error hover:bg-error/10 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-text-secondary">No products found matching your filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Mobile: Card View */}
                    <div className="lg:hidden space-y-4">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-xl shadow-soft p-4 active:bg-gray-50 transition-colors">
                                <div className="flex gap-4 mb-4">
                                    {/* Product Image */}
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                                        <Image
                                            src={product.images[0]?.url || '/placeholder-product.jpg'}
                                            alt={product.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-text-primary mb-1 line-clamp-2">{product.title}</h3>
                                        <p className="text-xs text-text-secondary uppercase mb-2">{product.category}</p>

                                        {/* Style Code & Color */}
                                        {product.styleCode && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                    {product.styleCode}
                                                </span>
                                                {product.color && (
                                                    <span className="text-xs text-text-secondary bg-gray-100 px-2 py-0.5 rounded">
                                                        {product.color}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Tags */}
                                        {product.tags && product.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {product.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Price & Stock */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div>
                                                <p className="text-lg font-bold text-primary">₹{getProductPricing(product).displayPrice.toFixed(0)}</p>
                                                {getProductPricing(product).hasDiscount && (
                                                    <p className="text-xs text-gray-500 line-through">₹{getProductPricing(product).originalDisplayPrice.toFixed(0)}</p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {product.inStock ? `${getTotalStock(product)} units` : 'SOLD OUT'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions - Touch Optimized */}
                                <div className="flex gap-2 pt-3 border-t border-border">
                                    {product.styleCode && (
                                        <Link href={`/admin/products/new?sourceId=${product.id}`} className="flex-1">
                                            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition font-medium active:bg-blue-200">
                                                <Copy className="w-4 h-4" />
                                                <span className="text-sm">Duplicate</span>
                                            </button>
                                        </Link>
                                    )}

                                    <Link href={`/admin/products/edit/${product.id}`} className="flex-1">
                                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition font-medium active:bg-primary/30">
                                            <Edit className="w-4 h-4" />
                                            <span className="text-sm">Edit</span>
                                        </button>
                                    </Link>

                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex items-center justify-center gap-2 px-4 py-3 text-error bg-error/10 hover:bg-error/20 rounded-lg transition active:bg-error/30"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl shadow-soft">
                                <p className="text-text-secondary">No products found matching your filters.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Custom Confirmation Modal */}
            {deleteCandidate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm scale-100 transform transition-all">
                        <h3 className="text-xl font-bold text-red-600 mb-4">Confirm Deletion</h3>
                        <p className="text-text-secondary mb-6">
                            Are you absolutely sure you want to delete this product? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDeleteCandidate(null)} disabled={isDeleting}>
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className="bg-red-500 hover:bg-red-600 text-white border-none"
                                isLoading={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}