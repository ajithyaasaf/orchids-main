import { Metadata } from 'next';
import { productApi } from '@/lib/api';
import { CategoryPageClient } from '@/components/category/CategoryPageClient';

// Helper to match Database format (e.g., "men" -> "Men")
const formatCategoryForDb = (slug: string) => {
    if (!slug) return '';
    return slug.charAt(0).toUpperCase() + slug.slice(1);
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const category = formatCategoryForDb(params.slug);
    return {
        title: `${category} Collection - TNtrends`,
        description: `Shop the latest ${category.toLowerCase()} fashion at TNtrends. Trendy clothing at amazing prices.`,
    };
}

export async function generateStaticParams() {
    return [
        { slug: 'men' },
        { slug: 'women' },
        { slug: 'kids' },
    ];
}

// ⚠️ DEV SETTING: Disable cache so you see new seed data immediately.
// Change to 3600 (1 hour) before going to Production.
export const revalidate = 0;

export default async function CategoryPage({ params }: { params: { slug: string } }) {
    // 1. Convert URL slug to Database format
    const dbCategory = formatCategoryForDb(params.slug);

    try {
        console.log(`🔍 Category Page: Fetching "${dbCategory}"...`);

        const { data: products } = await productApi.getAll({
            category: dbCategory,
            limit: 50,
        });

        console.log(`✅ Category Page: Found ${products?.length || 0} items`);

        return <CategoryPageClient category={params.slug} initialProducts={products || []} />;
    } catch (error) {
        console.error("❌ Category Page Error:", error);
        // Return empty list instead of crashing, so the UI still loads
        return <CategoryPageClient category={params.slug} initialProducts={[]} />;
    }
}