'use client';

import { FilterSidebar as BaseFilterSidebar } from '@/components/products/FilterSidebar';
import { useFilterContext } from './ProductsClientWrapper';

export function FilterSidebarClient() {
    const { mobileFiltersOpen, setMobileFiltersOpen } = useFilterContext();

    return (
        <BaseFilterSidebar
            mobileOpen={mobileFiltersOpen}
            onMobileClose={() => setMobileFiltersOpen(false)}
        />
    );
}
