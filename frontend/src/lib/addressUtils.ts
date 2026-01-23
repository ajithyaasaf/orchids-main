import { Address, SavedAddress, AddressError } from '@tntrends/shared';

/**
 * Address Utilities
 * 
 * Enterprise-grade address management utilities with:
 * - Normalization for duplicate detection
 * - Client-side validation (mirrors backend)
 * - Sanitization for XSS prevention
 * - Display formatting (Title Case)
 */

/**
 * Normalize address for comparison
 * Converts to lowercase, trims, removes extra spaces and special chars
 * Used for duplicate detection
 * 
 * @param address - Address to normalize
 * @returns Normalized string key for comparison
 */
export function normalizeAddress(address: Address | SavedAddress): string {
    const key = `${address.pincode}|${address.addressLine1}|${address.city}`;
    return key
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')  // Multiple spaces to single space
        .replace(/[^a-z0-9\s,\-]/g, ''); // Remove special chars except comma, dash
}

/**
 * Check if two addresses are duplicates
 * 
 * @param newAddress - New address to check
 * @param existingAddresses - Array of existing saved addresses
 * @returns True if duplicate found
 */
export function isDuplicateAddress(
    newAddress: Address,
    existingAddresses: SavedAddress[]
): SavedAddress | null {
    const normalizedNew = normalizeAddress(newAddress);

    const duplicate = existingAddresses.find(
        addr => normalizeAddress(addr) === normalizedNew
    );

    return duplicate || null;
}

/**
 * Validate address fields (client-side mirror of backend validation)
 * 
 * @param address - Address to validate
 * @returns AddressError if validation fails, null if valid
 */
export function validateAddress(address: Address): AddressError | null {
    // Phone validation (Indian mobile: 10 digits, starts with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(address.phone)) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'Phone must be 10 digits starting with 6-9',
            field: 'phone'
        };
    }

    // Pincode validation (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(address.pincode)) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'Pincode must be exactly 6 digits',
            field: 'pincode'
        };
    }

    // Name validation (2-100 characters, letters and spaces only)
    const nameRegex = /^[a-zA-Z\s]{2,100}$/;
    if (!nameRegex.test(address.name)) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'Name must be 2-100 characters, letters and spaces only',
            field: 'name'
        };
    }

    // Required fields check
    if (!address.addressLine1 || address.addressLine1.trim().length === 0) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'Address line 1 is required',
            field: 'addressLine1'
        };
    }

    if (!address.city || address.city.trim().length === 0) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'City is required',
            field: 'city'
        };
    }

    if (!address.state || address.state.trim().length === 0) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'State is required',
            field: 'state'
        };
    }

    // Length validations
    if (address.addressLine1.length > 200) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'Address line 1 cannot exceed 200 characters',
            field: 'addressLine1'
        };
    }

    if (address.addressLine2 && address.addressLine2.length > 200) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'Address line 2 cannot exceed 200 characters',
            field: 'addressLine2'
        };
    }

    if (address.city.length > 100) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'City must not exceed 100 characters',
            field: 'city'
        };
    }

    if (address.state.length > 100) {
        return {
            type: 'VALIDATION_FAILED',
            message: 'State must not exceed 100 characters',
            field: 'state'
        };
    }

    return null;
}

/**
 * Sanitize address fields (remove HTML tags, trim whitespace)
 * Prevents XSS attacks
 * 
 * @param address - Address to sanitize
 * @returns Sanitized address
 */
export function sanitizeAddress(address: Address): Address {
    return {
        ...address,
        name: address.name.replace(/[<>]/g, '').trim(),
        addressLine1: address.addressLine1.replace(/[<>]/g, '').trim(),
        addressLine2: address.addressLine2?.replace(/[<>]/g, '').trim() || '',
        city: address.city.replace(/[<>]/g, '').trim(),
        state: address.state.replace(/[<>]/g, '').trim(),
        phone: address.phone.trim(),
        pincode: address.pincode.trim(),
        country: address.country.trim(),
    };
}

/**
 * Title case for display (proper capitalization)
 * Example: "new york" → "New York"
 * 
 * @param str - String to convert
 * @returns Title-cased string
 */
export function titleCase(str: string): string {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Format address for display (single line)
 * 
 * @param address - Address to format
 * @returns Formatted single-line address string
 */
export function formatAddressOneLine(address: Address | SavedAddress): string {
    const parts = [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.pincode
    ].filter(Boolean);

    return parts.join(', ');
}

/**
 * Format time since last used
 * Example: "2 days ago", "3 weeks ago"
 * 
 * @param lastUsedAt - Date when address was last used
 * @returns Human-readable time string
 */
export function formatLastUsed(lastUsedAt?: Date): string {
    if (!lastUsedAt) return 'Never used';

    const now = new Date();
    const diffMs = now.getTime() - new Date(lastUsedAt).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Used today';
    if (diffDays === 1) return 'Used yesterday';
    if (diffDays < 7) return `Used ${diffDays} days ago`;
    if (diffDays < 30) return `Used ${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `Used ${Math.floor(diffDays / 30)} months ago`;
    return `Used ${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get address label with default indicator
 * Example: "Home (Default)", "Office"
 * 
 * @param address - SavedAddress with label and isDefault
 * @returns Formatted label string
 */
export function getAddressLabel(address: SavedAddress): string {
    return address.isDefault ? `${address.label} (Default)` : address.label;
}
