'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore as useWholesaleCartStore } from '@/store/wholesaleCartStore';
import { useAuthStore } from '@/store/authStore';
import { wholesaleCheckoutApi } from '@/lib/api/wholesaleApi';
import { auth } from '@/lib/firebase';
import { useAuthToken } from '@/hooks/useAuthToken';
import { getCloudinaryUrl } from '@/lib/cloudinaryImage';

/**
 * Wholesale Checkout Page
 * Dedicated checkout for wholesale orders with GST breakdown
 */

interface CalculatedOrder {
    items: any[];
    subtotal: number;
    gstRate: number;
    gst: number;
    shipping: number;
    totalAmount: number;
}

export default function WholesaleCheckoutPage() {
    const router = useRouter();
    const { items, clearCart, fetchGSTRate, getSubtotal, getGST, getTotal, gstRate: storeGstRate } = useWholesaleCartStore();
    const { user } = useAuthStore();

    const [address, setAddress] = useState({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
    });

    const { authenticatedFetch } = useAuthToken();
    const [calculatedOrder, setCalculatedOrder] = useState<CalculatedOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const STORAGE_KEY = 'wholesale_checkout_address_v1';

    // ── Load Persisted Address ───────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setAddress(JSON.parse(saved));
                return; // Prioritize local draft
            } catch (e) {
                console.error('Failed to load saved address', e);
            }
        }

        // If no local draft, pull from User Profile
        if (user && user.addresses.length > 0) {
            const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
            const { id, label, isDefault, createdAt, lastUsedAt, ...pureAddress } = defaultAddr;
            setAddress({
                ...pureAddress,
                addressLine2: pureAddress.addressLine2 || '',
                country: 'India'
            });
            // Auto-confirm if no local draft exists (user has a default saved address)
            if (!localStorage.getItem(STORAGE_KEY)) {
                setIsAddressConfirmed(true);
                handleCalculate({
                    ...pureAddress,
                    addressLine2: pureAddress.addressLine2 || '',
                    country: 'India'
                });
            }
        }
    }, [user]);

    // ── Save Address on Change ───────────────────────────────────────────
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(address));
    }, [address]);

    const [isHydrated, setIsHydrated] = useState(false);

    // ── Track Zustand Hydration ──────────────────────────────────────────
    useEffect(() => {
        setIsHydrated(useWholesaleCartStore.persist.hasHydrated());
        const unsub = useWholesaleCartStore.persist.onFinishHydration(() => setIsHydrated(true));
        return () => {
            if (unsub) unsub();
        };
    }, []);

    useEffect(() => {
        fetchGSTRate();
    }, []);

    useEffect(() => {
        if (isHydrated && items.length === 0 && !isSuccess) {
            router.push('/products');
        }
    }, [items, isSuccess, isHydrated]);

    // ── Pincode Watcher (Edge Case: City/State Mapping) ──────────────────
    useEffect(() => {
        if (address.pincode.length === 6) {
            // Future: Call a pincode API to auto-fill City/State
            // For now, we clear errors and trigger serviceability check if needed
            setError('');
        }
    }, [address.pincode]);

    const updateAddress = (updates: Partial<typeof address>) => {
        // Sanitization: Trim all strings and normalize phone
        const sanitized = Object.entries(updates).reduce((acc, [key, val]) => {
            let value = typeof val === 'string' ? val.trimStart() : val;

            // Phone specific sanitization
            if (key === 'phone') {
                value = value.replace(/[^\d+]/g, '').replace(/^\+91/, '');
            }

            return { ...acc, [key]: value };
        }, {});

        setAddress(prev => ({ ...prev, ...sanitized }));
    };

    const handleConfirmAddress = async () => {
        // Validation
        if (!address.name || !address.phone || !address.addressLine1 || !address.city || !address.state || !address.pincode) {
            setError('Please fill in all required address fields');
            return;
        }
        if (address.phone.length < 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        if (address.pincode.length < 6) {
            setError('Please enter a valid 6-digit pincode');
            return;
        }

        setError('');
        setIsAddressConfirmed(true);
        handleCalculate(); // Auto-calculate on confirmation
    };

    const handleCalculate = async (overrideAddress?: any) => {
        try {
            setLoading(true);
            setError('');

            const checkoutItems = items.map((item) => ({
                productId: item.product.id,
                bundlesOrdered: item.bundlesOrdered,
            }));

            const result = await wholesaleCheckoutApi.calculate(checkoutItems, overrideAddress || address);
            setCalculatedOrder(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async (isTest: boolean = false) => {
        if (!calculatedOrder) {
            alert('Please calculate shipping first');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // ── Zero Trust: Send ONLY productId + quantity + address ──────────
            // The backend fetches prices itself. We never trust what the client says.
            const cartItems = items.map((item) => ({
                productId: item.product.id,
                bundlesOrdered: item.bundlesOrdered,
            }));

            // ── Idempotency Key: Prevents double orders on retry ──────────────
            // We hash the cart contents + user session timestamp so retries
            // within the same checkout session return the same existing order.
            const idempotencyKey = btoa(
                JSON.stringify(cartItems) + address.pincode + Date.now().toString().slice(0, -4)
            );

            const response = await authenticatedFetch('/api/wholesale/orders', {
                method: 'POST',
                body: JSON.stringify({
                    cartItems,
                    address,
                    // Send expected total so backend can detect stale prices
                    expectedTotalAmount: calculatedOrder.totalAmount,
                    idempotencyKey,
                    isTestMode: isTest, // Simplified bypass flag
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to create order');
            }

            const { orderId, order } = data.data;

            if (isTest) {
                // Test mode: bypass payment gateway
                setIsSuccess(true);
                clearCart();
                router.push(`/orders/${orderId}?success=true`);
                return;
            }

            // Initiate Razorpay payment popup
            await initiatePayment(orderId);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const initiatePayment = async (orderId: string) => {
        // Step 1: Create Razorpay order on our backend
        const response = await authenticatedFetch('/api/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({ orderId }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to initialize payment');
        }

        const { razorpayOrderId, amount } = data.data;

        // Step 2: Open Razorpay checkout popup
        return new Promise<void>((resolve, reject) => {
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount,
                currency: 'INR',
                name: 'ORCHID Wholesale',
                description: `Order #${orderId.slice(0, 8)}`,
                order_id: razorpayOrderId,
                // Step 3: On successful payment, verify signature on our backend
                handler: async (rzpResponse: any) => {
                    try {
                        setLoading(true);
                        const verifyRes = await authenticatedFetch('/api/payment/verify', {
                            method: 'POST',
                            body: JSON.stringify({
                                orderId,
                                razorpayOrderId: rzpResponse.razorpay_order_id,
                                razorpayPaymentId: rzpResponse.razorpay_payment_id,
                                razorpaySignature: rzpResponse.razorpay_signature,
                            }),
                        });

                        const verifyData = await verifyRes.json();
                        if (!verifyData.success) {
                            throw new Error(verifyData.error || 'Payment verification failed');
                        }

                        // Success — clear cart and redirect
                        setIsSuccess(true);
                        clearCart();
                        router.push(`/order-success?id=${orderId}`);
                        resolve();
                    } catch (err: any) {
                        setError(err.message || 'Payment verification failed');
                        setLoading(false);
                        reject(err);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setError('Payment was cancelled. You can try again.');
                        reject(new Error('Payment cancelled by user'));
                    },
                    escape: true,
                    backdropclose: false,
                },
                prefill: {
                    contact: address.phone,
                    name: address.name,
                },
                theme: {
                    color: '#2D6A4F',
                },
                notes: {
                    internalOrderId: orderId,
                },
            };

            try {
                const rzp = new (window as any).Razorpay(options);
                
                // Handle payment failures inside popup
                rzp.on('payment.failed', (failResponse: any) => {
                    const errorDesc = failResponse?.error?.description || 'Payment failed. Please try again.';
                    setError(errorDesc);
                    setLoading(false);
                });

                rzp.open();
            } catch (sdkError) {
                reject(new Error('Razorpay SDK failed to load. Please refresh and try again.'));
            }
        });
    };

    if (!isHydrated) {
        return null;
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="container mx-auto px-6 max-w-7xl">
                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Checkout</h1>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Left Column: Forms */}
                    <div className="lg:col-span-7 space-y-8">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                                <span className="bg-red-100 p-1 rounded-full">⚠️</span>
                                {error}
                            </div>
                        )}

                        {/* Step 1: Delivery Address */}
                        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isAddressConfirmed ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                                            {isAddressConfirmed ? '✓' : '1'}
                                        </span>
                                        Delivery Address
                                    </h2>
                                    {isAddressConfirmed && (
                                        <button
                                            onClick={() => setIsAddressConfirmed(false)}
                                            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                                        >
                                            Change
                                        </button>
                                    )}
                                </div>

                                {isAddressConfirmed ? (
                                    /* Summary Mode (Amazon Style) */
                                    <div className="flex flex-col gap-1 ml-11 animate-in fade-in duration-300">
                                        <p className="font-bold text-gray-900 leading-tight">Delivering to {address.name}</p>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                                            {address.city}, {address.state} - {address.pincode}
                                        </p>
                                        <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                                            <span className="font-semibold text-gray-900">Phone:</span> {address.phone}
                                        </p>
                                        <button className="text-blue-600 text-xs font-semibold mt-2 hover:underline w-fit">
                                            Add delivery instructions
                                        </button>
                                    </div>
                                ) : (
                                    /* Selection Mode (Amazon Style List + Form) */
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Saved Addresses Choice */}
                                        {user && user.addresses.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {user.addresses.map((saved) => (
                                                    <button
                                                        key={saved.id}
                                                        onClick={() => {
                                                            const { id, label, isDefault, createdAt, lastUsedAt, ...pureAddress } = saved;
                                                            const finalAddress = {
                                                                ...pureAddress,
                                                                addressLine2: pureAddress.addressLine2 || '',
                                                                country: 'India'
                                                            };
                                                            setAddress(finalAddress);
                                                            setIsAddressConfirmed(true);
                                                            handleCalculate(finalAddress);
                                                        }}
                                                        className={`p-4 rounded-xl border-2 text-left transition-all group ${address.addressLine1 === saved.addressLine1 && address.pincode === saved.pincode
                                                            ? 'border-primary bg-primary/[0.03] shadow-inner'
                                                            : 'border-gray-100 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500 rounded flex items-center gap-1 group-hover:bg-white group-hover:text-primary transition-colors">
                                                                {saved.label || 'Saved'}
                                                            </span>
                                                            {saved.isDefault && (
                                                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Default</span>
                                                            )}
                                                        </div>
                                                        <p className="font-bold text-gray-900 text-sm mb-1">{saved.name}</p>
                                                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                                                            {saved.addressLine1}, {saved.city}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Divider */}
                                        {user && user.addresses.length > 0 && (
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                                                <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-white px-4 text-gray-400 font-bold">Or Enter New Address</span></div>
                                            </div>
                                        )}

                                        <form className="grid grid-cols-2 gap-5" onSubmit={(e) => e.preventDefault()}>
                                            <div className="col-span-2">
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    autoComplete="name"
                                                    value={address.name}
                                                    onChange={(e) => updateAddress({ name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="Enter your name"
                                                    required
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="tel"
                                                    autoComplete="tel"
                                                    value={address.phone}
                                                    onChange={(e) => updateAddress({ phone: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="10-digit mobile number"
                                                    required
                                                    maxLength={10}
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Pincode</label>
                                                <input
                                                    type="text"
                                                    name="postal-code"
                                                    autoComplete="postal-code"
                                                    value={address.pincode}
                                                    onChange={(e) => updateAddress({ pincode: e.target.value.replace(/\D/g, '') })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="6-digit pincode"
                                                    maxLength={6}
                                                    required
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Detailed Address</label>
                                                <input
                                                    type="text"
                                                    name="address-line1"
                                                    autoComplete="address-line1"
                                                    value={address.addressLine1}
                                                    onChange={(e) => updateAddress({ addressLine1: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all mb-3 placeholder:text-gray-400"
                                                    placeholder="House No, Building, Street"
                                                    required
                                                    maxLength={100}
                                                />
                                                <input
                                                    type="text"
                                                    name="address-line2"
                                                    autoComplete="address-line2"
                                                    value={address.addressLine2}
                                                    onChange={(e) => updateAddress({ addressLine2: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="Area, Landmark (Optional)"
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">City</label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    autoComplete="address-level2"
                                                    value={address.city}
                                                    onChange={(e) => updateAddress({ city: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="City"
                                                    required
                                                    maxLength={50}
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">State</label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    autoComplete="address-level1"
                                                    value={address.state}
                                                    onChange={(e) => updateAddress({ state: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                                    placeholder="State"
                                                    required
                                                    maxLength={50}
                                                />
                                            </div>
                                        </form>

                                        <button
                                            onClick={handleConfirmAddress}
                                            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all shadow-md shadow-primary/10"
                                        >
                                            Confirm Delivery & Use This Address
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-2">
                            <button
                                onClick={() => router.push('/wholesale/cart')}
                                className="text-gray-500 font-medium hover:text-gray-900 flex items-center gap-2 transition-colors"
                            >
                                ← Back to Cart
                            </button>
                            {!isAddressConfirmed && (
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Step 1: Delivery Details</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-5 relative">
                        <div className="bg-white rounded-xl p-6 shadow-soft sticky top-24">
                            <h2 className="text-xl font-heading font-bold text-gray-900 mb-6">Order Summary</h2>

                            {/* Mini Cart Items */}
                            <div className="max-h-60 overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin scrollbar-thumb-gray-200">
                                {items.map((item) => (
                                    <div key={item.product.id} className="flex gap-4 items-start">
                                        <div className="w-16 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                                            {item.product.images.length > 0 && (
                                                <img 
                                                    src={getCloudinaryUrl(item.product.images[0], { width: 160 })} 
                                                    alt="" 
                                                    className="w-full h-full object-cover" 
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{item.product.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {item.bundlesOrdered} {item.bundlesOrdered === 1 ? 'bundle' : 'bundles'} × {item.product.bundleQty} pcs
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            ₹{(item.bundlesOrdered * item.product.bundlePrice).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="bg-gray-50/80 rounded-xl p-6 mb-6 border border-gray-100 transition-all duration-500">
                                {calculatedOrder && isAddressConfirmed ? (
                                    <div className="space-y-4 animate-in fade-in duration-500">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Subtotal (Net Value)</span>
                                            <span className="font-bold text-gray-900">₹{calculatedOrder.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">GST ({(calculatedOrder.gstRate * 100).toFixed(0)}%)</span>
                                            <span className="font-bold text-gray-900">₹{calculatedOrder.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium font-medium">Delivery Charges</span>
                                            <span className="font-bold text-gray-900">
                                                {calculatedOrder.shipping === 0 ? (
                                                    <span className="text-green-600 uppercase tracking-widest text-[11px] font-bold">Free Shipping</span>
                                                ) : (
                                                    `₹${calculatedOrder.shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                                )}
                                            </span>
                                        </div>

                                        <div className="border-t border-gray-200 pt-5 flex justify-between items-center">
                                            <div>
                                                <span className="block text-[11px] font-black text-primary uppercase tracking-widest mb-1">Payable Now</span>
                                                <span className="text-lg font-bold text-gray-900">Grand Total</span>
                                            </div>
                                            <span className="text-3xl font-heading font-black text-primary">₹{calculatedOrder.totalAmount.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Subtotal (Net Value)</span>
                                            <span className="font-bold text-gray-900">₹{getSubtotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">GST EXTRA ({(storeGstRate * 100).toFixed(0)}%)</span>
                                            <span className="font-bold text-gray-900 text-base">₹{getGST().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold text-blue-600/70 border-b border-blue-100 pb-4 mb-2">
                                            <span className="uppercase tracking-widest">Delivery Charges</span>
                                            <span className="uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Pending Address</span>
                                        </div>

                                        <div className="pt-2 flex justify-between items-center border-b border-gray-100 pb-5">
                                            <div>
                                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Total</span>
                                                <span className="text-lg font-bold text-gray-900">Total Payable</span>
                                            </div>
                                            <span className="text-3xl font-heading font-black text-gray-900 opacity-50">₹{getTotal().toLocaleString('en-IN')}</span>
                                        </div>

                                        <div className="pt-4">
                                            <p className="text-[10px] text-center text-gray-400 uppercase tracking-[0.15em] font-bold leading-relaxed px-4">
                                                Confirm your delivery address to calculate final taxes and shipping
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Place Order Button */}
                            <button
                                onClick={() => handlePlaceOrder(false)}
                                disabled={loading || !calculatedOrder || !isAddressConfirmed}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${!loading && calculatedOrder && isAddressConfirmed
                                    ? 'bg-text-primary text-white hover:bg-black shadow-lg shadow-black/10'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                        Securing Order...
                                    </span>
                                ) : (
                                    'Place Order & Pay Now'
                                )}
                            </button>




                            <div className="flex items-center justify-center gap-3 text-xs text-gray-400 font-medium tracking-wide">
                                <div className="flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    <span>100% Secure Transaction</span>
                                </div>
                                <span className="w-1 h-1 rounded-full bg-gray-200"></span>
                                <span>Secured by Razorpay</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
