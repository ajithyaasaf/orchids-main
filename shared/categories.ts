export interface CategoryTag {
    label: string;
    value: string;
}

// ============================================================================
// DYNAMIC SIZING SYSTEM
// Determines which size labels appear in the bundle composition grid
// based on the selected product category.
// ============================================================================

/**
 * Represents the dimension along which a bundle is split.
 * - 'standard'    : Adult sizes (S, M, L, XL, 2XL)
 * - 'kids_age'    : School-age children (2-3Y … 9-10Y)
 * - 'newborn_age' : Infants          (0-3M … 9-12M)
 * - 'unisex'      : Broad unisex adult sizes (S, M, L, XL)
 */
export type SizingType = 'standard' | 'kids_age' | 'newborn_age' | 'unisex';

/** A preset is a ready-made bundle composition the admin can apply with one click. */
export interface SizePreset {
    label: string;                       // e.g. "Even Split"
    composition: Record<string, number>; // e.g. { '2-3Y': 5, '3-4Y': 5, '4-5Y': 5, '5-6Y': 5 }
}

/** Full configuration for a sizing dimension. */
export interface SizeGroup {
    type: SizingType;
    dimensionLabel: string;   // Shown above the grid, e.g. "Age Range" or "Clothing Size"
    sizes: string[];          // Ordered list of keys used in bundleComposition
    presets: SizePreset[];    // Quick-fill presets available for this group
}

/**
 * Central registry of all size groups.
 * To add a new sizing type, add an entry here and reference it in PRODUCT_CATEGORIES.
 */
export const SIZE_GROUPS: Record<SizingType, SizeGroup> = {
    standard: {
        type: 'standard',
        dimensionLabel: 'Clothing Size',
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        presets: [
            { label: '8-7-5 Split',   composition: { M: 8,  L: 7,  XL: 5 } },
            { label: '10-10 Split',   composition: { M: 10, L: 10 } },
            { label: '6-7-7 Split',   composition: { S: 6,  M: 7,  L: 7  } },
            { label: '5-5-5-5 Split', composition: { S: 5,  M: 5,  L: 5,  XL: 5 } },
        ],
    },
    kids_age: {
        type: 'kids_age',
        dimensionLabel: 'Age Range',
        sizes: ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y'],
        presets: [
            {
                label: '4-age Even (2-5Y)',
                composition: { '2-3Y': 5, '3-4Y': 5, '4-5Y': 5, '5-6Y': 5 },
            },
            {
                label: '4-age Even (6-9Y)',
                composition: { '6-7Y': 5, '7-8Y': 5, '8-9Y': 5, '9-10Y': 5 },
            },
            {
                label: '6-age Even (2-7Y)',
                composition: { '2-3Y': 4, '3-4Y': 4, '4-5Y': 4, '5-6Y': 4, '6-7Y': 4, '7-8Y': 4 },
            },
            {
                label: '8-age Even (2-10Y)',
                composition: { '2-3Y': 2, '3-4Y': 3, '4-5Y': 3, '5-6Y': 3, '6-7Y': 3, '7-8Y': 3, '8-9Y': 2, '9-10Y': 1 },
            },
        ],
    },
    newborn_age: {
        type: 'newborn_age',
        dimensionLabel: 'Age (Months)',
        sizes: ['0-3M', '3-6M', '6-9M', '9-12M'],
        presets: [
            { label: 'Even 4-split', composition: { '0-3M': 5, '3-6M': 5, '6-9M': 5, '9-12M': 5 } },
            { label: 'Growth Curve', composition: { '0-3M': 3, '3-6M': 6, '6-9M': 7, '9-12M': 4 } },
        ],
    },
    unisex: {
        type: 'unisex',
        dimensionLabel: 'Clothing Size',
        sizes: ['S', 'M', 'L', 'XL'],
        presets: [
            { label: '5-5-5-5 Split', composition: { S: 5, M: 5, L: 5, XL: 5 } },
            { label: '6-8-6 Split',   composition: { S: 6, M: 8, L: 6 } },
        ],
    },
};

/**
 * Returns the SizeGroup for a given category ID.
 * Falls back to 'standard' if the category is unknown.
 */
export function getSizeGroupForCategory(categoryId: string): SizeGroup {
    const category = PRODUCT_CATEGORIES.find(c => c.id === categoryId);
    const sizingType = category?.sizingType ?? 'standard';
    return SIZE_GROUPS[sizingType];
}

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export interface CategoryDefinition {
    id: string;
    label: string;
    sizingType: SizingType;   // Determines which SIZE_GROUP is used in the form
    subcategories: CategoryTag[];
}

export const PRODUCT_CATEGORIES: CategoryDefinition[] = [
    {
        id: 'newborn',
        label: 'Newborn Collection',
        sizingType: 'newborn_age',
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
            { label: 'Gloves', value: 'gloves' },
            { label: 'Burp Cloth', value: 'burp-cloth' },
            { label: 'Button Jabla', value: 'button-jabla' },
            { label: 'Rope Jabla', value: 'rope-jabla' },
            { label: 'Half Sleeve Jabla Set', value: 'half-sleeve-jabla-set' },
            { label: 'Full Sleeve Jabla Set', value: 'full-sleeve-jabla-set' },
            { label: 'Sleeveless Jabla Set', value: 'sleeveless-jabla-set' },
            { label: 'Rope Frocks', value: 'rope-frocks' },
            { label: 'Front Open Frocks', value: 'front-open-frocks' },
            { label: 'Muslin Front Open Sets', value: 'muslin-front-open-sets' },
            { label: 'Muslin Frocks', value: 'muslin-frocks' },
            { label: 'Muslin Blankets', value: 'muslin-blankets' },
            { label: 'Muslin Swaddle', value: 'muslin-swaddle' },
            { label: 'Padded Undies', value: 'padded-undies' },
            { label: 'Hooded Towel', value: 'hooded-towel' },
        ]
    },
    {
        id: 'girls',
        label: 'Girls Wear',
        sizingType: 'kids_age',
        subcategories: [
            { label: 'Frocks & Dresses', value: 'frocks' },
            { label: 'T-Shirts & Tops', value: 't-shirts' },
            { label: 'Sets & Combos', value: 'sets' },
            { label: 'Leggings', value: 'leggings' },
            { label: 'Nightwear', value: 'nightwear' },
            { label: 'Innerwear', value: 'innerwear' },
            { label: 'Skirts', value: 'skirts' },
            { label: 'Pants', value: 'pants' },
            { label: 'Tights', value: 'tights' },
            { label: 'Palazzo Pants', value: 'palazzo-pants' },
            { label: 'Slips', value: 'slips' },
            { label: 'Shorts', value: 'shorts' },
            { label: '3/4 Pants', value: '3-4-pants' },
        ]
    },
    {
        id: 'boys',
        label: 'Boys Wear',
        sizingType: 'kids_age',
        subcategories: [
            { label: 'T-Shirts', value: 't-shirts' },
            { label: 'Shirts', value: 'shirts' },
            { label: 'Sets', value: 'sets' },
            { label: 'Shorts', value: 'shorts' },
            { label: 'Track Pants', value: 'track-pants' },
            { label: 'Jeans', value: 'jeans' },
            { label: 'Innerwear', value: 'innerwear' },
            { label: 'Pants', value: 'pants' },
            { label: '3/4 Pants', value: '3-4-pants' },
            { label: 'Loobknit Rib Pants', value: 'loobknit-rib-pants' },
            { label: 'Fine Pants', value: 'fine-pants' },
            { label: 'Trunks', value: 'trunks' },
            { label: 'Half Sleeve Cord Sets', value: 'half-sleeve-cord-sets' },
            { label: 'Collared Cordset', value: 'collared-cordset' },
            { label: 'Full Sleeve Co-ords', value: 'full-sleeve-co-ords' },
            { label: 'Sleeveless Co-ords', value: 'sleeveless-co-ords' },
        ]
    },
    {
        id: 'women',
        label: "Women's Apparel",
        sizingType: 'standard',
        subcategories: [
            { label: 'Maternity Wear', value: 'maternity' },
            { label: 'Feeding Tops', value: 'feeding' },
            { label: 'Nighties', value: 'nighties' },
            { label: 'Leggings', value: 'leggings' },
            { label: 'T-Shirts', value: 't-shirts' },
            { label: 'Full Pants', value: 'full-pants' },
            { label: 'Shorts', value: 'shorts' },
            { label: '3/4 Pants', value: '3-4-pants' },
            { label: 'Long Polos', value: 'long-polos' },
            { label: 'Feeding Dresses', value: 'feeding-dresses' },
            { label: 'Dresses', value: 'dresses' },
            { label: 'Underwear', value: 'underwear' },
            { label: 'Tights', value: 'tights' },
        ]
    },
    {
        id: 'mens',
        label: "Men's Apparel",
        sizingType: 'standard',
        subcategories: [
            { label: 'T-Shirts', value: 't-shirts' },
            { label: 'Shorts', value: 'shorts' },
            { label: 'Full Pants', value: 'full-pants' },
            { label: 'Joggers', value: 'joggers' },
            { label: 'Underwear', value: 'underwear' },
            { label: 'Trunks', value: 'trunks' },
        ]
    }
];

/**
 * Utility to map a legacy category string (e.g., "Girls - T-Shirts") to the new structured format.
 */
export const migrateLegacyCategory = (legacyString: string): { category: string, tags: string[] } | null => {
    // E.g. "Girls - T-Shirts" -> ["Girls", "T-Shirts"]
    const parts = legacyString.split(' - ').map(s => s.trim());
    if (parts.length < 1) return null;

    const rootName = parts[0].toLowerCase();

    // Find the matching root category ID
    // Some legacy roots are "Newborn", "Girls", "Boys", "Women"
    const rootCategory = PRODUCT_CATEGORIES.find(c =>
        c.label.toLowerCase().includes(rootName) || rootName.includes(c.id) || c.id === rootName
    );

    if (!rootCategory) {
        return null; // Cannot map root category
    }

    const tags: string[] = [];

    if (parts.length > 1) {
        const subName = parts[1].toLowerCase();
        // Try to find matching subcategory

        const matchedSub = rootCategory.subcategories.find(sub =>
            sub.label.toLowerCase().includes(subName) ||
            subName.includes(sub.label.toLowerCase()) ||
            subName.includes(sub.value.replace(/-/g, ' ')) ||
            sub.value.replace(/-/g, ' ').includes(subName)
        );

        if (matchedSub) {
            tags.push(matchedSub.value);
        } else {
            // Fallback: create a tag from the legacy sub-string if we couldn't match exactly
            tags.push(subName.replace(/\s+/g, '-'));
        }
    }

    return {
        category: rootCategory.id,
        tags
    };
};
