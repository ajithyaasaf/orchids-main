'use client';

import React from 'react';
import type { ProductSortBy } from '@tntrends/shared';

interface ProductSortDropdownProps {
    value: ProductSortBy;
    onChange: (sortBy: ProductSortBy) => void;
}

export const ProductSortDropdown: React.FC<ProductSortDropdownProps> = ({ value, onChange }) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as ProductSortBy)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
        </select>
    );
};
