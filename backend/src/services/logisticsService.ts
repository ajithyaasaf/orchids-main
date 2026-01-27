import { Address } from '@tntrends/shared';

/**
 * Logistics Service
 * Lightweight address validation for wholesale platform
 * External freight and shipping handled offline
 */

export class LogisticsService {
    /**
     * Validate delivery address
     * Basic validation for wholesale orders
     */
    validateAddress(address: Address): { valid: boolean; message?: string } {
        if (!address.name || address.name.trim().length < 2) {
            return { valid: false, message: 'Name is required (minimum 2 characters)' };
        }

        if (!address.phone || !/^\d{10}$/.test(address.phone.replace(/[\s-]/g, ''))) {
            return { valid: false, message: 'Valid 10-digit phone number is required' };
        }

        if (!address.addressLine1 || address.addressLine1.trim().length < 5) {
            return { valid: false, message: 'Address line 1 is required (minimum 5 characters)' };
        }

        if (!address.city || address.city.trim().length < 2) {
            return { valid: false, message: 'City is required' };
        }

        if (!address.state || address.state.trim().length < 2) {
            return { valid: false, message: 'State is required' };
        }

        if (!address.pincode || !/^\d{6}$/.test(address.pincode)) {
            return { valid: false, message: 'Valid 6-digit pincode is required' };
        }

        return { valid: true };
    }

    /**
     * Format address for invoice/packing slip
     */
    formatAddressForInvoice(address: Address): string {
        const parts = [
            address.name,
            address.addressLine1,
            address.addressLine2 || '',
            `${address.city}, ${address.state} - ${address.pincode}`,
            address.country || 'India',
            `Phone: ${address.phone}`,
        ];

        return parts.filter(Boolean).join('\n');
    }

    /**
     * Future: Calculate freight charges based on weight/volume
     * For now, freight is handled externally
     */
    calculateFreight(totalBundles: number, pincode: string): number {
        return 0; // Wholesale freight handled offline
    }
}

export const logisticsService = new LogisticsService();
