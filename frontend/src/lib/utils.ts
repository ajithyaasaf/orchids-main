import { WholesaleProduct } from '@orchids/shared';
import { getCloudinaryUrl, OG_IMAGE_OPTS } from '@/lib/cloudinaryImage';

/**
 * Format price to Indian Rupee format
 */
export const formatPrice = (price: number): string => {
    return `₹${price.toLocaleString('en-IN')}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Generate product JSON-LD for SEO
 * Uses centralized pricing utilities to ensure consistent prices
 */
export const generateProductJsonLd = (product: WholesaleProduct) => {
    // Build absolute, optimized image URLs for structured data.
    // Search crawlers (Google, Bing) require absolute URLs — Cloudinary
    // with OG_IMAGE_OPTS delivers a 1200x630 JPEG, which is the canonical
    // size for Open Graph and Google's rich results.
    const structuredImages = product.images
        .slice(0, 5) // Schema.org recommends max 5 images
        .map((publicId) => getCloudinaryUrl(publicId, OG_IMAGE_OPTS))
        .filter(Boolean);

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: structuredImages,
        brand: {
            '@type': 'Brand',
            name: 'Wholesale Orchids',
        },
        offers: {
            '@type': 'Offer',
            price: product.bundlePrice,
            priceCurrency: 'INR',
            availability: product.inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
        },
    };
};

/**
 * Class name merger utility
 */
export const cn = (...classes: (string | boolean | undefined)[]): string => {
    return classes.filter(Boolean).join(' ');
};
