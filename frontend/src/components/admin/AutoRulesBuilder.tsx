'use client';

import React, { useState } from 'react';
import { AutoSelectionRules } from '@tntrends/shared';
import { Plus, X } from 'lucide-react';

interface AutoRulesBuilderProps {
    rules: AutoSelectionRules;
    onRulesChange: (rules: AutoSelectionRules) => void;
}

/**
 * Auto-Rules Builder Component
 * UI for configuring automatic product selection rules
 * 
 * Supports:
 * - Category filters
 * - Tag filters
 * - Price range
 * - Minimum discount
 * - Stock status
 */
export const AutoRulesBuilder: React.FC<AutoRulesBuilderProps> = ({
    rules,
    onRulesChange
}) => {
    const [newCategory, setNewCategory] = useState('');
    const [newTag, setNewTag] = useState('');

    const updateRules = (updates: Partial<AutoSelectionRules>) => {
        onRulesChange({ ...rules, ...updates });
    };

    const addCategory = () => {
        if (newCategory.trim() && !rules.categories?.includes(newCategory)) {
            updateRules({
                categories: [...(rules.categories || []), newCategory.trim()]
            });
            setNewCategory('');
        }
    };

    const removeCategory = (category: string) => {
        updateRules({
            categories: rules.categories?.filter(c => c !== category)
        });
    };

    const addTag = () => {
        if (newTag.trim() && !rules.tags?.includes(newTag)) {
            updateRules({
                tags: [...(rules.tags || []), newTag.trim()]
            });
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        updateRules({
            tags: rules.tags?.filter(t => t !== tag)
        });
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 space-y-6">
            <div>
                <h3 className="font-medium text-gray-900 mb-4">Automatic Selection Rules</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Products matching these criteria will be automatically included
                </p>
            </div>

            {/* Categories */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories
                </label>
                <div className="flex gap-2 mb-2">
                    <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="">Select category...</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                    </select>
                    <button
                        type="button"
                        onClick={addCategory}
                        disabled={!newCategory}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {rules.categories && rules.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {rules.categories.map(cat => (
                            <span
                                key={cat}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                                {cat}
                                <button
                                    type="button"
                                    onClick={() => removeCategory(cat)}
                                    className="hover:text-blue-900"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                </label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Enter tag (e.g., Winter, Jackets)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                        type="button"
                        onClick={addTag}
                        disabled={!newTag.trim()}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                {rules.tags && rules.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {rules.tags.map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="hover:text-green-900"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Price Range */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                            type="number"
                            value={rules.priceRange?.min || ''}
                            onChange={(e) => updateRules({
                                priceRange: {
                                    ...rules.priceRange,
                                    min: e.target.value ? parseInt(e.target.value) : undefined
                                }
                            })}
                            placeholder="₹0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                            type="number"
                            value={rules.priceRange?.max || ''}
                            onChange={(e) => updateRules({
                                priceRange: {
                                    ...rules.priceRange,
                                    max: e.target.value ? parseInt(e.target.value) : undefined
                                }
                            })}
                            placeholder="₹10000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Minimum Discount */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Discount (%)
                </label>
                <input
                    type="number"
                    value={rules.discountMin || ''}
                    onChange={(e) => updateRules({
                        discountMin: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="e.g., 20"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Only include products with at least this discount percentage
                </p>
            </div>

            {/* Stock Status */}
            <div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={rules.inStock === true}
                        onChange={(e) => updateRules({
                            inStock: e.target.checked ? true : undefined
                        })}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">
                        Only in-stock products
                    </span>
                </label>
            </div>

            {/* Rules Summary */}
            {Object.keys(rules).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Active Rules:</p>
                    <div className="text-xs text-gray-600 space-y-1">
                        {rules.categories && rules.categories.length > 0 && (
                            <div>• Categories: {rules.categories.join(', ')}</div>
                        )}
                        {rules.tags && rules.tags.length > 0 && (
                            <div>• Tags: {rules.tags.join(', ')}</div>
                        )}
                        {(rules.priceRange?.min || rules.priceRange?.max) && (
                            <div>
                                • Price: ₹{rules.priceRange?.min || 0} - ₹{rules.priceRange?.max || '∞'}
                            </div>
                        )}
                        {rules.discountMin && (
                            <div>• Minimum {rules.discountMin}% discount</div>
                        )}
                        {rules.inStock && (
                            <div>• In stock only</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
