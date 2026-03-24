export interface CategoryTag {
    label: string;
    value: string;
}

export interface CategoryDefinition {
    id: string;
    label: string;
    subcategories: CategoryTag[];
}

export const PRODUCT_CATEGORIES: CategoryDefinition[] = [
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
