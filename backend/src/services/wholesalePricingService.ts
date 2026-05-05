import { WholesaleProduct, WholesaleBundleItem } from '@orchids/shared';
import { getSettings, calculateShipping } from './settingsService';

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
    const pricePerPiece = product.bundlePrice / product.bundleQty;
    const gstRate = settings.gstEnabled ? (pricePerPiece > 2500 ? 0.18 : 0.05) : 0;

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
 * Calculate total order amount with optional admin discount and coupons
 */
export const calculateOrderTotal = async (
    items: WholesaleBundleItem[],
    adminDiscount: number = 0,
    couponDiscount: number = 0
): Promise<{
    subtotal: number;
    gstRate: number;
    gst: number;
    shipping: number;
    adminDiscount: number;
    couponDiscount: number;
    totalAmount: number;
}> => {
    const settings = await getSettings();
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    // ── Dynamic GST Calculation (Best Practice for Apparel) ──────────────
    // Law: Pieces <= ₹2500 = 5% GST | Pieces > ₹2500 = 18% GST
    let totalGst = 0;
    if (settings.gstEnabled) {
        for (const item of items) {
            const pricePerPiece = item.pricePerBundle / item.bundleQty;
            const itemGstRate = pricePerPiece > 2500 ? 0.18 : 0.05;
            totalGst += item.lineTotal * itemGstRate;
        }
    }

    // Calculate average GST rate for display purposes
    const gstRate = subtotal > 0 ? totalGst / subtotal : 0.05;

    // Calculate shipping based on subtotal
    const shipping = await calculateShipping(subtotal);

    const totalAmount = subtotal + totalGst + shipping - adminDiscount - couponDiscount;

    return {
        subtotal,
        gstRate,
        gst: totalGst,
        shipping,
        adminDiscount,
        couponDiscount,
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
