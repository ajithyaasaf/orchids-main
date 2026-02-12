'use client';

import React, { useState, createContext, useContext } from 'react';
import { Button } from '@/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';

interface ProductsClientWrapperProps {
    children: React.ReactNode;
}

interface FilterContextType {
    mobileFiltersOpen: boolean;
    setMobileFiltersOpen: (open: boolean) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilterContext = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilterContext must be used within ProductsClientWrapper');
    }
    return context;
};

export function ProductsClientWrapper({ children }: ProductsClientWrapperProps) {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    return (
        <FilterContext.Provider value={{ mobileFiltersOpen, setMobileFiltersOpen }}>
            {/* Mobile Filter Button */}
            <div className="md:hidden mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 w-full justify-center"
                    onClick={() => setMobileFiltersOpen(true)}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                </Button>
            </div>

            {/* Main Content */}
            {children}
        </FilterContext.Provider>
    );
}
