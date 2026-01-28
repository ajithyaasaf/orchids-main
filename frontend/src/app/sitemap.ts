import { MetadataRoute } from 'next';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';

/**
 * Dynamic Sitemap Generation for ORCHID Wholesale Clothing
 * Generates sitemap with all product URLs and category pages
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Static routes (always present)
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/category/newborn`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/category/girls`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/category/boys`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/category/women`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];

    // Dynamic product routes
    let productRoutes: MetadataRoute.Sitemap = [];

    try {
        const products = await wholesaleProductsApi.getAll();

        productRoutes = products.map((product) => ({
            url: `${baseUrl}/product/${product.id}`,
            lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch (error) {
        console.error('Error fetching products for sitemap:', error);
        // Continue with empty product list if API fails
    }

    return [...staticRoutes, ...productRoutes];
}
