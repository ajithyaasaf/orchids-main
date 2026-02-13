'use client';

import React, { useState, useEffect } from 'react';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { WholesaleProduct } from '@tntrends/shared';
import { Search, X, Check, Loader2, Package } from 'lucide-react';

interface WholesaleProductPickerProps {
    selectedProductIds: string[];
    onProductsChange: (productIds: string[]) => void;
}

/**
 * Wholesale Product Picker Component
 * Allows admin to search and select wholesale products for manual collection assignment
 * 
 * Features:
 * - Real-time wholesale product search
 * - Selected products display with bundle info
 * - Category and tag filtering
 * - Easy add/remove functionality
 * - Optimized for large product catalogs
 */
export const WholesaleProductPicker: React.FC<WholesaleProductPickerProps> = ({
    selectedProductIds,
    onProductsChange
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<WholesaleProduct[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<WholesaleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [allProducts, setAllProducts] = useState<WholesaleProduct[]>([]);

    // Load all wholesale products on mount
    useEffect(() => {
        loadAllProducts();
    }, []);

    // Load selected products when IDs change
    useEffect(() => {
        if (selectedProductIds.length === 0) {
            setSelectedProducts([]);
            return;
        }

        if (allProducts.length > 0) {
            const selected = allProducts.filter(p => selectedProductIds.includes(p.id));
            setSelectedProducts(selected);
        }
    }, [selectedProductIds, allProducts]);

    const loadAllProducts = async () => {
        try {
            setLoading(true);
            const products = await wholesaleProductsApi.getAll();
            setAllProducts(products);
        } catch (error) {
            console.error('Failed to load wholesale products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side search with debouncing
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, allProducts]);

    const performSearch = () => {
        setSearching(true);

        const query = searchQuery.toLowerCase();
        const results = allProducts.filter(product => {
            // Search in title
            if (product.title.toLowerCase().includes(query)) return true;

            // Search in category
            if (product.category?.toLowerCase().includes(query)) return true;

            // Search in tags
            if (product.tags?.some(tag => tag.toLowerCase().includes(query))) return true;

            return false;
        }).slice(0, 20); // Limit to 20 results

        setSearchResults(results);
        setSearching(false);
    };

    const handleAddProduct = (product: WholesaleProduct) => {
        if (!selectedProductIds.includes(product.id)) {
            onProductsChange([...selectedProductIds, product.id]);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleRemoveProduct = (productId: string) => {
        onProductsChange(selectedProductIds.filter(id => id !== productId));
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Wholesale Products</h3>
                <div className="text-sm text-gray-600">
                    {allProducts.length} products available
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, category, or tags..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mb-4 max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    {searchResults.map(product => {
                        const isSelected = selectedProductIds.includes(product.id);
                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => !isSelected && handleAddProduct(product)}
                                disabled={isSelected}
                                className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${isSelected ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'
                                    }`}
                            >
                                {/* Product Image */}
                                <div className="flex-shrink-0">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0].url}
                                            alt={product.title}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 text-left min-w-0">
                                    <div className="font-medium text-gray-900 mb-1 line-clamp-1">
                                        {product.title}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <span className="font-semibold text-primary">
                                            {formatPrice(product.bundlePrice)}
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span>{product.bundleQty} units/bundle</span>
                                    </div>
                                    {product.category && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                {product.category}
                                            </span>
                                            {product.tags && product.tags.length > 0 && (
                                                <span className="text-gray-500">
                                                    +{product.tags.length} tags
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected Products */}
            {loading ? (
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading products...</p>
                </div>
            ) : selectedProducts.length > 0 ? (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-medium text-gray-700">
                            Selected Products
                        </div>
                        <div className="text-sm text-gray-600">
                            {selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'}
                        </div>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {selectedProducts.map(product => (
                            <div
                                key={product.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                {/* Product Image */}
                                <div className="flex-shrink-0">
                                    {product.images && product.images.length > 0 ? (
                                        <img
                                            src={product.images[0].url}
                                            alt={product.title}
                                            className="w-12 h-12 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                                            <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm line-clamp-1">
                                        {product.title}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {formatPrice(product.bundlePrice)} • {product.bundleQty} units
                                    </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(product.id)}
                                    className="p-1.5 hover:bg-red-100 rounded transition-colors group"
                                    title="Remove product"
                                >
                                    <X className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-700 mb-1">No products selected</p>
                    <p className="text-xs text-gray-500">
                        Use the search above to find and add wholesale products
                    </p>
                </div>
            )}
        </div>
    );
};
