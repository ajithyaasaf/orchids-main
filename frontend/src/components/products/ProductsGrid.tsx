import { WholesaleProduct } from '@tntrends/shared';
import { WholesaleProductCard } from './WholesaleProductCard';

/**
 * ProductsGrid Component
 * Enterprise-grade product grid with premium card design
 */

interface ProductsGridProps {
    products: WholesaleProduct[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product, index) => (
                <WholesaleProductCard
                    key={product.id}
                    product={product}
                    priority={index < 8}
                />
            ))}
        </div>
    );
}
