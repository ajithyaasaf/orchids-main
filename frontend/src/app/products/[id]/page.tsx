import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { id: string } }) {
    try {
        const product = await wholesaleProductsApi.getById(params.id);
        return {
            title: `${product.title} | Wholesale Orchids`,
            description: product.description,
        };
    } catch {
        return { title: 'Product Not Found' };
    }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
    try {
        // Fetches instantly on the server using the HttpOnly cookie proxy!
        const product = await wholesaleProductsApi.getById(params.id);

        return <ProductDetailClient product={product} />;
    } catch (err) {
        return notFound();
    }
}
