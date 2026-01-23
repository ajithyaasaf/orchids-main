'use client';

import React from 'react';

interface ProductFiltersSidebarProps {
    selectedSizes: string[];
    priceRange: { min: number; max: number };
    onSizeToggle: (size: string) => void;
    onPriceChange: (range: { min: number; max: number }) => void;
    onClearFilters: () => void;
    showFilters: boolean;

    // NEW: Optional filters
    selectedCategories?: string[]; // For Tag pages (Men/Women/Kids)
    onCategoryToggle?: (category: string) => void;

    selectedTags?: string[]; // For Category pages
    onTagToggle?: (tag: string) => void;
    availableTags?: string[]; // Tags to show
}

export const ProductFiltersSidebar: React.FC<ProductFiltersSidebarProps> = ({
    selectedSizes,
    priceRange,
    onSizeToggle,
    onPriceChange,
    onClearFilters,
    showFilters,
    selectedCategories,
    onCategoryToggle,
    selectedTags,
    onTagToggle,
    availableTags = [],
}) => {
    return (
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                <h3 className="font-bold text-text-primary mb-4">Filters</h3>

                {/* Category Filter (Gender) - Only show if props provided */}
                {selectedCategories && onCategoryToggle && (
                    <div className="mb-6 border-b border-gray-100 pb-6">
                        <h4 className="font-semibold text-text-primary mb-3">Category</h4>
                        <div className="space-y-2">
                            {['Men', 'Women', 'Kids'].map((cat) => (
                                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => onCategoryToggle(cat)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-gray-700">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tag Filter (Product Type) - Only show if props provided */}
                {selectedTags && onTagToggle && availableTags.length > 0 && (
                    <div className="mb-6 border-b border-gray-100 pb-6">
                        <h4 className="font-semibold text-text-primary mb-3">Product Type</h4>
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => onTagToggle(tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${selectedTags.includes(tag)
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Size Filter */}
                <div className="mb-6">
                    <h4 className="font-semibold text-text-primary mb-3">Size</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {['S', 'M', 'L', 'XL', 'XXL', '2-3Y', '4-5Y'].map((size) => (
                            <button
                                key={size}
                                onClick={() => onSizeToggle(size)}
                                className={`py-2 px-4 rounded-lg border-2 transition ${selectedSizes.includes(size)
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-border hover:border-primary'
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                    <h4 className="font-semibold text-text-primary mb-3">Price Range</h4>
                    <div className="space-y-3">
                        <input
                            type="range"
                            min="0"
                            max="10000"
                            step="100"
                            value={priceRange.max}
                            onChange={(e) => onPriceChange({ ...priceRange, max: parseInt(e.target.value) })}
                            className="w-full"
                        />
                        <div className="flex justify-between text-sm text-text-secondary">
                            <span>₹{priceRange.min}</span>
                            <span>₹{priceRange.max}</span>
                        </div>
                    </div>
                </div>

                {/* Clear Filters */}
                <button
                    onClick={onClearFilters}
                    className="text-primary text-sm hover:text-primary-dark"
                >
                    Clear All Filters
                </button>
            </div>
        </div>
    );
};
