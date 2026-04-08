'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Accordion from '@radix-ui/react-accordion';
import { PRODUCT_CATEGORIES, getSizeGroupForCategory } from '@orchids/shared';

// ============================================================================
// Types & Constants
// ============================================================================

interface FilterSidebarProps {
    className?: string;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
    className,
    mobileOpen = false,
    onMobileClose
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ------------------------------------------------------------------------
    // State Derivation
    // ------------------------------------------------------------------------
    const activeCategory = searchParams.get('category');
    const activeTags = searchParams.getAll('tag');
    const activeSizes = searchParams.getAll('size');

    // Default expanded items: active category or just the first one if nothing selected
    const [expandedItems, setExpandedItems] = useState<string[]>(
        activeCategory ? [activeCategory] : []
    );

    // Sync expanded state when URL changes
    useEffect(() => {
        if (activeCategory && !expandedItems.includes(activeCategory)) {
            setExpandedItems(prev => [...prev, activeCategory]);
        }
    }, [activeCategory]);

    // ------------------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------------------

    // Switch main category
    const handleCategoryChange = (categoryId: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (activeCategory !== categoryId) {
            params.set('category', categoryId);
            params.delete('tag'); // Reset tags
            params.delete('size'); // Reset sizes
            
            // Auto expand the newly selected category
            setExpandedItems(prev => prev.includes(categoryId) ? prev : [...prev, categoryId]);
        }

        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    // Toggle specific tag
    const handleTagToggle = (categoryId: string, tagValue: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const currentTags = new Set(params.getAll('tag'));

        if (currentTags.has(tagValue)) {
            // REMOVE
            currentTags.delete(tagValue);
            params.delete('tag');
            currentTags.forEach(t => params.append('tag', t));
        } else {
            // ADD
            if (activeCategory !== categoryId) {
                params.set('category', categoryId);
                params.delete('tag');
                params.delete('size');
                params.append('tag', tagValue);
            } else {
                params.append('tag', tagValue);
            }
        }

        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    // Toggle specific size
    const handleSizeToggle = (categoryId: string, sizeValue: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const currentSizes = new Set(params.getAll('size'));

        if (currentSizes.has(sizeValue)) {
            // REMOVE
            currentSizes.delete(sizeValue);
            params.delete('size');
            currentSizes.forEach(s => params.append('size', s));
        } else {
            // ADD
            if (activeCategory !== categoryId) {
                params.set('category', categoryId);
                params.delete('tag');
                params.delete('size');
                params.append('size', sizeValue);
            } else {
                params.append('size', sizeValue);
            }
        }

        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        router.push('/products', { scroll: false });
        onMobileClose?.();
        setExpandedItems([]);
    };

    // ------------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------------

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden",
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onMobileClose}
                aria-hidden="true"
            />

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "bg-white flex flex-col",
                    "fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl transition-transform duration-300 ease-out",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                    "md:translate-x-0 md:static md:w-64 md:sticky md:top-28 md:z-30",
                    "md:rounded-xl md:shadow-soft",
                    className
                )}
            >
                {/* Header Section */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 md:border-none md:pb-2 md:pt-5">
                    <h3 className="font-heading font-bold text-gray-900 text-lg md:text-base">
                        Filters
                    </h3>

                    {(activeCategory || activeTags.length > 0 || activeSizes.length > 0) && (
                        <button
                            onClick={clearFilters}
                            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-wider"
                        >
                            Clear All
                        </button>
                    )}

                    <button
                        onClick={onMobileClose}
                        className="p-1 rounded-full hover:bg-gray-100 md:hidden"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content Section - Scrollable */}
                <div className="flex-1 overflow-y-auto px-2 py-2 md:overflow-visible">
                    <Accordion.Root
                        type="multiple"
                        value={expandedItems}
                        onValueChange={setExpandedItems}
                        className="space-y-1"
                    >
                        {PRODUCT_CATEGORIES.map((category) => {
                            const isCategoryActive = activeCategory === category.id;
                            const sizeGroup = getSizeGroupForCategory(category.id);

                            return (
                                <Accordion.Item
                                    key={category.id}
                                    value={category.id}
                                    className="border-b border-transparent last:border-0"
                                >
                                    <Accordion.Header className="flex">
                                        <div className={cn(
                                            "flex flex-1 items-center justify-between px-3 py-2.5 rounded-lg transition-all group",
                                            isCategoryActive ? "bg-primary/5" : "hover:bg-gray-50"
                                        )}>
                                            <button 
                                                className={cn(
                                                    "text-sm font-medium transition-colors text-left flex-1 focus:outline-none",
                                                    isCategoryActive ? "text-primary font-semibold" : "text-gray-700 group-hover:text-gray-900"
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleCategoryChange(category.id);
                                                }}
                                            >
                                                {category.label}
                                            </button>
                                            <Accordion.Trigger className="p-1 rounded-md hover:bg-gray-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                                                <ChevronDown
                                                    className={cn(
                                                        "w-4 h-4 text-gray-400 transition-transform duration-200",
                                                        "group-data-[state=open]:rotate-180",
                                                        isCategoryActive && "text-primary/60"
                                                    )}
                                                />
                                            </Accordion.Trigger>
                                        </div>
                                    </Accordion.Header>

                                    <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                        <div className="px-3 pb-3 pt-1 space-y-4">
                                            
                                            {/* Subcategories / Tags */}
                                            {category.subcategories.length > 0 && (
                                                <div className="space-y-1">
                                                    <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Categories</h4>
                                                    {category.subcategories.map((sub) => {
                                                        const isTagSelected = activeTags.includes(sub.value);
                                                        const isChecked = isCategoryActive && isTagSelected;

                                                        return (
                                                            <div
                                                                key={sub.value}
                                                                onClick={() => handleTagToggle(category.id, sub.value)}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer transition-colors group/item",
                                                                    "hover:bg-gray-50"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all bg-white shadow-soft",
                                                                    isChecked
                                                                        ? "border-primary bg-primary text-white"
                                                                        : "border-gray-300 text-transparent group-hover/item:border-gray-400"
                                                                )}>
                                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                                </div>

                                                                <span className={cn(
                                                                    "text-sm",
                                                                    isChecked ? "text-gray-900 font-medium" : "text-gray-600"
                                                                )}>
                                                                    {sub.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Sizes */}
                                            {sizeGroup && sizeGroup.sizes.length > 0 && (
                                                <div className="space-y-2 border-t border-gray-100 pt-3">
                                                    <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2">{sizeGroup.dimensionLabel}</h4>
                                                    <div className="grid grid-cols-2 gap-2 px-2">
                                                        {sizeGroup.sizes.map((size) => {
                                                            const isSizeSelected = activeSizes.includes(size);
                                                            const isChecked = isCategoryActive && isSizeSelected;

                                                            return (
                                                                <div
                                                                    key={size}
                                                                    onClick={() => handleSizeToggle(category.id, size)}
                                                                    className={cn(
                                                                        "flex items-center justify-center py-1.5 rounded-md cursor-pointer transition-all border text-[13px]",
                                                                        isChecked 
                                                                            ? "bg-primary border-primary text-white font-medium shadow-sm" 
                                                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                                                    )}
                                                                >
                                                                    {size}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </Accordion.Content>
                                </Accordion.Item>
                            );
                        })}
                    </Accordion.Root>
                </div>
            </aside>
        </>
    );
};
