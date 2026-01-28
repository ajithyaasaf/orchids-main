import { WholesaleProduct } from '@tntrends/shared';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ShoppingCart } from 'lucide-react';

/**
 * ProductsGrid Component
 * Server component for rendering product grid with optimized images
 * Clean, maintainable code following React best practices
 */

interface ProductsGridProps {
    products: WholesaleProduct[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 8} // First 2 rows above fold for LCP
                />
            ))}
        </div>
    );
}

// ============================================================================
// Product Card Component
// ============================================================================

interface ProductCardProps {
    product: WholesaleProduct;
    priority?: boolean;
}

function ProductCard({ product, priority = false }: ProductCardProps) {
    return (
        <Link
            href={`/product/${product.id}`}
            className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {product.images.length > 0 ? (
                    <Image
                        src={product.images[0]}
                        alt={`${product.title} wholesale bundle`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        priority={priority}
                        quality={80}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <span className="text-sm">No Image</span>
                    </div>
                )}

                {/* Stock Badge */}
                {!product.inStock ? (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                        Out of Stock
                    </div>
                ) : product.availableBundles < 10 ? (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                        Low Stock
                    </div>
                ) : null}

                {/* Category Badge */}
                {product.category && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                        {product.category}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[56px]">
                    {product.title}
                </h3>

                {/* Bundle Info */}
                <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            Bundle:
                        </span>
                        <span className="font-semibold text-gray-900">{product.bundleQty} pcs</span>
                    </div>
                    <div className="text-xs text-gray-600">
                        {Object.entries(product.bundleComposition)
                            .map(([size, qty]) => `${size}:${qty}`)
                            .join(' • ')}
                    </div>
                </div>

                {/* Price */}
                <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-green-600">
                            ₹{product.bundlePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-gray-500">per bundle</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        ₹{(product.bundlePrice / product.bundleQty).toFixed(2)} per piece
                    </p>
                </div>

                {/* Stock Status */}
                <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Available:</span>
                    <span
                        className={`font-semibold ${product.inStock ? 'text-green-600' : 'text-red-600'
                            }`}
                    >
                        {product.inStock ? `${product.availableBundles} bundles` : 'Out of stock'}
                    </span>
                </div>

                {/* View Details Button */}
                <button className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group-hover:bg-blue-700">
                    <ShoppingCart className="w-4 h-4" />
                    View Details
                </button>
            </div>
        </Link>
    );
}
