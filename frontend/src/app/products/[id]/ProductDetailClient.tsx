'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { WholesaleProduct } from '@orchids/shared';
import { useCartStore } from '@/store/wholesaleCartStore';

interface Props {
    product: WholesaleProduct;
}

// ---------------------------------------------------------------------------
// Helpers — never let formatting crash on missing data
// ---------------------------------------------------------------------------

/** Safely converts a value to a fixed-decimal string. Returns "—" if invalid. */
function safeFixed(value: number | null | undefined, decimals = 2): string {
    if (value == null || !isFinite(value) || isNaN(value)) return '—';
    return value.toFixed(decimals);
}

/** Safely formats a value as Indian-locale currency string. */
function safeRupees(value: number | null | undefined): string {
    if (value == null || !isFinite(value) || isNaN(value)) return '—';
    return value.toLocaleString('en-IN');
}

/** Returns true only when we have enough data to allow ordering. */
function canOrder(product: WholesaleProduct): boolean {
    return (
        product.inStock === true &&
        typeof product.bundlePrice === 'number' &&
        product.bundlePrice > 0 &&
        typeof product.bundleQty === 'number' &&
        product.bundleQty > 0 &&
        typeof product.availableBundles === 'number' &&
        product.availableBundles > 0
    );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProductDetailClient({ product }: Props) {
    const router = useRouter();
    const [bundleQty, setBundleQty] = useState(1);

    const { addBundle, fetchGSTRate } = useCartStore();

    useEffect(() => {
        fetchGSTRate();
    }, [fetchGSTRate]);

    // Safe, fallback-guarded values — no crashes even if DB data is incomplete
    const safePrice = product.bundlePrice ?? 0;
    const safeBundleQty = product.bundleQty ?? 0;
    const safeAvailable = product.availableBundles ?? 0;
    const pricePerPiece = safeBundleQty > 0 ? safePrice / safeBundleQty : 0;
    const totalPieces = bundleQty * safeBundleQty;
    const totalPrice = bundleQty * safePrice;

    const orderAllowed = canOrder(product);

    const handleAddToCart = () => {
        if (!product || !orderAllowed) return;

        if (bundleQty > safeAvailable) {
            alert(`Only ${safeAvailable} bundles available`);
            return;
        }

        addBundle(product, bundleQty);
        alert(`Added ${bundleQty} bundle(s) to cart`);
        router.push('/wholesale/cart');
    };

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
                    <div className="bg-primary-light border border-pink-200 p-6 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-primary">
                            Bundle Configuration
                        </h3>

                        <div className="mb-4">
                            <p className="text-2xl font-bold text-primary">
                                {safeBundleQty > 0 ? `${safeBundleQty} pieces per bundle` : 'Bundle size not set'}
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
                        {safePrice > 0 ? (
                            <>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-green-900">
                                        ₹{safeFixed(safePrice)}
                                    </span>
                                    <span className="text-gray-600">per bundle</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    ₹{safeFixed(pricePerPiece)} per piece
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm font-medium">Price not available — contact us for a quote.</span>
                            </div>
                        )}
                    </div>

                    {/* Stock Info */}
                    <div className="mb-6">
                        {product.inStock ? (
                            <div className="text-green-600 font-medium">
                                ✓ In Stock: {safeAvailable} bundles available
                                {product.totalPieces != null && `(${product.totalPieces} total pieces)`}
                            </div>
                        ) : (
                            <div className="text-red-600 font-medium">✗ Out of Stock</div>
                        )}
                    </div>

                    {/* Bundle Selector */}
                    {orderAllowed ? (
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
                                                        safeAvailable,
                                                        Number(e.target.value)
                                                    )
                                                )
                                            )
                                        }
                                        className="w-20 h-12 text-center text-xl font-bold border-2 rounded-lg"
                                        min={1}
                                        max={safeAvailable}
                                    />
                                    <button
                                        onClick={() =>
                                            setBundleQty(
                                                Math.min(safeAvailable, bundleQty + 1)
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
                                className="w-full py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary-dark transition-colors"
                            >
                                Add {bundleQty} Bundle{bundleQty > 1 ? 's' : ''} to Cart
                            </button>

                            <p className="text-center text-gray-600">
                                Total: ₹{safeFixed(totalPrice)}
                            </p>
                        </div>
                    ) : product.inStock && (
                        /* Product is in-stock but has missing price/qty data */
                        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-sm">Pricing information incomplete</p>
                                <p className="text-xs mt-1">This product is missing price or quantity data. Please contact us to place an order.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
