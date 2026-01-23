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

// Product Types
export type DiscountType = 'percentage' | 'flat' | 'none';

// Flexible sizing system to support adult sizes (S, M, L, XL) and kids sizes (2-3Y, 4-5Y, etc.)
export type ProductSize = string;
export type StockBySize = Record<string, number>;

export interface ProductImage {
    url: string;
    publicId: string;
}

export interface Product {
    id: string;
    title: string;
    description: string;
    basePrice?: number;   // NEW: Admin-entered base price (source of truth)
    price: number;        // DEPRECATED: Kept for backward compatibility
    discountType: DiscountType;
    discountValue: number;
    category: string;     // Primary classification: Men/Women/Kids
    tags?: string[];      // Secondary: Product types and attributes (e.g., ["Shirts", "Formal", "Cotton"])
    sizes: ProductSize[];
    stockBySize: StockBySize;
    inStock: boolean;
    images: ProductImage[];
    createdAt: Date;

    // Color variant support (H&M style)
    styleCode?: string;  // Links color variants together
    color?: string;      // e.g. "Navy Blue", "Black", "White"
}

// Order Types
export type PaymentStatus = 'paid' | 'failed' | 'pending';
export type OrderStatus = 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
    productId: string;
    productTitle?: string;
    productImage?: string;
    size: ProductSize;
    quantity: number;
    price: number;
}


export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    totalAmount: number;
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    address: Address;
    emailSent: boolean;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    appliedCombo?: AppliedCombo; // Track combo usage for analytics
    appliedCoupon?: AppliedCoupon; // Track coupon usage for analytics
    stockDeducted?: boolean; // SECURITY: Idempotency flag to prevent double stock deduction

    // Invoice System Fields
    invoiceNumber?: string;          // INV-2025-000001 (GST-compliant sequential)
    invoiceGeneratedAt?: Date;       // Timestamp of invoice generation
    invoiceSent?: boolean;           // Email delivery status
    packingSlipPrinted?: boolean;    // Warehouse workflow flag
    refunds?: OrderRefund[];         // Track all refunds with credit notes

    createdAt: Date;
    updatedAt?: Date;
}

// Invoice Types Import (forward declaration)
import type { OrderRefund } from './invoice-types';

// Settings Types
export interface Settings {
    shippingCharge: number;
    freeShippingAbove: number;
    codEnabled: boolean;
    returnPolicyDays: number;
}

// Cart Types
export interface CartItem {
    product: Product;
    size: ProductSize;
    quantity: number;
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
    sizes?: ProductSize[];
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
export interface RazorpayOrderData {
    orderId: string;
    amount: number;
    currency: string;
    key: string;
}

export interface PaymentVerification {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
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

// Cart pricing options for best-price calculation
export interface PricingOption {
    type: 'individual' | 'combo';
    total: number;
    savings: number;
    appliedCombo?: AppliedCombo;
    breakdown?: string; // Human-readable explanation
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
export interface CheckoutItem {
    productId: string;
    size: string;
    color?: string;
    quantity: number;
}

export interface CheckoutCalculationRequest {
    items: CheckoutItem[];
    pincode: string;
}

export interface CheckoutCalculatedItem {
    productId: string;
    title: string;
    size: string;
    color?: string;
    displayPrice: number;
    quantity: number;
    lineTotal: number;
}

export interface CheckoutCalculationResponse {
    items: CheckoutCalculatedItem[];
    subtotal: number;
    shippingFee: number;
    shippingLabel: string;
    discount: number;
    discountLabel: string | null;
    finalTotal: number;
    isTier1: boolean;
    couponCode?: string;             // Applied coupon code if any
}

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
export type CollectionSelectionType = 'manual' | 'automatic' | 'hybrid';
export type CollectionTheme = 'default' | 'winter' | 'summer' | 'flash' | 'clearance';

export interface ImageAsset {
    url: string;
    publicId: string;
    alt?: string;
}

export interface AutoSelectionRules {
    categories?: string[];           // ["Men", "Women"]
    tags?: string[];                 // ["Winter", "Jackets"]
    priceRange?: {
        min?: number;
        max?: number;
    };
    discountMin?: number;            // Products with >=20% discount
    dateRange?: {                    // Products added within date range
        from: Date;
        to: Date;
    };
    inStock?: boolean;               // Only show in-stock items
    styleCode?: string;              // Specific style variants
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

    // Product Association Strategy
    selectionType: CollectionSelectionType;
    productIds?: string[];           // Manual selection
    autoRules?: AutoSelectionRules;  // Automatic selection rules

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
    products: Product[];
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
