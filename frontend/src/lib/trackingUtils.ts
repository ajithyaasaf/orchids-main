import type { WholesaleProduct } from '@orchids/shared';

/**
 * E-commerce Tracking Utilities for Google Tag Manager & Meta Pixel
 * Pushes events to window.dataLayer for GTM/GA4 and window.fbq for Meta Pixel
 */

// Helper to safely push to dataLayer
const pushToDataLayer = (data: any) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object
        window.dataLayer.push(data);
    }
};

// Helper to safely trigger Meta Pixel events
const trackMetaEvent = (eventName: string, data?: any) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
        if (data) {
            (window as any).fbq('track', eventName, data);
        } else {
            (window as any).fbq('track', eventName);
        }
    }
};

// Helper to format product for GA4
const formatProduct = (product: WholesaleProduct, quantity: number = 1, size?: string) => ({
    item_id: product.id,
    item_name: product.title,
    item_category: product.category,
    item_variant: size || undefined,
    price: product.bundlePrice,
    quantity: quantity,
});

// Helper to format cart/order item for GA4 & Meta (handles both CartItem and OrderItem shapes safely)
const formatCartItem = (item: any) => ({
    item_id: item.product?.id || item.productId || item.id || '',
    item_name: item.product?.title || item.productTitle || item.title || 'Product',
    item_category: item.product?.category || item.category || 'Wholesale',
    item_variant: undefined,
    price: item.product?.bundlePrice || item.pricePerBundle || item.price || 0,
    quantity: item.bundlesOrdered || item.quantity || 1,
});

/**
 * Track product detail page view
 * Event: view_item / ViewContent
 */
export const trackViewItem = (product: WholesaleProduct, selectedSize?: string) => {
    if (!product) return;

    pushToDataLayer({
        event: 'view_item',
        ecommerce: {
            currency: 'INR',
            value: product.bundlePrice,
            items: [formatProduct(product, 1, selectedSize)],
        },
    });

    trackMetaEvent('ViewContent', {
        content_name: product.title,
        content_ids: [product.id],
        content_type: 'product',
        value: product.bundlePrice,
        currency: 'INR',
    });
};

/**
 * Track product list/category page view
 * Event: view_item_list
 */
export const trackViewItemList = (products: WholesaleProduct[], listName: string) => {
    if (!products || products.length === 0) return;

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
 * Event: add_to_cart / AddToCart
 */
export const trackAddToCart = (product: WholesaleProduct, size: string = '', quantity: number = 1) => {
    if (!product) return;

    const price = product.bundlePrice || 0;
    const totalVal = price * quantity;

    pushToDataLayer({
        event: 'add_to_cart',
        ecommerce: {
            currency: 'INR',
            value: totalVal,
            items: [formatProduct(product, quantity, size)],
        },
    });

    trackMetaEvent('AddToCart', {
        content_name: product.title,
        content_ids: [product.id],
        content_type: 'product',
        value: totalVal,
        currency: 'INR',
    });
};

/**
 * Track remove from cart action
 * Event: remove_from_cart
 */
export const trackRemoveFromCart = (product: WholesaleProduct, size: string = '', quantity: number = 1) => {
    if (!product) return;

    const price = product.bundlePrice || 0;
    pushToDataLayer({
        event: 'remove_from_cart',
        ecommerce: {
            currency: 'INR',
            value: price * quantity,
            items: [formatProduct(product, quantity, size)],
        },
    });
};

/**
 * Track checkout initiation
 * Event: begin_checkout / InitiateCheckout
 */
export const trackBeginCheckout = (items: any[], totalValue: number) => {
    if (!items || items.length === 0) return;

    pushToDataLayer({
        event: 'begin_checkout',
        ecommerce: {
            currency: 'INR',
            value: totalValue,
            items: items.map(formatCartItem),
        },
    });

    trackMetaEvent('InitiateCheckout', {
        value: totalValue,
        currency: 'INR',
        content_type: 'product',
        content_ids: items.map((i: any) => i.product?.id || i.productId || i.id || ''),
        contents: items.map((i: any) => ({
            id: i.product?.id || i.productId || i.id || '',
            quantity: i.bundlesOrdered || i.quantity || 1,
            item_price: i.product?.bundlePrice || i.pricePerBundle || i.price || 0,
        })),
        num_items: items.reduce((sum, item) => sum + (item.bundlesOrdered || item.quantity || 1), 0),
    });
};

/**
 * Track payment info addition
 * Event: add_payment_info / AddPaymentInfo
 */
export const trackAddPaymentInfo = (items: any[], totalValue: number, paymentType: string = 'razorpay') => {
    if (!items || items.length === 0) return;

    pushToDataLayer({
        event: 'add_payment_info',
        ecommerce: {
            currency: 'INR',
            value: totalValue,
            payment_type: paymentType,
            items: items.map(formatCartItem),
        },
    });

    trackMetaEvent('AddPaymentInfo', {
        value: totalValue,
        currency: 'INR',
        content_type: 'product',
        content_ids: items.map((i: any) => i.product?.id || i.productId || i.id || ''),
    });
};

/**
 * Track successful purchase
 * Event: purchase / Purchase
 */
export const trackPurchase = (
    orderId: string,
    items: any[],
    totalValue: number,
    shippingCost: number = 0,
    couponCode?: string
) => {
    if (!orderId) return;

    // Guard against duplicate purchase tracking
    if (isPurchaseTracked(orderId)) {
        return;
    }

    pushToDataLayer({
        event: 'purchase',
        ecommerce: {
            transaction_id: orderId,
            value: totalValue,
            currency: 'INR',
            shipping: shippingCost,
            tax: 0,
            coupon: couponCode || undefined,
            items: items.map(formatCartItem),
        },
    });

    // Mark purchase as tracked in session
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(`purchase_tracked_${orderId}`, 'true');
    }

    trackMetaEvent('Purchase', {
        value: totalValue,
        currency: 'INR',
        content_type: 'product',
        order_id: orderId,
        content_ids: items.map((i: any) => i.product?.id || i.productId || i.id || ''),
        contents: items.map((i: any) => ({
            id: i.product?.id || i.productId || i.id || '',
            quantity: i.bundlesOrdered || i.quantity || 1,
            item_price: i.product?.bundlePrice || i.pricePerBundle || i.price || 0,
        })),
        num_items: items.reduce((sum, item) => sum + (item.bundlesOrdered || item.quantity || 1), 0),
    });
};

/**
 * Check if purchase was already tracked (prevents duplicates)
 */
export const isPurchaseTracked = (orderId: string): boolean => {
    if (typeof window !== 'undefined' && orderId) {
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
