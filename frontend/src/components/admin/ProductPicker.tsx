'use client';

import React, { useState, useEffect } from 'react';
import { productApi } from '@/lib/api';
import { Product } from '@tntrends/shared';
import { Search, X, Check, Loader2 } from 'lucide-react';

interface ProductPickerProps {
    selectedProductIds: string[];
    onProductsChange: (productIds: string[]) => void;
}

/**
 * Product Picker Component
 * Allows admin to search and select products for manual collection assignment
 * 
 * Features:
 * - Real-time product search
 * - Selected products display
 * - Easy add/remove
 */
export const ProductPicker: React.FC<ProductPickerProps> = ({
    selectedProductIds,
    onProductsChange
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Load full product details for selected IDs
    useEffect(() => {
        if (selectedProductIds.length === 0) {
            setSelectedProducts([]);
            setLoading(false);
            return;
        }

        loadSelectedProducts();
    }, [selectedProductIds]);

    const loadSelectedProducts = async () => {
        try {
            // Note: This is a simplified implementation
            // In production, you'd want a batch get endpoint
            const { data: allProducts } = await productApi.getAll({ limit: 1000 });
            const selected = allProducts.filter((p: Product) => selectedProductIds.includes(p.id));
            setSelectedProducts(selected);
        } catch (error) {
            console.error('Failed to load selected products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const performSearch = async () => {
        try {
            setSearching(true);
            const { data } = await productApi.getAll({
                search: searchQuery,
                limit: 20
            });
            setSearchResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleAddProduct = (product: Product) => {
        if (!selectedProductIds.includes(product.id)) {
            onProductsChange([...selectedProductIds, product.id]);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleRemoveProduct = (productId: string) => {
        onProductsChange(selectedProductIds.filter(id => id !== productId));
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">Select Products</h3>

            {/* Search Bar */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products by name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="mb-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    {searchResults.map(product => {
                        const isSelected = selectedProductIds.includes(product.id);
                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => !isSelected && handleAddProduct(product)}
                                disabled={isSelected}
                                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 ${isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                            >
                                <img
                                    src={product.images[0]?.url}
                                    alt={product.title}
                                    className="w-12 h-12 rounded object-cover"
                                />
                                <div className="flex-1 text-left">
                                    <div className="font-medium text-gray-900">{product.title}</div>
                                    <div className="text-sm text-gray-600">₹{product.price}</div>
                                </div>
                                {isSelected && (
                                    <Check className="w-5 h-5 text-green-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected Products */}
            {loading ? (
                <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                </div>
            ) : selectedProducts.length > 0 ? (
                <div>
                    <div className="text-sm text-gray-600 mb-2">
                        {selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'} selected
                    </div>
                    <div className="space-y-2">
                        {selectedProducts.map(product => (
                            <div
                                key={product.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <img
                                    src={product.images[0]?.url}
                                    alt={product.title}
                                    className="w-10 h-10 rounded object-cover"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 text-sm">{product.title}</div>
                                    <div className="text-xs text-gray-600">₹{product.price}</div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(product.id)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No products selected</p>
                    <p className="text-xs mt-1">Use the search above to add products</p>
                </div>
            )}
        </div>
    );
};
