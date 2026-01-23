'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product, ProductSize } from '@tntrends/shared';
import { tagToSlug } from '@tntrends/shared';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { ProductColorVariants } from '@/components/products/ProductColorVariants';
import { ProductSizeSelector } from '@/components/products/ProductSizeSelector';
import { ProductQuantitySelector } from '@/components/products/ProductQuantitySelector';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { Truck, RotateCcw, Check } from 'lucide-react';
import { productApi } from '@/lib/api';
import { getProductPricing, isProductInStock } from '@/lib/pricingUtils';
import { trackViewItem } from '@/lib/trackingUtils';

interface ProductDetailClientProps {
    product: Product;
    initialVariants?: Product[];
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product: initialProduct, initialVariants = [] }) => {
    const router = useRouter();

    // --- STATE MANAGEMENT ---
    const [displayProduct, setDisplayProduct] = useState<Product>(initialProduct);

    // UI State
    const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Data State - Initialize with SSR data
    const [variants, setVariants] = useState<Product[]>(initialVariants);
    const [loadingVariants, setLoadingVariants] = useState(false);

    // --- EFFECT: SYNC SERVER DATA ---
    useEffect(() => {
        setDisplayProduct(initialProduct);
        setSelectedSize(null);
        setQuantity(1);
    }, [initialProduct]);

    // --- EFFECT: FETCH VARIANTS (H&M Logic) ---
    useEffect(() => {
        // Skip fetching if we already have initialVariants from SSR
        if (initialVariants && initialVariants.length > 0) {
            return;
        }

        const fetchVariants = async () => {
            if (!displayProduct.styleCode) return;

            setLoadingVariants(true);
            try {
                const { data } = await productApi.getAll({
                    styleCode: displayProduct.styleCode,
                    limit: 10,
                });

                if (data && data.length > 0) {
                    // Create a map to ensure uniqueness, filter out current product
                    const variantMap = new Map<string, Product>();
                    data.forEach((p: Product) => {
                        if (p.id !== displayProduct.id) {
                            variantMap.set(p.id, p);
                        }
                    });
                    setVariants(Array.from(variantMap.values()));
                }
            } catch (err) {
                console.debug("Failed to load color variants:", err);
            } finally {
                setLoadingVariants(false);
            }
        };

        fetchVariants();
    }, [displayProduct.styleCode, displayProduct.id, initialVariants]);

    // --- EFFECT: TRACK VIEW_ITEM EVENT ---
    useEffect(() => {
        // Track product view when component mounts or product changes
        trackViewItem(displayProduct, selectedSize || undefined);
    }, [displayProduct.id]); // Fire when product ID changes

    // --- HANDLER: SMOOTH VARIANT SWITCH ---
    const handleVariantSwitch = async (variantId: string) => {
        if (variantId === displayProduct.id) return;

        const targetVariant = variants.find(v => v.id === variantId);

        if (targetVariant) {
            setDisplayProduct(targetVariant);

            // Reset UI state when switching variants
            setSelectedSize(null);
            setQuantity(1);

            router.push(`/product/${targetVariant.id}`, { scroll: false });
            return;
        }

        // Fallback: fetch if not in variants array
        try {
            const { data: newProduct } = await productApi.getById(variantId);
            if (newProduct) {
                setDisplayProduct(newProduct);
                setSelectedSize(null);
                setQuantity(1);
                router.push(`/product/${newProduct.id}`, { scroll: false });
            }
        } catch (error) {
            console.error("Error switching variant:", error);
        }
    };

    // --- PRICE CALCULATIONS using centralized utilities ---
    const pricing = getProductPricing(displayProduct);
    const hasDiscount = pricing.hasDiscount;
    const savingsAmount = hasDiscount ? pricing.originalDisplayPrice - pricing.displayPrice : 0;

    // Improved kids size detection
    const isKidsProduct = displayProduct.sizes.some(size =>
        size.endsWith('Y') ||
        size.endsWith('M') ||
        size.toLowerCase().includes('years') ||
        /^\d{1,2}[Yy]$/.test(size)
    );

    return (
        <div className="container-custom section">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* --- LEFT COLUMN: IMAGE GALLERY --- */}
                <ProductImageGallery
                    images={displayProduct.images}
                    productTitle={displayProduct.title}
                />

                {/* --- RIGHT COLUMN: PRODUCT DETAILS --- */}
                <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                        <Link href={`/category/${displayProduct.category.toLowerCase()}`} className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition">
                            {displayProduct.category}
                        </Link>
                        {displayProduct.tags?.map(tag => (
                            <Link
                                key={tag}
                                href={`/shop/${tagToSlug(tag)}?category=${displayProduct.category}`}
                                className="text-xs font-bold text-primary uppercase tracking-wider bg-cyan-50 px-2 py-1 rounded hover:bg-cyan-100 transition"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>

                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        {displayProduct.title}
                    </h1>

                    {/* Price Block */}
                    <div className="flex items-baseline gap-3 mb-8 pb-6 border-b border-gray-100">
                        <span className="text-3xl font-bold text-primary">
                            ₹{pricing.displayPrice.toFixed(0)}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-xl text-gray-400 line-through decoration-1">
                                    ₹{pricing.originalDisplayPrice.toFixed(0)}
                                </span>
                                <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-sm font-semibold">
                                    Save ₹{savingsAmount.toFixed(0)}
                                </span>
                            </>
                        )}
                    </div>

                    {/* --- COLOR VARIANTS (H&M Style) --- */}
                    <ProductColorVariants
                        currentProduct={displayProduct}
                        variants={variants}
                        onVariantChange={handleVariantSwitch}
                    />

                    <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                        {displayProduct.description}
                    </p>

                    {/* Size Selection */}
                    <ProductSizeSelector
                        sizes={displayProduct.sizes}
                        stockBySize={displayProduct.stockBySize}
                        selectedSize={selectedSize}
                        onSizeChange={setSelectedSize}
                        isKidsProduct={isKidsProduct}
                    />

                    {/* Quantity & Add to Cart */}
                    <div className="flex gap-4 mb-8">
                        <ProductQuantitySelector
                            quantity={quantity}
                            onQuantityChange={setQuantity}
                        />

                        <AddToCartButton
                            product={displayProduct}
                            selectedSize={selectedSize}
                            quantity={quantity}
                        />
                    </div>

                    {!displayProduct.inStock && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-center font-medium border border-red-100 text-sm">
                            🚫 This product is currently unavailable.
                        </div>
                    )}

                    {/* Trust Badges */}
                    <div className="grid grid-cols-1 gap-4 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="p-2 bg-primary-light rounded-full text-primary">
                                <Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-900">Free Delivery</p>
                                <p className="text-xs text-gray-500">On all orders above ₹999</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="p-2 bg-primary-light rounded-full text-primary">
                                <RotateCcw className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-900">Easy Returns</p>
                                <p className="text-xs text-gray-500">7-day hassle-free return policy</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="p-2 bg-primary-light rounded-full text-primary">
                                <Check className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-900">Authentic Products</p>
                                <p className="text-xs text-gray-500">100% genuine quality checked</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};