import { MetadataRoute } from 'next';

/**
 * Robots.txt Configuration for ORCHID Wholesale Clothing
 * Controls search engine crawling and indexing
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',              // Admin panel - private
                    '/auth/',               // Auth pages - no SEO value
                    '/wholesale/checkout/', // Checkout - private
                    '/wholesale/cart/',     // Cart - private
                    '/api/',                // API routes - not indexable
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
