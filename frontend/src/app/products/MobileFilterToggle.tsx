'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SlidersHorizontal } from 'lucide-react';
import { FilterSidebar } from '@/components/products/FilterSidebar';

export function MobileFilterToggle() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsOpen(true)}
            >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
            </Button>

            {/* Render the sidebar in "mobile mode" when open */}
            <FilterSidebar
                mobileOpen={isOpen}
                onMobileClose={() => setIsOpen(false)}
            />
        </>
    );
}
