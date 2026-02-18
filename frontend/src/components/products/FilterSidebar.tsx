'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Accordion from '@radix-ui/react-accordion';
import * as Checkbox from '@radix-ui/react-checkbox';

// ============================================================================
// Types & Constants
// ============================================================================

interface FilterSidebarProps {
    className?: string;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

const FILTER_CATEGORIES = [
    {
        id: 'newborn',
        label: 'Newborn Collection',
        subcategories: [
            { label: 'Jubba Sets', value: 'jubba' },
            { label: 'Rompers', value: 'rompers' },
            { label: 'Frocks', value: 'frocks' },
            { label: 'Cord Sets', value: 'cord-sets' },
            { label: 'Cloth Diapers', value: 'diapers' },
            { label: 'Gift Boxes', value: 'gift-box' },
            { label: 'Towels & Wipes', value: 'towels' },
            { label: 'Bibs & Caps', value: 'bibs' },
            { label: 'Baby Beds', value: 'beds' },
            { label: 'Mosquito Nets', value: 'nets' },
        ]
    },
    {
        id: 'girls',
        label: 'Girls Wear',
        subcategories: [
            { label: 'Frocks & Dresses', value: 'frocks' },
            { label: 'T-Shirts & Tops', value: 't-shirts' },
            { label: 'Sets & Combos', value: 'sets' },
            { label: 'Leggings', value: 'leggings' },
            { label: 'Nightwear', value: 'nightwear' },
            { label: 'Innerwear', value: 'innerwear' },
        ]
    },
    {
        id: 'boys',
        label: 'Boys Wear',
        subcategories: [
            { label: 'T-Shirts', value: 't-shirts' },
            { label: 'Shirts', value: 'shirts' },
            { label: 'Sets', value: 'sets' },
            { label: 'Shorts', value: 'shorts' },
            { label: 'Track Pants', value: 'pants' },
            { label: 'Jeans', value: 'jeans' },
            { label: 'Innerwear', value: 'underwear' },
        ]
    },
    {
        id: 'women',
        label: "Women's Apparel",
        subcategories: [
            { label: 'Maternity Wear', value: 'maternity' },
            { label: 'Feeding Tops', value: 'feeding' },
            { label: 'Nighties', value: 'nighties' },
            { label: 'Leggings', value: 'leggings' },
            { label: 'T-Shirts', value: 't-shirts' },
        ]
    }
];

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

    // Default expanded items: active category or just the first one if nothing selected
    // Improved UX: Don't overwhelm user with all expanded
    const [expandedItems, setExpandedItems] = useState<string[]>(
        activeCategory ? [activeCategory] : []
    );

    // Sync expanded state when URL changes (optional, but good for deep linking)
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

        // If switching category, we usually reset tags? 
        // Enterprise pattern: Yes, tags are usually context-specific.
        if (activeCategory !== categoryId) {
            params.set('category', categoryId);
            params.delete('tag'); // Reset tags
        } else {
            // Clicking active category again? Maybe just clear? 
            // Let's keep it simple: Stay active.
        }

        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    // Toggle specific tag
    const handleTagToggle = (categoryId: string, tagValue: string) => {
        const params = new URLSearchParams(searchParams.toString());

        // Use Set for easy add/remove
        const currentTags = new Set(params.getAll('tag'));

        if (currentTags.has(tagValue)) {
            // REMOVE
            currentTags.delete(tagValue);
            // Rebuild params
            params.delete('tag');
            currentTags.forEach(t => params.append('tag', t));
        } else {
            // ADD
            // If we are in a different category, we should switch category first?
            // UX Decision: If user clicks a tag in "Boys", they expect to see Boys products.
            if (activeCategory !== categoryId) {
                params.set('category', categoryId);
                params.delete('tag'); // Clear old category tags
                params.append('tag', tagValue); // Add new tag
            } else {
                params.append('tag', tagValue);
            }
        }

        router.push(`/products?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        router.push('/products', { scroll: false });
        onMobileClose?.();
        setExpandedItems([]); // Optionally collapse all
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
                    // Base Layout
                    "bg-white flex flex-col",
                    // Mobile: Fixed Drawer
                    "fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl transition-transform duration-300 ease-out",
                    mobileOpen ? "translate-x-0" : "-translate-x-full",
                    // Desktop: Sticky sidebar
                    // Crucial: 'h-fit' or 'max-h' to avoiding stretching. 
                    // 'sticky top-24' keeps it in view. 
                    // 'rounded-xl' and 'border' for the card look.
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

                    {/* Clear All Action */}
                    {(activeCategory || activeTags.length > 0) && (
                        <button
                            onClick={clearFilters}
                            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-wider"
                        >
                            Clear All
                        </button>
                    )}

                    {/* Mobile Close Button */}
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
                        {FILTER_CATEGORIES.map((category) => {
                            const isCategoryActive = activeCategory === category.id;

                            return (
                                <Accordion.Item
                                    key={category.id}
                                    value={category.id}
                                    className="border-b border-transparent last:border-0"
                                >
                                    <Accordion.Header>
                                        <Accordion.Trigger
                                            className={cn(
                                                "flex items-center justify-between w-full px-3 py-2.5 rounded-lg group transition-all text-left",
                                                "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                                                isCategoryActive ? "bg-primary/5" : "bg-transparent"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                isCategoryActive ? "text-primary font-semibold" : "text-gray-700 group-hover:text-gray-900"
                                            )}>
                                                {category.label}
                                            </span>
                                            <ChevronDown
                                                className={cn(
                                                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                                                    "group-data-[state=open]:rotate-180",
                                                    isCategoryActive && "text-primary/60"
                                                )}
                                            />
                                        </Accordion.Trigger>
                                    </Accordion.Header>

                                    <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                        <div className="px-3 pb-3 pt-1 space-y-1">

                                            {/* Subcategories / Tags */}
                                            {category.subcategories.map((sub) => {
                                                const isTagSelected = activeTags.includes(sub.value);
                                                // A tag is visibly checked only if the category matches and the tag is in params
                                                // Actually, if tags are globally unique or we strictly handle category switching, 
                                                // we can just check 'isTagSelected'. 
                                                // But visually, it's nice to own the concept of "Active Category".
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
                                                        {/* Custom Checkbox */}
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
