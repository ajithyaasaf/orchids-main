/**
 * Shipping Configuration
 * 
 * Defines constants for the Hybrid Bundled + Location-Based Shipping Strategy
 */

// Standard shipping buffer added to all product base prices
export const STANDARD_SHIPPING_BUFFER = 79;

// Shipping rates by tier
export const SHIPPING_RATES = {
    TIER_1: {
        SURCHARGE: 0,
        LABEL: "FREE Delivery",
        ESTIMATED_DAYS: "3-5 days"
    },
    TIER_2: {
        SURCHARGE: 60,
        LABEL: "Long Distance Shipping Fee",
        ESTIMATED_DAYS: "5-7 days"
    }
} as const;

/**
 * South India Pincode Prefixes (Tier 1 - Free Delivery Zone)
 * 
 * Comprehensive list covering:
 * - Tamil Nadu (38 districts)
 * - Karnataka (31 districts)
 * - Kerala (14 districts)
 * - Andhra Pradesh (26 districts)
 * - Telangana (33 districts)
 * - Puducherry
 * 
 * Total: ~180 prefixes
 */
export const TIER_1_PREFIXES = [
    // === Tamil Nadu ===
    // Chennai Region
    "600", "601", "602", "603", "604", "605", "606", "607",

    // Central Tamil Nadu
    "608", "609", "610", "611", "612", "613", "614", "615",

    // Madurai Region
    "620", "621", "622", "623", "624", "625", "626", "627", "628", "629",

    // Trichy/Thanjavur Region
    "630", "631", "632", "633", "634", "635", "636", "637", "638", "639",

    // Coimbatore Region
    "641", "642", "643", "644", "645", "646", "647", "648",

    // === Karnataka ===
    // Bangalore Region
    "560", "561", "562", "563", "564", "565", "566",

    // Mysore/Mangalore Region
    "570", "571", "572", "573", "574", "575", "576", "577", "578", "579",

    // North Karnataka
    "580", "581", "582", "583", "584", "585", "586", "587", "588", "589",

    // Belgaum Region
    "590", "591", "592",

    // === Kerala ===
    // Kozhikode/Kannur Region
    "670", "671", "672", "673", "674", "675",

    // Palakkad/Thrissur Region
    "676", "677", "678", "679",

    // Kochi/Ernakulam Region
    "680", "681", "682", "683", "684", "685", "686",

    // Thiruvananthapuram Region
    "688", "689", "690", "691", "692", "693", "695", "696", "697",

    // === Andhra Pradesh ===
    // Hyderabad Region (overlaps with Telangana)
    "500", "501", "502", "503", "504", "505", "506", "507", "508", "509",

    // Tirupati/Chittoor Region
    "515", "516", "517", "518",

    // Vijayawada Region
    "520", "521", "522", "523", "524", "525", "526",

    // Visakhapatnam Region
    "530", "531", "532", "533", "534", "535",

    // === Telangana ===
    // (Some overlap with AP - 500-509 range)
    // Additional Telangana regions are already covered by 500-509

    // === Puducherry ===
    "605", "607", "609", "673"
];

export type ShippingTier = 'TIER_1' | 'TIER_2';

export interface ShippingRate {
    SURCHARGE: number;
    LABEL: string;
    ESTIMATED_DAYS: string;
}
