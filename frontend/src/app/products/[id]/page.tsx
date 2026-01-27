'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WholesaleProduct } from '@tntrends/shared';
import { wholesaleProductsApi } from '@/lib/api/wholesaleApi';
import { useCartStore } from '@/store/wholesaleCartStore';

/**
 * Product Detail Page
 * Displays bundle configuration and allows adding bundles to cart
 */

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<WholesaleProduct | null>(null);
    const [bundleQty, setBundleQty] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { addBundle, fetchGSTRate } = useCartStore();

    useEffect(() => {
        loadProduct();
        fetchGSTRate();
    }, [params.id]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            const data = await wholesaleProductsApi.getById(params.id as string);
            setProduct(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;

        if (bundleQty > product.availableBundles) {
            alert(`Only ${product.availableBundles} bundles available`);
            return;
        }

        addBundle(product, bundleQty);
        alert(`Added ${bundleQty} bundle(s) to cart`);
        router.push('/cart');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading product...</div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-600">Error: {error || 'Product not found'}</div>
            </div>
        );
    }

    const totalPieces = bundleQty * product.bundleQty;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Product Images */}
                <div>
                    {product.images.length > 0 ? (
                        <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full rounded-lg shadow-lg"
                        />
                    ) : (
                        <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">No image available</span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    <h1 className="text-4xl font-bold mb-4">{product.title}</h1>

                    {product.isLocked && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-4">
                            🔒 Price locked (product has been ordered)
                        </div>
                    )}

                    <p className="text-gray-600 mb-6">{product.description}</p>

                    {/* Bundle Configuration */}
                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-blue-900">
                            Bundle Configuration
                        </h3>

                        <div className="mb-4">
                            <p className="text-2xl font-bold text-blue-900">
                                {product.bundleQty} pieces per bundle
                            </p>
                            {product.colorDescription && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {product.colorDescription}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="font-medium text-gray-700">Size Breakdown:</p>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(product.bundleComposition).map(([size, qty]) => (
                                    <div
                                        key={size}
                                        className="bg-white px-3 py-2 rounded border text-center"
                                    >
                                        <span className="font-bold">{size}:</span> {qty} pcs
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-green-900">
                                ₹{product.bundlePrice.toFixed(2)}
                            </span>
                            <span className="text-gray-600">per bundle</span>
                        </div>
                        <p className="text-sm text-gray-600">
                            ₹{(product.bundlePrice / product.bundleQty).toFixed(2)} per piece
                        </p>
                    </div>

                    {/* Stock Info */}
                    <div className="mb-6">
                        {product.inStock ? (
                            <div className="text-green-600 font-medium">
                                ✓ In Stock: {product.availableBundles} bundles available
                                ({product.totalPieces} total pieces)
                            </div>
                        ) : (
                            <div className="text-red-600 font-medium">✗ Out of Stock</div>
                        )}
                    </div>

                    {/* Bundle Selector */}
                    {product.inStock && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Number of Bundles:
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setBundleQty(Math.max(1, bundleQty - 1))}
                                        className="w-12 h-12 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold text-xl"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={bundleQty}
                                        onChange={(e) =>
                                            setBundleQty(
                                                Math.max(
                                                    1,
                                                    Math.min(
                                                        product.availableBundles,
                                                        Number(e.target.value)
                                                    )
                                                )
                                            )
                                        }
                                        className="w-20 h-12 text-center text-xl font-bold border-2 rounded-lg"
                                        min={1}
                                        max={product.availableBundles}
                                    />
                                    <button
                                        onClick={() =>
                                            setBundleQty(
                                                Math.min(product.availableBundles, bundleQty + 1)
                                            )
                                        }
                                        className="w-12 h-12 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold text-xl"
                                    >
                                        +
                                    </button>
                                    <span className="text-gray-600">
                                        = {totalPieces} total pieces
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                            >
                                Add {bundleQty} Bundle{bundleQty > 1 ? 's' : ''} to Cart
                            </button>

                            <p className="text-center text-gray-600">
                                Total: ₹{(bundleQty * product.bundlePrice).toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
