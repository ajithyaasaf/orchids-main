import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { collectionApi } from '@/lib/api';
import { CollectionPageClient } from '@/components/pages/CollectionPageClient';
import { WholesaleProduct } from '@orchids/shared';

interface PageProps {
    params: { slug: string };
}

/**
 * Generate metadata for SEO
 * Server-side rendering for optimal search engine indexing
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const { data: collection } = await collectionApi.getBySlug(params.slug);


        return {
            title: collection.seo.metaTitle || `${collection.name} | Orchid`,
            description: collection.seo.metaDescription || collection.description,
            keywords: collection.seo.keywords,
            openGraph: {
                title: collection.seo.metaTitle || collection.name,
                description: collection.seo.metaDescription || collection.tagline || collection.description,
                images: collection.seo.ogImage ? [{ url: collection.seo.ogImage }] :
                    collection.bannerImage ? [{ url: collection.bannerImage.url }] : undefined,
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: collection.seo.metaTitle || collection.name,
                description: collection.seo.metaDescription || collection.tagline || collection.description,
                images: collection.seo.ogImage || collection.bannerImage?.url,
            },
        };
    } catch (error) {
        return {
            title: 'Collection Not Found | Orchid',
            description: 'The requested collection could not be found.',
        };
    }
}

/**
 * Collection Page - Server Component
 * Fetches data server-side for optimal SEO and performance
 */
export default async function CollectionPage({ params }: PageProps) {
    try {
        const { data: collection } = await collectionApi.getBySlug(params.slug);

        // Backend now returns wholesale products directly in collection.products
        // (Type: CollectionWithProducts has Product[] but we return WholesaleProduct[])
        const wholesaleProducts = (collection as any).products || [];

        // Pass data to client component for interactivity
        return <CollectionPageClient collection={collection} products={wholesaleProducts} />;
    } catch (error) {
        console.error('Failed to fetch collection:', error);
        notFound();
    }
}

/**
 * Generate static params for known collections (optional - for ISR)
 * Uncomment and implement when you have collection slugs to pre-generate
 */
// export async function generateStaticParams() {
//     try {
//         const { data: collections } = await collectionApi.getAll();
//         return collections.map(collection => ({
//             slug: collection.slug,
//         }));
//     } catch {
//         return [];
//     }
// }

/**
 * Revalidate strategy
 * ISR: Revalidate every 5 minutes for fresh data without full rebuild
 */
export const revalidate = 300; // 5 minutes
