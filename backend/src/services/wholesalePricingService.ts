import { WholesaleProduct, WholesaleBundleItem } from '@tntrends/shared';
import { getSettings } from './settingsService';

/**
 * Wholesale Pricing Service
 * Clean, simple pricing calculations for B2B bundle-based sales
 */

/**
 * Calculate pricing for a single bundle item
 * GST rate is fetched from settings (configurable)
 */
export const calculateBundlePrice = async (
    product: WholesaleProduct,
    bundlesOrdered: number
): Promise<{
    subtotal: number;
    gstRate: number;
    gst: number;
    total: number;
}> => {
    const settings = await getSettings();
    const gstRate = settings.gstEnabled ? settings.gstRate : 0;

    const subtotal = product.bundlePrice * bundlesOrdered;
    const gst = subtotal * gstRate;

    return {
        subtotal,
        gstRate,
        gst,
        total: subtotal + gst,
    };
};

/**
 * Calculate total order amount with optional admin discount
 */
export const calculateOrderTotal = async (
    items: WholesaleBundleItem[],
    adminDiscount: number = 0
): Promise<{
    subtotal: number;
    gstRate: number;
    gst: number;
    adminDiscount: number;
    totalAmount: number;
}> => {
    const settings = await getSettings();
    const gstRate = settings.gstEnabled ? settings.gstRate : 0;

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const gst = subtotal * gstRate;
    const totalAmount = subtotal + gst - adminDiscount;

    return {
        subtotal,
        gstRate,
        gst,
        adminDiscount,
        totalAmount: Math.max(0, totalAmount),
    };
};

/**
 * Validate bundle stock availability
 */
export const validateBundleStock = (
    product: WholesaleProduct,
    bundlesRequested: number
): { valid: boolean; message?: string } => {
    if (bundlesRequested <= 0) {
        return { valid: false, message: 'Quantity must be at least 1 bundle' };
    }

    if (bundlesRequested > product.availableBundles) {
        return {
            valid: false,
            message: `Only ${product.availableBundles} bundles available (${product.availableBundles * product.bundleQty} pieces)`,
        };
    }

    return { valid: true };
};
