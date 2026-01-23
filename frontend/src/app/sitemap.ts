import { MetadataRoute } from 'next';
import { productApi } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tntrends.shop';

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/category/men`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/category/women`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/category/kids`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/cart`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/checkout`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ];

    try {
        const { data: products } = await productApi.getAll({ limit: 500 });

        // Fetch tags for sitemap
        let tagRoutes: MetadataRoute.Sitemap = [];
        try {
            const { data: tagsByCategory } = await productApi.getTagsByCategory();
            const allTags = new Set<string>();
            Object.values(tagsByCategory || {}).forEach((tags: any) => {
                tags.forEach((tag: string) => allTags.add(tag));
            });

            // Need to import tagToSlug dynamically or duplicate logic if shared import fails in this context
            // Assuming shared is available
            const { tagToSlug } = require('@tntrends/shared');

            tagRoutes = Array.from(allTags).map(tag => ({
                url: `${baseUrl}/shop/${tagToSlug(tag)}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
            }));
        } catch (e) {
            console.error('Failed to fetch tags for sitemap', e);
        }

        const productRoutes: MetadataRoute.Sitemap = products.map((product: any) => ({
            url: `${baseUrl}/product/${product.id}`,
            lastModified: new Date(product.createdAt),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));

        return [...staticRoutes, ...tagRoutes, ...productRoutes];
    } catch (error) {
        return staticRoutes;
    }
}
