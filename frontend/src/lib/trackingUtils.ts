import type { Product, CartItem } from '@tntrends/shared';

/**
 * E-commerce Tracking Utilities for Google Tag Manager
 * All functions push events to window.dataLayer for GTM to process
 */

// Helper to safely push to dataLayer
const pushToDataLayer = (data: any) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object
        window.dataLayer.push(data);
    }
};

// Helper to format product for GA4
const formatProduct = (product: Product, quantity: number = 1, size?: string) => ({
    item_id: product.id,
    item_name: product.title,
    item_category: product.category,
    item_variant: size || undefined,
    price: product.price,
    quantity: quantity,
});

// Helper to format cart item for GA4
const formatCartItem = (item: CartItem) => ({
    item_id: item.product.id,
    item_name: item.product.title,
    item_category: item.product.category,
    item_variant: item.size,
    price: item.product.price,
    quantity: item.quantity,
});

/**
 * Track product detail page view
 * Event: view_item
 */
export const trackViewItem = (product: Product, selectedSize?: string) => {
    pushToDataLayer({
        event: 'view_item',
        ecommerce: {
            currency: 'INR',
            value: product.price,
            items: [formatProduct(product, 1, selectedSize)],
        },
    });
};

/**
 * Track product list/category page view
 * Event: view_item_list
 */
export const trackViewItemList = (products: Product[], listName: string) => {
    pushToDataLayer({
        event: 'view_item_list',
        ecommerce: {
            item_list_name: listName,
            items: products.map((product, index) => ({
                ...formatProduct(product),
                index: index,
            })),
        },
    });
};

/**
 * Track add to cart action
 * Event: add_to_cart
 */
export const trackAddToCart = (product: Product, size: string, quantity: number = 1) => {
    pushToDataLayer({
        event: 'add_to_cart',
        ecommerce: {
            currency: 'INR',
            value: product.price * quantity,
            items: [formatProduct(product, quantity, size)],
        },
    });
};

/**
 * Track remove from cart action
 * Event: remove_from_cart
 */
export const trackRemoveFromCart = (product: Product, size: string, quantity: number) => {
    pushToDataLayer({
        event: 'remove_from_cart',
        ecommerce: {
            currency: 'INR',
            value: product.price * quantity,
            items: [formatProduct(product, quantity, size)],
        },
    });
};

/**
 * Track checkout initiation
 * Event: begin_checkout
 */
export const trackBeginCheckout = (items: CartItem[], totalValue: number) => {
    pushToDataLayer({
        event: 'begin_checkout',
        ecommerce: {
            currency: 'INR',
            value: totalValue,
            items: items.map(formatCartItem),
        },
    });
};

/**
 * Track payment info addition
 * Event: add_payment_info
 */
export const trackAddPaymentInfo = (items: CartItem[], totalValue: number, paymentType: string = 'razorpay') => {
    pushToDataLayer({
        event: 'add_payment_info',
        ecommerce: {
            currency: 'INR',
            value: totalValue,
            payment_type: paymentType,
            items: items.map(formatCartItem),
        },
    });
};

/**
 * Track successful purchase
 * Event: purchase
 */
export const trackPurchase = (
    orderId: string,
    items: CartItem[],
    totalValue: number,
    shippingCost: number = 0,
    couponCode?: string
) => {
    pushToDataLayer({
        event: 'purchase',
        ecommerce: {
            transaction_id: orderId,
            value: totalValue,
            currency: 'INR',
            shipping: shippingCost,
            tax: 0, // No tax in current implementation
            coupon: couponCode || undefined,
            items: items.map(formatCartItem),
        },
    });

    // Mark purchase as tracked in session
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(`purchase_tracked_${orderId}`, 'true');
    }
};

/**
 * Check if purchase was already tracked (prevents duplicates)
 */
export const isPurchaseTracked = (orderId: string): boolean => {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem(`purchase_tracked_${orderId}`) === 'true';
    }
    return false;
};

/**
 * Track custom event (for future extensibility)
 */
export const trackCustomEvent = (eventName: string, eventData?: any) => {
    pushToDataLayer({
        event: eventName,
        ...eventData,
    });
};
