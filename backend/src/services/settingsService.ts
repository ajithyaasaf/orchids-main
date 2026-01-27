import { collections } from '../config/firebase';
import { Settings } from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';

const SETTINGS_DOC_ID = 'global';

/**
 * Get global settings
 */
export const getSettings = async (): Promise<Settings> => {
    try {
        const doc = await collections.settings.doc(SETTINGS_DOC_ID).get();

        if (!doc.exists) {
            // Initialize with defaults for greenfield deployment
            const defaults: Settings = {
                // Wholesale GST configuration
                gstRate: 0.18,
                gstEnabled: true,
                businessName: 'Wholesale Orchids',
                businessAddress: '',
                gstin: '',
                // Legacy fields (kept for compatibility)
                shippingCharge: 0,
                freeShippingAbove: 0,
                codEnabled: false,
                returnPolicyDays: 7,
            };

            await collections.settings.doc(SETTINGS_DOC_ID).set(defaults);
            return defaults;
        }

        return doc.data() as Settings;
    } catch (error) {
        console.error('Error fetching settings:', error);
        throw new AppError('Failed to fetch settings', 500);
    }
};

/**
 * Update global settings
 */
export const updateSettings = async (
    updates: Partial<Settings>
): Promise<Settings> => {
    try {
        await collections.settings.doc(SETTINGS_DOC_ID).set(updates, { merge: true });

        return await getSettings();
    } catch (error) {
        console.error('Error updating settings:', error);
        throw new AppError('Failed to update settings', 500);
    }
};

/**
 * Calculate shipping charge based on cart total
 */
export const calculateShipping = async (cartTotal: number): Promise<number> => {
    try {
        const settings = await getSettings();

        if (cartTotal >= settings.freeShippingAbove) {
            return 0;
        }

        return settings.shippingCharge;
    } catch (error) {
        console.error('Error calculating shipping:', error);
        return 50; // Default shipping charge
    }
};
