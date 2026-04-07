// User and Authentication Types
export type UserRole = 'superadmin' | 'admin' | 'customer';

// Address Types (defined before User to avoid forward reference)
export interface Address {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
}

// Saved Address (extends Address with metadata)
export interface SavedAddress extends Address {
    id: string;                    // UUID generated client-side
    label: string;                 // "Home", "Office", or custom text
    isDefault: boolean;            // Only one can be true per user
    createdAt: Date;
    lastUsedAt?: Date;             // Updated when used in an order
}

// Address Error Types for validation and user feedback
export type AddressErrorType =
    | 'DUPLICATE_ADDRESS'
    | 'MAX_ADDRESSES_REACHED'
    | 'INVALID_PINCODE'
    | 'NOT_SERVICEABLE'
    | 'VALIDATION_FAILED'
    | 'TRANSACTION_FAILED';

export interface AddressError {
    type: AddressErrorType;
    message: string;
    field?: string;
}

export interface User {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    addresses: SavedAddress[]; // Saved addresses (max 10)
    lastActiveAt?: Date; // For data retention policy
    createdAt: Date;

    // Cached customer metrics (updated atomically with orders for performance)
    totalOrders?: number;           // Count of paid orders only
    totalSpent?: number;            // Sum of all paid orders (excluding cancelled/refunded)
    averageOrderValue?: number;     // totalSpent / totalOrders
    firstOrderDate?: Date;          // Date of first paid order
    lastOrderDate?: Date;           // Date of most recent paid order
    segment?: 'new' | 'returning' | 'vip' | 'at-risk' | 'inactive'; // Pre-calculated segment
    segmentUpdatedAt?: Date;        // Last segment calculation timestamp
}



// ========================================
// WHOLESALE PLATFORM TYPES (Greenfield)
// ========================================

/**
 * Wholesale Product Schema
 * Clean greenfield implementation for B2B bundle-based sales
 */
export interface WholesaleProduct {
    id: string;
    title: string;
    slug: string; // URL-friendly unique identifier
    description: string;
    category: string;
    tags?: string[]; // Secondary classification for filtering (e.g. "Jubba", "Rompers")
    styleCode?: string; // Group products as color variants (e.g. "TSHIRT-001")
    colorName?: string; // Specific color for this variant (e.g. "Red", "Navy")

    // Bundle configuration
    bundleQty: number;                           // Total pieces per bundle (default: 20)
    bundleComposition: Record<string, number>;   // Size distribution: { 'M': 8, 'L': 7, 'XL': 5 }
    bundlePrice: number;                         // Total price per bundle

    // Stock management
    availableBundles: number;                    // Complete bundles in stock
    totalPieces: number;                         // Auto-calculated: availableBundles * bundleQty

    // Product attributes
    mixedColors: boolean;                        // Always true for wholesale
    colorDescription?: string;                   // e.g., "Assorted pastels"

    // Accounting integrity
    isLocked: boolean;                           // Price locked after first paid order
    lockedAt?: Date;
    firstOrderId?: string;                       // Order that locked the product

    images: string[];                            // Image URLs
    inStock: boolean;                            // availableBundles > 0
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Wholesale Order Schema
 * B2B orders with bundle-based line items
 */
export interface WholesaleBundleItem {
    productId: string;
    productTitle: string;
    productImage: string;
    bundleQty: number;
    bundleComposition: Record<string, number>;
    bundlesOrdered: number;                      // How many bundles ordered
    pricePerBundle: number;                      // Price at time of order
    lineTotal: number;                           // bundlesOrdered × pricePerBundle
}

export interface WholesaleOrder {
    id: string;

    // Line items
    items: WholesaleBundleItem[];

    // Pricing
    subtotal: number;                            // Sum of line totals
    gstRate: number;                             // GST rate from settings (e.g., 0.18)
    gst: number;                                 // Calculated GST amount
    adminDiscount: number;                       // Manual discount by admin
    totalAmount: number;                         // subtotal + gst - adminDiscount

    // Audit trail for discounts
    adminDiscountHistory: {
        amount: number;
        reason: string;
        appliedBy: string;                       // Admin user ID
        appliedAt: Date;
    }[];

    // Payment (online only)
    paymentStatus: 'paid' | 'failed' | 'pending';
    gatewayOrderId: string;
    gatewayPaymentId?: string;

    // Promotions (optional - applied at checkout)
    appliedCombo?: AppliedCombo;             // Bundle combo deal applied
    appliedCoupon?: AppliedCoupon;           // Discount coupon applied

    // Order lifecycle
    orderStatus: 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    statusHistory: {
        status: string;
        changedBy: string;                       // Admin user ID
        changedAt: Date;
        notes?: string;
    }[];

    // Invoice System Fields
    invoiceNumber?: string;          // INV-2025-000001 (GST-compliant sequential)
    invoiceGeneratedAt?: Date;       // Timestamp of invoice generation
    invoiceSent?: boolean;           // Email delivery status
    packingSlipPrinted?: boolean;    // Warehouse workflow flag
    refunds?: OrderRefund[];         // Track all refunds with credit notes

    // Shipping
    courierName?: string;
    trackingNumber?: string;

    // Metadata
    userId: string;
    address: Address;
    stockDeducted: boolean;                      // Idempotency flag
    createdAt: Date;
    updatedAt: Date;
}

// Order Types
export type PaymentStatus = 'paid' | 'failed' | 'pending';
export type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

// Invoice Types Import (forward declaration)
import type { OrderRefund } from './invoice-types';

// Settings Types
export interface Settings {
    // GST Configuration (Wholesale Platform)
    gstRate: number;                  // Default: 0.18 (18%)
    gstEnabled: boolean;              // Toggle for GST calculation

    // Business details
    businessName: string;
    businessAddress: string;
    gstin?: string;                   // GST Identification Number

    // Legacy (keep for compatibility)
    shippingCharge: number;
    freeShippingAbove: number;
    codEnabled: boolean;
    returnPolicyDays: number;
}



// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Filter and Sort Types
export interface ProductFilters {
    category?: string;
    tags?: string[];     // Filter by product types
    sizes?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    search?: string;
    styleCode?: string;  // For filtering color variants
    excludeId?: string;  // For "you might also like" - exclude current product
}

export type ProductSortBy = 'price_asc' | 'price_desc' | 'newest' | 'oldest';

// Tag Constants
export const MAX_TAGS_PER_PRODUCT = 10;
export const MAX_TAG_LENGTH = 50;

/**
 * Convert tag to URL-safe slug
 * "T-Shirts" → "t-shirts"
 * "Casual Wear" → "casual-wear"
 */
export const tagToSlug = (tag: string): string => {
    return tag
        .toLowerCase()
        .replace(/\s+/g, '-')      // spaces to hyphens
        .replace(/[^\w-]/g, '')     // remove special chars except hyphen
        .trim();
};

/**
 * Convert slug back to display tag
 * "t-shirts" → "T-Shirts"
 * "casual-wear" → "Casual Wear"
 */
export const slugToTag = (slug: string): string => {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Payment Types
export interface PhonePeOrderData {
    redirectUrl: string;
    merchantTransactionId: string;
}

export interface PaymentVerification {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    signature: string;
}

// Combo/Promotion Types
// Extensible combo type system - 'quantity_based' for MVP, ready for Path 2 expansion
export type ComboType = 'quantity_based' | 'category_based' | 'bundle' | 'product_specific';

export interface ComboOffer {
    id: string;
    name: string;
    type: ComboType;

    // MVP: Simple quantity-based combos
    minimumQuantity: number; // e.g., 2, 3, 5
    comboPrice: number; // Fixed price like ₹60, ₹80

    // Path 2: Advanced filtering (not used in MVP, but schema-ready)
    eligibleProducts?: string[]; // Product IDs for product_specific combos
    eligibleCategories?: string[]; // e.g., ["shirts", "tshirts"] for category_based
    eligibleStyleCodes?: string[]; // For variant-specific combos

    // Status and scheduling
    active: boolean;
    startDate: Date;
    endDate?: Date; // Optional for permanent combos

    // Metadata
    createdAt: Date;
    updatedAt?: Date;
    createdBy: string; // Admin UID

    // Analytics summary (cached)
    usageCount?: number;
    totalRevenue?: number;
}

// Applied combo snapshot - stored in cart/order to prevent retroactive changes
export interface AppliedCombo {
    comboId: string;
    comboName: string;
    comboPrice: number;
    originalPrice: number; // What user would have paid without combo
    savings: number;
    appliedAt: Date;
    itemCount: number; // Number of items in combo
}



// Analytics event tracking
export type ComboAnalyticsEventType = 'view' | 'applied' | 'converted' | 'removed' | 'expired';

export interface ComboAnalyticsEvent {
    id: string;
    comboId: string;
    event: ComboAnalyticsEventType;
    metadata: {
        cartValue?: number;
        savings?: number;
        orderId?: string;
        itemCount?: number;
        userId?: string;
        reason?: string; // For 'removed' or 'expired' events
    };
    timestamp: Date;
}

// Aggregated analytics for dashboard
export interface ComboAnalytics {
    comboId: string;
    comboName: string;

    // Performance metrics
    viewCount: number;
    appliedCount: number;
    convertedCount: number;
    removedCount: number;

    // Financial impact
    totalRevenue: number;
    totalSavingsGiven: number;
    avgOrderValue: number;

    // Conversion metrics
    conversionRate: number; // convertedCount / appliedCount

    // Date range
    startDate: Date;
    endDate: Date;

    // Top products used in this combo
    topProducts?: Array<{
        productId: string;
        productTitle: string;
        usageCount: number;
    }>;
}

// Coupon/Discount Code Types
export type CouponType = 'flat' | 'percentage';
export type CouponApplicability = 'all' | 'firstOrder' | 'category';

export interface Coupon {
    id: string;
    code: string;                    // "TNFIRST50", "SUMMER20" (stored uppercase)

    // Discount Configuration
    type: CouponType;
    value: number;                   // 50 (for ₹50 flat) or 20 (for 20% off)

    // Restrictions
    minOrder?: number;               // Minimum cart value required (e.g., 500)
    maxDiscount?: number;            // Cap for percentage discounts (e.g., max ₹200 off)

    // Applicability
    appliesTo: CouponApplicability;
    categoryFilter?: string[];       // If appliesTo = 'category', restrict to these categories

    // Usage Limits
    usageLimit?: number;             // Total times coupon can be used (e.g., 100)
    perUserLimit: number;            // Times per user (default: 1)

    // Tracking
    usedCount: number;               // How many times used so far
    usedBy: string[];                // Array of user IDs who used it

    // Validity Period
    validFrom: Date;
    validUntil: Date;
    active: boolean;                 // Admin can deactivate without deleting

    // Metadata
    description?: string;            // Internal note for admin reference
    createdAt: Date;
    createdBy: string;              // Admin user ID
}

// Applied coupon snapshot - stored in order for historical record
export interface AppliedCoupon {
    couponId: string;
    code: string;
    discount: number;
    appliedAt: Date;
}

// Shipping and Checkout Types



export interface ShippingCheckResponse {
    pincode: string;
    tier: 'TIER_1' | 'TIER_2';
    shippingFee: number;
    shippingLabel: string;
    estimatedDays: string;
    isServiceable: boolean;
}

// ============================================================================
// COLLECTIONS & CAMPAIGNS
// ============================================================================

export type CollectionStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
export type CollectionTheme = 'default' | 'winter' | 'summer' | 'flash' | 'clearance';

export interface ImageAsset {
    url: string;
    publicId: string;
    alt?: string;
}

export interface Collection {
    // Identity
    id: string;
    slug: string;                    // URL-friendly: "winter-sale-2024"

    // Display
    name: string;                    // "Winter Sale 2024"
    tagline?: string;                // "Up to 70% OFF on Winter Essentials"
    description: string;             // Rich text/markdown

    // Visual Assets
    bannerImage?: ImageAsset;
    thumbnailImage?: ImageAsset;     // For homepage cards

    // Product Association (Manual Selection Only)
    productIds: string[];            // Array of wholesale product IDs

    // Scheduling & Validity
    status: CollectionStatus;
    startDate: Date;                 // When collection goes live
    endDate?: Date;                  // Optional expiry (null = permanent)
    timezone: string;                // "Asia/Kolkata"

    // Display Settings
    displaySettings: {
        showOnHomepage: boolean;
        homepageOrder?: number;      // Sort order on homepage
        showCountdown: boolean;      // Show "Ends in X hours"
        customCTA?: string;          // "Shop Now" / "Limited Time"
        theme?: CollectionTheme;
    };

    // SEO & Marketing
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
        ogImage?: string;
    };

    // Performance & Analytics
    viewCount: number;               // Track popularity
    conversionRate?: number;         // % of views that led to purchases
    totalRevenue?: number;           // Revenue generated (calculated)

    // Integration
    associatedCoupon?: string;       // Link to coupon code
    associatedCombo?: string;        // Link to combo deal

    // Metadata
    createdAt: Date;
    createdBy: string;               // Admin user ID
    updatedAt: Date;
    updatedBy: string;
}

export interface CollectionWithProducts extends Collection {
    products: WholesaleProduct[];
}

// Admin filter/query params
export interface CollectionQueryParams {
    status?: CollectionStatus;
    showOnHomepage?: boolean;
    limit?: number;
    offset?: number;
}

// Customer Analytics Types
export * from './customer-analytics-types';

// Invoice & Packing Slip Types
export * from './invoice-types';
