'use client';

import Script from 'next/script';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { WholesaleProduct } from '@tntrends/shared';

/**
 * SEO Structured Data Components
 * Implements Schema.org markup for improved search engine visibility
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

// ============================================================================
// Organization Schema
// ============================================================================

export function OrganizationSchema() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ORCHID Wholesale Clothing',
        description: 'Wholesale clothing supplier specializing in baby wear, kids clothing, and women\'s apparel from Tirupur, Tamil Nadu',
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'no.3(1)2A, Sivarajan compound, appachi Nagar extension, 2nd Street, Kongu main road',
            addressLocality: 'Tirupur',
            postalCode: '641607',
            addressRegion: 'Tamil Nadu',
            addressCountry: 'IN',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91-7539960399',
            contactType: 'customer service',
            areaServed: 'IN',
            availableLanguage: ['en', 'ta'],
        },
        sameAs: [
            // Add social media URLs when available
        ],
    };

    return (
        <Script
            id="organization-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// ============================================================================
// Product Schema
// ============================================================================

interface ProductSchemaProps {
    product: WholesaleProduct;
}

export function ProductSchema({ product }: ProductSchemaProps) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description || `Wholesale ${product.category || 'clothing'} bundle - ${product.bundleQty} pieces`,
        image: product.images.length > 0 ? product.images : [`${siteUrl}/images/placeholder.jpg`],
        brand: {
            '@type': 'Brand',
            name: 'ORCHID',
        },
        offers: {
            '@type': 'Offer',
            url: `${siteUrl}/product/${product.id}`,
            priceCurrency: 'INR',
            price: product.bundlePrice,
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            availability: product.inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: 'ORCHID Wholesale Clothing',
            },
        },
        aggregateRating:
            'reviews' in product && typeof product.reviews === 'number' && product.reviews > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: 'starRating' in product && typeof product.starRating === 'number' ? product.starRating : 4.5,
                    reviewCount: product.reviews,
                }
                : undefined,
        sku: product.id,
        category: product.category,
    };

    return (
        <Script
            id="product-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

// ============================================================================
// Breadcrumbs
// ============================================================================

export interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${siteUrl}${item.url}`,
        })),
    };

    return (
        <>
            {/* Visual Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex items-center space-x-2 text-sm text-gray-600">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-center">
                            {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
                            {index === items.length - 1 ? (
                                <span className="font-semibold text-gray-900">{item.name}</span>
                            ) : (
                                <Link
                                    href={item.url}
                                    className="hover:text-primary transition-colors"
                                >
                                    {item.name}
                                </Link>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>

            {/* Structured Data */}
            <Script
                id="breadcrumb-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
        </>
    );
}
