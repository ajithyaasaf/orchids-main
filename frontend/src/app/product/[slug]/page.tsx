import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { ProductSchema, Breadcrumbs } from '@/components/seo/StructuredData';
import { AddToCartSection } from '@/components/product/AddToCartSection';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { PincodeCheck } from '@/components/product/PincodeCheck';
import { WhatsAppInquiry } from '@/components/product/WhatsAppInquiry';
import { SocialShare } from '@/components/product/SocialShare';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { RecentlyViewedProducts } from '@/components/product/RecentlyViewedProducts';
import { RecentlyViewedTracker } from '@/components/product/RecentlyViewedTracker';
import { MobileStickyAddToCart } from '@/components/product/MobileStickyAddToCart';
import { ColorVariants } from '@/components/product/ColorVariants';
import { Package, Ruler, ShoppingBag, ArrowLeft } from 'lucide-react';
import { getCloudinaryUrl, OG_IMAGE_OPTS } from '@/lib/cloudinaryImage';

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
        slug: string;
    };
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    try {
        const product = await wholesaleProductsApi.getBySlug(params.slug);

        return {
            title: `${product.title} - Wholesale Bundle`,
            description: product.description || `${product.title} wholesale clothing bundle. ${product.bundleQty || 0} pieces per bundle. Bundle composition: ${Object.entries(product.bundleComposition || {}).map(([size, qty]) => `${qty} ${size}`).join(', ')}. Wholesale price: ₹${product.bundlePrice}`,
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
                // Use a properly-sized 1200x630 JPEG for social previews.
                // OG_IMAGE_OPTS applies f_jpg,q_auto,w_1200,h_630,c_fill.
                images: (product.images && product.images.length > 0)
                    ? [{ url: getCloudinaryUrl(product.images[0], OG_IMAGE_OPTS), width: 1200, height: 630 }]
                    : [],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${product.title} - Wholesale Bundle`,
                description: `${product.bundleQty} piece bundle at ₹${product.bundlePrice}`,
                images: (product.images && product.images.length > 0)
                    ? [getCloudinaryUrl(product.images[0], OG_IMAGE_OPTS)]
                    : [],
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
            slug: product.slug,
        }));
    } catch (error) {
        return [];
    }
}

export default async function ProductPage({ params }: ProductPageProps) {
    let product;

    try {
        product = await wholesaleProductsApi.getBySlug(params.slug);
    } catch (error) {
        notFound();
    }

    const breadcrumbItems = [
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        { name: product.category || 'Clothing', url: `/products?category=${product.category}` },
    ];

    // Add Sub-category if tags exist
    if (product.tags && product.tags.length > 0) {
        breadcrumbItems.push({
            name: product.tags[0],
            url: `/products?category=${product.category}&tag=${product.tags[0]}`
        });
    }

    breadcrumbItems.push({ name: product.title, url: `/product/${product.slug}` });

    return (
        <>
            {/* SEO: Product Schema */}
            <ProductSchema product={product} />

            {/* Tracking: Record this view in browser history (Currently Hidden)
            <RecentlyViewedTracker productId={product.id} />
            */}

            <main key={params.slug} className="min-h-screen bg-gray-50/50">
                <div className="container mx-auto px-6 py-12 max-w-7xl">
                    {/* SEO: Breadcrumb Navigation */}
                    <div className="mb-6 flex items-center justify-between">
                        <Breadcrumbs items={breadcrumbItems} />
                        <Link
                            href={`/products?category=${product.category}`}
                            className="text-sm font-bold text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to {product.category}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                        {/* Left Column: Images (7 columns) */}
                        <div className="lg:col-span-7">
                            <ProductImageGallery images={product.images || []} title={product.title} />
                        </div>

                        {/* Right Column: Product Info (5 columns) */}
                        <div className="lg:col-span-5 space-y-8">
                            <div>
                                {/* Category Badge */}
                                {product.category && (
                                    <div className="mb-3 flex gap-2">
                                        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                                            {product.category}
                                        </span>
                                        {product.tags?.[0] && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs font-bold tracking-widest text-primary uppercase">
                                                    {product.tags[0]}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Product Title - H1 for SEO */}
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4 leading-tight">
                                    {product.title}
                                </h1>

                                {/* Price */}
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <div className="flex items-baseline gap-2.5">
                                        <span className="text-3xl md:text-4xl font-heading font-bold text-primary">
                                            ₹{product.bundlePrice.toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-base text-gray-500 font-medium">/ bundle</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2 font-medium">
                                        ₹{(product.bundlePrice / product.bundleQty).toFixed(0)} per piece • GST Included
                                    </p>
                                </div>

                                {/* Bundle Configuration - Clean Grid Spec */}
                                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
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
                                        {Object.entries(product.bundleComposition || {}).map(([size, qty]) => (
                                            <div
                                                key={size}
                                                className="flex flex-col items-center justify-center bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
                                            >
                                                <span className="text-xs text-gray-500 mb-1">{size}</span>
                                                <span className="text-lg font-bold text-gray-900">{qty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Color Variants */}
                                {product.styleCode && (
                                    <ColorVariants styleCode={product.styleCode} currentProductId={product.id} />
                                )}
                            </div>

                            {/* Add to Cart Section */}
                            <div className="space-y-4">
                                <AddToCartSection product={product} />
                                <WhatsAppInquiry productTitle={product.title} productSlug={product.slug} />
                            </div>

                            {/* Delivery Check Section */}
                            <PincodeCheck />

                            {/* Description - Accordion style or clean block */}
                            {product.description && (
                                <div className="prose prose-sm text-gray-600 leading-relaxed max-w-none">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                                    <p>{product.description}</p>
                                </div>
                            )}

                            {/* Social Share Section */}
                            <SocialShare title={product.title} slug={product.slug} />

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

                    {/* Related Products Section */}
                    {product.category && (
                        <RelatedProducts category={product.category} currentProductId={product.id} />
                    )}

                    {/* Recently Viewed Section (User History) (Currently Hidden)
                    <RecentlyViewedProducts currentProductId={product.id} />
                    */}
                </div>
            </main>

            {/* Mobile Sticky Add to Cart */}
            <MobileStickyAddToCart product={product} />
        </>
    );
}
