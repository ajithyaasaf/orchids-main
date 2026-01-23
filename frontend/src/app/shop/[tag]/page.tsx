import { productApi } from '@/lib/api';
import { ShopByTagClient } from '@/components/shop/ShopByTagClient';
import { slugToTag } from '@tntrends/shared';
import { Metadata } from 'next';

interface PageProps {
    params: {
        tag: string;
    };
    searchParams: {
        category?: string;
    };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const tagName = slugToTag(params.tag);
    const category = searchParams.category;

    const title = category
        ? `${tagName} for ${category} | TNtrends`
        : `${tagName} Collection | TNtrends`;

    const description = category
        ? `Shop ${tagName} for ${category} at TNtrends. Premium quality ${tagName.toLowerCase()} collection.`
        : `Shop the latest ${tagName} collection at TNtrends. Discover premium quality styles for men, women, and kids.`;

    return { title, description };
}

export default async function ShopByTagPage({ params, searchParams }: PageProps) {
    const tagName = slugToTag(params.tag);
    const category = searchParams.category;

    // Fetch products with tag and optional category filter
    let products = [];
    try {
        const filters: any = { tags: [tagName] };
        if (category) {
            filters.category = category;
        }

        const { data } = await productApi.getAll(filters);
        products = data;
    } catch (error) {
        console.error('Failed to fetch products for tag:', params.tag, error);
    }

    return (
        <ShopByTagClient
            tagSlug={params.tag}
            initialProducts={products}
            initialCategory={category}
        />
    );
}
