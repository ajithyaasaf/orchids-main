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

            <main className="min-h-screen bg-gray-50/50">
                <div className="container mx-auto px-6 py-12 max-w-7xl">
                    {/* SEO: Breadcrumb Navigation */}
                    <div className="mb-6">
                        <Breadcrumbs items={breadcrumbItems} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                        {/* Left Column: Images (7 columns) */}
                        <div className="lg:col-span-7">
                            <ProductImageGallery images={product.images} title={product.title} />
                        </div>

                        {/* Right Column: Product Info (5 columns) */}
                        <div className="lg:col-span-5 space-y-8">
                            <div>
                                {/* Category Badge */}
                                {product.category && (
                                    <div className="mb-3">
                                        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                                            {product.category}
                                        </span>
                                    </div>
                                )}

                                {/* Product Title - H1 for SEO */}
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                                    {product.title}
                                </h1>

                                {/* Price */}
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-5xl font-heading font-bold text-primary">
                                            ₹{product.bundlePrice.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-lg text-gray-500 font-medium">/ bundle</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2 font-medium">
                                        ₹{(product.bundlePrice / product.bundleQty).toFixed(0)} per piece • GST Included
                                    </p>
                                </div>

                                {/* Bundle Configuration - Clean Grid Spec */}
                                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Package className="w-4 h-4 text-primary" />
                                            Bundle Config
                                        </h2>
                                        <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-full text-xs">
                                            {product.bundleQty} Pieces Total
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.entries(product.bundleComposition).map(([size, qty]) => (
                                            <div
                                                key={size}
                                                className="flex flex-col items-center justify-center bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
                                            >
                                                <span className="text-xs text-gray-500 mb-1">Size {size}</span>
                                                <span className="text-lg font-bold text-gray-900">{qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Add to Cart Section */}
                            <AddToCartSection product={product} />

                            {/* Description - Accordion style or clean block */}
                            {product.description && (
                                <div className="prose prose-sm text-gray-600 leading-relaxed max-w-none">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                                    <p>{product.description}</p>
                                </div>
                            )}

                            {/* Wholesale Value Props */}
                            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-100">
                                <div className="text-center">
                                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <ShoppingBag className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900">Low MOQ</p>
                                    <p className="text-[10px] text-gray-500">1 Bundle Only</p>
                                </div>
                                <div className="text-center">
                                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Ruler className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900">GST Invoice</p>
                                    <p className="text-[10px] text-gray-500">Input Credit</p>
                                </div>
                                <div className="text-center">
                                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Package className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900">Fast Ship</p>
                                    <p className="text-[10px] text-gray-500">Professional Pack</p>
                                </div>
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
            <div className="aspect-[4/5] bg-gray-100 rounded-2xl flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
            </div>
        );
    }

    return (
        <div className="flex gap-6 sticky top-24">
            {/* Thumbnail Strip (Left Side) */}
            {images.length > 1 && (
                <div className="hidden lg:flex flex-col gap-4 w-24 flex-shrink-0">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`relative aspect-square bg-white rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${index === 0 ? 'border-primary shadow-sm' : 'border-transparent hover:border-gray-200'
                                }`}
                        >
                            <Image
                                src={image}
                                alt={`${title} - view ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="96px"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Main Image */}
            <div className="relative flex-grow aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <Image
                    src={images[0]}
                    alt={`${title} - wholesale clothing bundle`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    quality={95}
                />
            </div>

            {/* Mobile Thumbnails (Below) */}
            {images.length > 1 && (
                <div className="flex lg:hidden gap-3 overflow-x-auto pb-4 mt-4 w-full">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="relative w-20 aspect-square flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-200"
                        >
                            <Image
                                src={image}
                                alt={`${title} view ${index}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}