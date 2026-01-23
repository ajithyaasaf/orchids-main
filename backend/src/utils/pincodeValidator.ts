/**
 * Pincode Validation Utility
 * 
 * Provides comprehensive validation for Indian pincodes and international blocking.
 * Designed for extensibility and maintainability.
 * 
 * @module pincodeValidator
 * @version 1.0.0
 */

/**
 * Indian Pincode Ranges
 * Pin codes in India are 6 digits and follow a geographic distribution:
 * - First digit: Regional area (1-9)
 * - First two digits: Sub-region/state
 * 
 * Reference: https://en.wikipedia.org/wiki/Postal_Index_Number
 */
export const INDIAN_PINCODE_RANGES = {
    // North India
    DELHI: { start: 110000, end: 110099 },
    HARYANA: { start: 121000, end: 136999 },
    HIMACHAL_PRADESH: { start: 171000, end: 177999 },
    JAMMU_KASHMIR: { start: 180000, end: 194999 },
    PUNJAB: { start: 140000, end: 160099 },
    RAJASTHAN: { start: 301000, end: 345999 },
    UTTAR_PRADESH: { start: 201000, end: 285999 },
    UTTARAKHAND: { start: 244000, end: 263999 },

    // East India
    BIHAR: { start: 800000, end: 855999 },
    JHARKHAND: { start: 813000, end: 835999 },
    ODISHA: { start: 751000, end: 770999 },
    WEST_BENGAL: { start: 700000, end: 743999 },

    // West India
    GOA: { start: 403000, end: 403999 },
    GUJARAT: { start: 360000, end: 396999 },
    MAHARASHTRA: { start: 400000, end: 445999 },

    // South India
    ANDHRA_PRADESH: { start: 515000, end: 535999 },
    KARNATAKA: { start: 560000, end: 591999 },
    KERALA: { start: 670000, end: 695999 },
    TAMIL_NADU: { start: 600000, end: 643999 },
    TELANGANA: { start: 500000, end: 509999 },
    PUDUCHERRY: { start: 605000, end: 609999 },

    // Central India
    CHHATTISGARH: { start: 490000, end: 497999 },
    MADHYA_PRADESH: { start: 450000, end: 488999 },

    // Northeast India
    ARUNACHAL_PRADESH: { start: 790000, end: 792999 },
    ASSAM: { start: 781000, end: 788999 },
    MANIPUR: { start: 795000, end: 795999 },
    MEGHALAYA: { start: 793000, end: 794999 },
    MIZORAM: { start: 796000, end: 796999 },
    NAGALAND: { start: 797000, end: 798999 },
    SIKKIM: { start: 737000, end: 737999 },
    TRIPURA: { start: 799000, end: 799999 },

    // Union Territories
    ANDAMAN_NICOBAR: { start: 744000, end: 744999 },
    CHANDIGARH: { start: 160000, end: 160099 },
    DADRA_NAGAR_HAVELI: { start: 396000, end: 396999 },
    DAMAN_DIU: { start: 396000, end: 396999 },
    LAKSHADWEEP: { start: 682000, end: 682999 },
} as const;

/**
 * Validation result interface
 */
export interface PincodeValidationResult {
    isValid: boolean;
    isIndian: boolean;
    message: string;
    region?: 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast';
}

/**
 * Validate if a pincode is a valid Indian pincode
 * 
 * @param pincode - The pincode to validate (string or number)
 * @returns Validation result with detailed info
 * 
 * @example
 * ```typescript
 * const result = validateIndianPincode('600001');
 * if (result.isValid) {
 *   console.log('Valid Indian pincode from', result.region);
 * }
 * ```
 */
export function validateIndianPincode(pincode: string | number): PincodeValidationResult {
    // Convert to string and trim
    const pincodeStr = String(pincode).trim();

    // Basic format validation
    if (!/^\d{6}$/.test(pincodeStr)) {
        return {
            isValid: false,
            isIndian: false,
            message: 'Invalid pincode format. Indian pincodes must be exactly 6 digits.',
        };
    }

    // Convert to number for range checking
    const pincodeNum = parseInt(pincodeStr, 10);

    // Check against known Indian pincode ranges
    for (const [state, range] of Object.entries(INDIAN_PINCODE_RANGES)) {
        if (pincodeNum >= range.start && pincodeNum <= range.end) {
            const region = getRegionFromPincode(pincodeNum);
            return {
                isValid: true,
                isIndian: true,
                message: 'Valid Indian pincode',
                region,
            };
        }
    }

    // Pincode format is correct but not in known ranges
    // Could be a new pincode or invalid
    return {
        isValid: false,
        isIndian: false,
        message: 'We currently deliver within India only. This pincode appears to be outside our service area.',
    };
}

/**
 * Determine geographic region from pincode
 * 
 * @param pincode - Numeric pincode
 * @returns Geographic region
 */
function getRegionFromPincode(pincode: number): 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast' {
    // South India
    if (
        (pincode >= 500000 && pincode <= 509999) || // Telangana
        (pincode >= 515000 && pincode <= 535999) || // Andhra Pradesh
        (pincode >= 560000 && pincode <= 591999) || // Karnataka
        (pincode >= 600000 && pincode <= 643999) || // Tamil Nadu
        (pincode >= 670000 && pincode <= 695999) || // Kerala
        (pincode >= 605000 && pincode <= 609999)    // Puducherry
    ) {
        return 'south';
    }

    // North India
    if (
        (pincode >= 110000 && pincode <= 110099) || // Delhi
        (pincode >= 121000 && pincode <= 136999) || // Haryana
        (pincode >= 140000 && pincode <= 160099) || // Punjab/Chandigarh
        (pincode >= 171000 && pincode <= 177999) || // Himachal Pradesh
        (pincode >= 180000 && pincode <= 194999) || // J&K
        (pincode >= 201000 && pincode <= 285999) || // UP
        (pincode >= 244000 && pincode <= 263999) || // Uttarakhand
        (pincode >= 301000 && pincode <= 345999)    // Rajasthan
    ) {
        return 'north';
    }

    // East India
    if (
        (pincode >= 700000 && pincode <= 743999) || // West Bengal
        (pincode >= 751000 && pincode <= 770999) || // Odisha
        (pincode >= 800000 && pincode <= 855999) || // Bihar
        (pincode >= 813000 && pincode <= 835999)    // Jharkhand
    ) {
        return 'east';
    }

    // West India
    if (
        (pincode >= 360000 && pincode <= 396999) || // Gujarat/Daman/Dadra
        (pincode >= 400000 && pincode <= 445999) || // Maharashtra
        (pincode >= 403000 && pincode <= 403999)    // Goa
    ) {
        return 'west';
    }

    // Central India
    if (
        (pincode >= 450000 && pincode <= 488999) || // Madhya Pradesh
        (pincode >= 490000 && pincode <= 497999)    // Chhattisgarh
    ) {
        return 'central';
    }

    // Northeast India
    if (
        (pincode >= 737000 && pincode <= 737999) || // Sikkim
        (pincode >= 781000 && pincode <= 788999) || // Assam
        (pincode >= 790000 && pincode <= 792999) || // Arunachal Pradesh
        (pincode >= 793000 && pincode <= 794999) || // Meghalaya
        (pincode >= 795000 && pincode <= 795999) || // Manipur
        (pincode >= 796000 && pincode <= 796999) || // Mizoram
        (pincode >= 797000 && pincode <= 798999) || // Nagaland
        (pincode >= 799000 && pincode <= 799999)    // Tripura
    ) {
        return 'northeast';
    }

    // Default (should rarely reach here if ranges are complete)
    return 'north';
}

/**
 * Check if pincode is from South India (for FREE shipping zone)
 * 
 * @param pincode - The pincode to check
 * @returns True if pincode is from South India
 * 
 * @example
 * ```typescript
 * if (isSouthIndiaPincode('600001')) {
 *   shippingCost = 0; // FREE
 * }
 * ```
 */
export function isSouthIndiaPincode(pincode: string | number): boolean {
    const validation = validateIndianPincode(pincode);
    return validation.isValid && validation.region === 'south';
}

/**
 * Get user-friendly error message for invalid pincodes
 * 
 * @param pincode - The invalid pincode
 * @returns Human-readable error message
 */
export function getInvalidPincodeMessage(pincode: string): string {
    const pincodeStr = String(pincode).trim();

    // Empty
    if (!pincodeStr) {
        return 'Please enter a pincode to calculate shipping';
    }

    // Not 6 digits
    if (!/^\d{6}$/.test(pincodeStr)) {
        return 'Indian pincodes must be exactly 6 digits';
    }

    // International/invalid
    return 'We currently deliver within India only. Please enter a valid Indian pincode.';
}

/**
 * Sanitize pincode input (remove spaces, non-digits)
 * 
 * @param pincode - Raw pincode input
 * @returns Sanitized pincode
 */
export function sanitizePincode(pincode: string): string {
    return String(pincode).replace(/\D/g, '').trim();
}
