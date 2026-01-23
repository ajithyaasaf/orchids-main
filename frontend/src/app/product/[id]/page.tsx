import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productApi } from '@/lib/api';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import { Product, ProductImage } from '@tntrends/shared';

// ⚠️ CRITICAL CONFIGURATION ⚠️
// dynamicParams = true: Allows Next.js to fetch IDs it didn't find during build time.
// revalidate = 0: Disables cache so you don't get stuck with "Product Not Found".
export const dynamicParams = true;
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    try {
        const { data: product } = await productApi.getById(params.id);

        return {
            title: `${product.title} - TNtrends`,
            description: product.description,
            openGraph: {
                title: product.title,
                description: product.description,
                images: product.images?.map((img: ProductImage) => img.url) ?? [],
                type: 'website',
            },
        };
    } catch (error) {
        return {
            title: 'Product Not Found - TNtrends',
        };
    }
}

export async function generateStaticParams() {
    try {
        // Try to pre-render the first 100 products
        const { data: products } = await productApi.getAll({ limit: 100 });
        return products.map((product: Product) => ({
            id: product.id,
        }));
    } catch (error) {
        // If backend is down during build, return empty array
        // dynamicParams=true will save us at runtime
        console.warn("⚠️ Could not generate static params for products");
        return [];
    }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
    try {
        const { data: product } = await productApi.getById(params.id);

        if (!product) {
            notFound();
        }

        // 🚀 SSR Enhancement: Fetch variants server-side to prevent flicker
        let initialVariants: Product[] = [];

        if (product.styleCode) {
            try {
                const { data: variantsData } = await productApi.getAll({
                    styleCode: product.styleCode,
                    limit: 10,
                });

                if (variantsData && Array.isArray(variantsData)) {
                    // Filter out current product to prevent duplicate swatches
                    initialVariants = variantsData.filter((p: Product) => p.id !== product.id);
                }
            } catch (variantError) {
                // Non-critical: If variant fetch fails, page still works
                console.debug("Failed to fetch variants:", variantError);
            }
        }

        return <ProductDetailClient product={product} initialVariants={initialVariants} />;
    } catch (error) {
        console.error("Product Page Error:", error);
        notFound();
    }
}