import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { ProductSchema, Breadcrumbs } from '@/components/seo/StructuredData';
import { AddToCartSection } from '@/components/product/AddToCartSection';
import { Package, Ruler, ShoppingBag } from 'lucide-react';

/**
 * Product Detail Page - SEO Optimized
 * Server-side rendered with dynamic metadata and Schema.org markup
 * 
 * Features:
 * - Dynamic metadata per product for SEO
 * - Schema.org Product structured data
 * - Next.js Image optimization
 * - Breadcrumb navigation with schema
 * - Server-side rendering for SEO crawlers
 */

interface ProductPageProps {
    params: {
        id: string;
    };
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    try {
        const product = await wholesaleProductsApi.getById(params.id);

        return {
            title: `${product.title} - Wholesale Bundle`,
            description: product.description || `${product.title} wholesale clothing bundle. ${product.bundleQty} pieces per bundle. Bundle composition: ${Object.entries(product.bundleComposition).map(([size, qty]) => `${qty} ${size}`).join(', ')}. Wholesale price: ₹${product.bundlePrice}`,
            keywords: [
                product.title,
                'wholesale clothing',
                product.category || 'apparel',
                'bulk clothing',
                'Tirupur wholesale',
                `${product.bundleQty} piece bundle`,
            ],
            openGraph: {
                title: `${product.title} - Wholesale Bundle | ORCHID`,
                description: `Wholesale ${product.category || 'clothing'} bundle - ${product.bundleQty} pieces at ₹${product.bundlePrice}`,
                images: product.images.length > 0 ? [{ url: product.images[0] }] : [],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${product.title} - Wholesale Bundle`,
                description: `${product.bundleQty} piece bundle at ₹${product.bundlePrice}`,
                images: product.images.length > 0 ? [product.images[0]] : [],
            },
            robots: {
                index: product.inStock,
                follow: true,
            },
        };
    } catch (error) {
        return {
            title: 'Product Not Found',
        };
    }
}

// Generate static params for build-time generation (ISR)
export async function generateStaticParams() {
    try {
        const products = await wholesaleProductsApi.getAll();
        return products.slice(0, 50).map((product) => ({
            id: product.id,
        }));
    } catch (error) {
        return [];
    }
}

export default async function ProductPage({ params }: ProductPageProps) {
    let product;

    try {
        product = await wholesaleProductsApi.getById(params.id);
    } catch (error) {
        notFound();
    }

    const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        { name: product.category || 'Clothing', url: `/products?category=${product.category}` },
        { name: product.title, url: `/product/${product.id}` },
    ];

    return (
        <>
            {/* SEO: Product Schema */}
            <ProductSchema product={product} />

            <main className="min-h-screen bg-white">
                <div className="container mx-auto px-6 py-8 max-w-7xl">
                    {/* SEO: Breadcrumb Navigation */}
                    <Breadcrumbs items={breadcrumbItems} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Column: Images */}
                        <div>
                            <ProductImageGallery images={product.images} title={product.title} />
                        </div>

                        {/* Right Column: Product Info */}
                        <div>
                            {/* Category Badge */}
                            {product.category && (
                                <div className="mb-4">
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                                        {product.category}
                                    </span>
                                </div>
                            )}

                            {/* Product Title - H1 for SEO */}
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                {product.title}
                            </h1>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-bold text-green-600">
                                        ₹{product.bundlePrice.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-gray-500">per bundle</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    ₹{(product.bundlePrice / product.bundleQty).toFixed(2)} per piece
                                </p>
                            </div>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {product.inStock ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                        <span className="font-semibold">
                                            {product.availableBundles} bundles in stock
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                        <span className="font-semibold">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            {/* Bundle Information - Structured for SEO */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Bundle Configuration
                                </h2>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Bundle Size:</span>
                                        <span className="font-bold text-gray-900">
                                            {product.bundleQty} pieces
                                        </span>
                                    </div>

                                    <div className="border-t border-blue-200 pt-3">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">
                                            Size Composition:
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(product.bundleComposition).map(([size, qty]) => (
                                                <div
                                                    key={size}
                                                    className="flex items-center justify-between bg-white px-3 py-2 rounded border border-blue-100"
                                                >
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {size}:
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {qty} pcs
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                                </div>
                            )}

                            {/* Add to Cart Section */}
                            <AddToCartSection product={product} />

                            {/* Additional Info */}
                            <div className="mt-8 border-t pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                    Wholesale Information
                                </h3>
                                <ul className="space-y-3 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <ShoppingBag className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>
                                            <strong>Minimum Order:</strong> 1 bundle ({product.bundleQty}{' '}
                                            pieces)
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Ruler className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>
                                            <strong>GST:</strong> Included in price (GST: 33ATDPB1895L2ZM)
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Package className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>
                                            <strong>Packaging:</strong> Professional wholesale packaging
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

// ============================================================================
// Product Image Gallery Component
// ============================================================================

function ProductImageGallery({ images, title }: { images: string[]; title: string }) {
    if (images.length === 0) {
        return (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Image - Optimized for LCP */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                    src={images[0]}
                    alt={`${title} - wholesale clothing bundle`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    quality={90}
                />
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                    {images.slice(1, 5).map((image, index) => (
                        <div
                            key={index}
                            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                        >
                            <Image
                                src={image}
                                alt={`${title} - view ${index + 2}`}
                                fill
                                className="object-cover"
                                sizes="25vw"
                                quality={75}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}