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
            className="group flex flex-col h-full bg-white rounded-xl overflow-hidden hover:shadow-soft-lg transition-all duration-300 border border-transparent hover:border-gray-100"
        >
            {/* Product Image */}
            <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
                {product.images.length > 0 ? (
                    <Image
                        src={product.images[0]}
                        alt={`${product.title} wholesale bundle`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        priority={priority}
                        quality={85}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <Package className="w-12 h-12 opacity-20" />
                    </div>
                )}

                {/* Minimalist Stock Status */}
                {!product.inStock ? (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 text-xs font-medium uppercase tracking-wider shadow-sm">
                        Out of Stock
                    </div>
                ) : product.availableBundles < 10 ? (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-orange-600 px-3 py-1 text-xs font-medium uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        Low Stock
                    </div>
                ) : null}

                {/* Hover Action Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/20 to-transparent flex items-end justify-center pointer-events-none">
                    <div className="w-full bg-white text-gray-900 py-3 text-sm font-bold text-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto hover:bg-gray-900 hover:text-white rounded-lg">
                        View Details
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Category */}
                {product.category && (
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">
                        {product.category}
                    </div>
                )}

                {/* Title */}
                <h3 className="text-base font-medium text-gray-900 mb-1 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {product.title}
                </h3>

                {/* Price */}
                <div className="mt-2 mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold font-heading text-gray-900">
                            ₹{product.bundlePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">/ bundle</span>
                    </div>
                    {product.bundleQty > 1 && (
                        <p className="text-xs text-gray-400">
                            ₹{(product.bundlePrice / product.bundleQty).toFixed(0)} / pc
                        </p>
                    )}
                </div>

                {/* Divider */}
                <div className="mt-auto border-t border-gray-100 pt-3">
                    {/* Compact Bundle Details */}
                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium">{product.bundleQty} Pcs</span>
                        </div>

                        {/* Size Distribution Preview */}
                        <div className="flex gap-1">
                            {Object.entries(product.bundleComposition).slice(0, 3).map(([size, _], i) => (
                                <span key={size} className="bg-gray-50 px-1.5 py-0.5 rounded text-gray-500 border border-gray-100">
                                    {size}
                                </span>
                            ))}
                            {Object.keys(product.bundleComposition).length > 3 && (
                                <span className="text-gray-400 pl-0.5">+</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
