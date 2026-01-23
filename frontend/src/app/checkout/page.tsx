'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressSelector } from '@/components/ui/AddressSelector';
import { paymentApi, orderApi, checkoutApi } from '@/lib/api';
import { Address } from '@tntrends/shared';
import { AlertTriangle, X } from 'lucide-react';
import { trackBeginCheckout, trackAddPaymentInfo, trackPurchase } from '@/lib/trackingUtils';

// Declare Razorpay on the window object
declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items, clearCart, sanitizeCart, isSanitizing, unavailableItems, hasUnavailableItems, getValidItems } = useCartStore();
    const { user, addAddress, updateAddressUsage } = useAuthStore();

    // UI State
    const [loading, setLoading] = useState(false);
    const [calculationLoading, setCalculationLoading] = useState(false);
    const [showSaveAddressPrompt, setShowSaveAddressPrompt] = useState(false);
    const [saveAddressLabel, setSaveAddressLabel] = useState('Home');

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Checkout Calculation State
    const [checkoutData, setCheckoutData] = useState<any>(null);
    const [calculationError, setCalculationError] = useState<string | null>(null);

    // Coupon State (loaded from cart page via localStorage)
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

    // Address State
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [address, setAddress] = useState<Address>({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
    });

    // Track if initial sanitization has completed
    const [hasValidated, setHasValidated] = useState(false);

    // 1. Sanitize cart on checkout page load (critical for catching stale cart data)
    useEffect(() => {
        const runSanitization = async () => {
            await sanitizeCart();
            setHasValidated(true);
        };

        if (items.length > 0) {
            runSanitization();
        } else {
            setHasValidated(true);
        }
    }, []); // Only run on mount

    // 1b. Load applied coupon from localStorage (saved from cart page)
    useEffect(() => {
        try {
            const savedCoupon = localStorage.getItem('appliedCoupon');
            if (savedCoupon) {
                const { code } = JSON.parse(savedCoupon);
                setAppliedCouponCode(code);
            }
        } catch (error) {
            console.error('Failed to load saved coupon:', error);
        }
    }, []);

    // 2. Initialize & Protect Route - ONLY after validation is complete
    useEffect(() => {
        // Don't redirect until we've finished validating
        if (!hasValidated) return;

        // If no items or has unavailable items, redirect to cart
        if (items.length === 0 || hasUnavailableItems()) {
            router.replace('/cart');
            return;
        }

        if (!user) {
            router.push('/auth/login?redirect=/checkout');
            return;
        }

        // Track begin_checkout event for valid cart
        if (items.length > 0 && !hasUnavailableItems()) {
            const validItems = getValidItems();
            const totalValue = validItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
            trackBeginCheckout(validItems, totalValue);
        }
    }, [items, user, router, hasValidated, unavailableItems]);

    // 2. Calculate checkout total when pincode is entered
    useEffect(() => {
        const calculateCheckout = async () => {
            if (!/^\d{6}$/.test(address.pincode)) {
                setCheckoutData(null);
                setCalculationError(null);
                return;
            }

            setCalculationLoading(true);
            setCalculationError(null);

            try {
                const cartItems = items.map(item => ({
                    productId: item.product.id,
                    size: item.size,
                    color: item.product.color,
                    quantity: item.quantity,
                }));

                const { data } = await checkoutApi.calculate(cartItems, address.pincode, appliedCouponCode || undefined);
                setCheckoutData(data);
            } catch (error: any) {
                console.error('Checkout calculation error:', error);
                setCalculationError(error.message || 'Failed to calculate shipping');
                setCheckoutData(null);
            } finally {
                setCalculationLoading(false);
            }
        };

        const timer = setTimeout(calculateCheckout, 500);
        return () => clearTimeout(timer);
    }, [address.pincode, items, appliedCouponCode]);  // Re-calculate when coupon changes

    // Helper to handle input changes and clear errors
    const handleInputChange = (field: keyof typeof address, value: string) => {
        setAddress(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // 2b. Handle address selection from saved addresses
    const handleAddressSelect = (selectedAddress: Address, addressId?: string) => {
        setAddress(selectedAddress);
        setSelectedAddressId(addressId || null);
        setErrors({}); // Clear errors when selecting a saved address
    };

    // 3. Helper to load Razorpay SDK
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // 4. The Core Checkout Logic
    const handlePayment = async () => {
        if (!user) {
            alert('Please login to continue');
            return;
        }

        // Validation
        const newErrors: Record<string, string> = {};

        if (!address.name.trim()) newErrors.name = 'Full Name is required';

        if (!address.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(address.phone)) {
            newErrors.phone = 'Phone number must be exactly 10 digits';
        }

        if (!address.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required';
        if (!address.city.trim()) newErrors.city = 'City is required';
        if (!address.state.trim()) newErrors.state = 'State is required';

        if (!address.pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (!/^\d{6}$/.test(address.pincode)) {
            newErrors.pincode = 'Pincode must be exactly 6 digits';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // C. Ensure we have checkout calculation
        if (!checkoutData) {
            setErrors(prev => ({ ...prev, pincode: 'Please enter a valid pincode to calculate shipping.' }));
            return;
        }

        setLoading(true);
        let createdOrderId: string | null = null;

        try {
            // D. Load Razorpay SDK
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Failed to load payment gateway. Please check your internet connection.');
            }

            // E. Create Order in Database (Using calculated finalTotal)
            const orderPayload = {
                items: checkoutData.items.map((item: any) => ({
                    productId: item.productId,
                    productTitle: item.title,
                    productImage: items.find(i => i.product.id === item.productId)?.product.images[0]?.url,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.displayPrice,
                })),
                totalAmount: checkoutData.finalTotal,
                paymentStatus: 'pending' as const,
                orderStatus: 'placed' as const,
                address,
            };

            const { data: dbOrder } = await orderApi.create(orderPayload);
            createdOrderId = dbOrder.id;

            // F. Create Razorpay Order (SECURITY: Server validates amount from database)
            const { data: razorpayData } = await paymentApi.createOrder(dbOrder.id);

            // G. Configure Razorpay Modal
            const options = {
                key: razorpayData.key,
                amount: razorpayData.amount * 100,
                currency: razorpayData.currency,
                name: 'TNtrends',
                description: `Order #${dbOrder.id.slice(0, 8)}`,
                order_id: razorpayData.orderId,

                // H. Payment Success Handler
                handler: async function (response: any) {
                    try {
                        await paymentApi.verify({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            orderId: createdOrderId,
                        });

                        // Track purchase event
                        const purchaseItems = items.map(item => ({
                            product: item.product,
                            size: item.size,
                            quantity: item.quantity
                        }));
                        trackPurchase(
                            createdOrderId,
                            purchaseItems,
                            checkoutData.finalTotal,
                            checkoutData.shippingFee || 0,
                            appliedCouponCode ?? undefined
                        );

                        // Update lastUsedAt if saved address was used
                        if (selectedAddressId) {
                            try {
                                await updateAddressUsage(selectedAddressId);
                            } catch (error) {
                                console.error('Failed to update address usage:', error);
                            }
                        }

                        // Prompt to save address if new address was used
                        const isNewAddress = !selectedAddressId;
                        if (isNewAddress && user && user.addresses && user.addresses.length < 10) {
                            setShowSaveAddressPrompt(true);
                            setLoading(false);
                        } else {
                            clearCart();
                            // Clear applied coupon from localStorage
                            localStorage.removeItem('appliedCoupon');
                            router.push(`/order-success?orderId=${createdOrderId}`);
                        }
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        alert('Payment verification failed. Please contact support.');
                        router.push('/profile#orders');
                    }
                },
                prefill: {
                    name: address.name,
                    email: user.email || '',
                    contact: address.phone,
                },
                theme: {
                    color: '#00B0B5', // Note: Razorpay requires hex value, references tailwind primary
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            // I. Track add_payment_info event
            const validItems = items.map(item => ({
                product: item.product,
                size: item.size,
                quantity: item.quantity
            }));
            trackAddPaymentInfo(validItems, checkoutData.finalTotal, 'razorpay');

            // J. Open the Modal
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                console.error('Payment failed:', response.error);
                alert('Payment failed. Please try again.');
                setLoading(false);
            });

            razorpay.open();

        } catch (error: any) {
            console.error('Checkout Error:', error);
            alert(error.message || 'Checkout failed. Please try again.');
            setLoading(false);
        }
    };

    // 5. Handle saving address after order
    const handleSaveAddress = async () => {
        if (!user) return;

        try {
            await addAddress(address, saveAddressLabel);
            clearCart();
            localStorage.removeItem('appliedCoupon');
            router.push(`/order-success`);
        } catch (error: any) {
            console.error('Failed to save address:', error);
            // Still proceed to success page
            clearCart();
            localStorage.removeItem('appliedCoupon');
            router.push(`/order-success`);
        }
    };

    const handleSkipSaveAddress = () => {
        clearCart();
        localStorage.removeItem('appliedCoupon');
        router.push(`/order-success`);
    };

    // Derived values
    const hasValidPincode = /^\d{6}$/.test(address.pincode);
    const canPay = !loading && !calculationLoading && checkoutData && !calculationError;

    // Save Address Prompt Modal
    if (showSaveAddressPrompt) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">Save This Address?</h2>
                    <p className="text-text-secondary mb-6">
                        Would you like to save this address for faster checkout next time?
                    </p>

                    <Input
                        label="Address Label"
                        placeholder="e.g., Home, Office"
                        value={saveAddressLabel}
                        onChange={(e) => setSaveAddressLabel(e.target.value)}
                        className="mb-6"
                    />

                    <div className="flex gap-3">
                        <Button onClick={handleSaveAddress} className="flex-1">
                            Save Address
                        </Button>
                        <Button onClick={handleSkipSaveAddress} variant="secondary" className="flex-1">
                            Skip
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading while validating cart
    if (!hasValidated || isSanitizing) {
        return (
            <div className="container-custom section py-12">
                <div className="max-w-md mx-auto text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary">Validating your cart...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom section py-12">
            <h1 className="text-3xl font-bold text-text-primary mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Shipping Address Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-text-primary mb-6">Shipping Address</h2>

                        {/* Address Selector (for logged-in users with saved addresses) */}
                        {user && user.addresses && user.addresses.length > 0 && (
                            <div className="mb-6">
                                <AddressSelector
                                    onAddressSelect={handleAddressSelect}
                                    selectedAddressId={selectedAddressId}
                                />
                            </div>
                        )}

                        {/* Manual Address Form (always visible for editing/new) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Full Name *"
                                value={address.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                required
                                error={errors.name}
                            />

                            <Input
                                label="Phone Number *"
                                type="tel"
                                value={address.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                required
                                placeholder="10 digits"
                                error={errors.phone}
                            />

                            <div className="md:col-span-2">
                                <Input
                                    label="Address Line 1 *"
                                    value={address.addressLine1}
                                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                                    required
                                    error={errors.addressLine1}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Input
                                    label="Address Line 2"
                                    value={address.addressLine2 || ''}
                                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                                />
                            </div>

                            <Input
                                label="City *"
                                value={address.city}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                required
                                error={errors.city}
                            />

                            <Input
                                label="State *"
                                value={address.state}
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                required
                                error={errors.state}
                            />

                            <Input
                                label="Pincode *"
                                value={address.pincode}
                                onChange={(e) => handleInputChange('pincode', e.target.value)}
                                required
                                placeholder="6 digits"
                                error={errors.pincode}
                            />

                            <Input
                                label="Country"
                                value={address.country}
                                disabled
                            />
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24">
                        <h2 className="text-xl font-bold text-text-primary mb-6">Order Summary</h2>

                        {/* Loading State */}
                        {calculationLoading && hasValidPincode && (
                            <div className="text-center py-4 text-text-secondary">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                Calculating...
                            </div>
                        )}

                        {/* Error State */}
                        {calculationError && hasValidPincode && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-red-800 text-sm">{calculationError}</p>
                            </div>
                        )}

                        {/* Checkout Breakdown */}
                        {checkoutData && !calculationLoading && (
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-text-secondary">
                                    <span>Subtotal ({items.length} items)</span>
                                    <span>₹{checkoutData.subtotal.toFixed(0)}</span>
                                </div>

                                <div className="flex justify-between text-text-secondary">
                                    <span>Delivery</span>
                                    <span>
                                        {checkoutData.shippingFee === 0 ? (
                                            <span className="text-green-600 font-medium">FREE</span>
                                        ) : (
                                            <span>₹{checkoutData.shippingFee}</span>
                                        )}
                                    </span>
                                </div>

                                {checkoutData.shippingLabel && checkoutData.shippingFee > 0 && (
                                    <div className="text-xs text-text-secondary italic">
                                        ({checkoutData.shippingLabel})
                                    </div>
                                )}

                                {checkoutData.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>{checkoutData.discountLabel}</span>
                                        <span>-₹{checkoutData.discount}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-text-primary">Total</span>
                                        <span className="text-2xl font-bold text-primary">
                                            ₹{checkoutData.finalTotal.toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pay Now Button */}
                        <Button
                            onClick={handlePayment}
                            disabled={!canPay}
                            className="w-full h-12 text-lg font-semibold"
                            isLoading={loading}
                        >
                            {loading ? 'Processing...' : 'Pay Now'}
                        </Button>

                        {!hasValidPincode && (
                            <p className="text-xs text-text-secondary text-center mt-3">
                                Enter a valid 6-digit pincode to see shipping cost
                            </p>
                        )}

                        {/* Trust Badges */}
                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Secure Payment via Razorpay</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Your data is encrypted</span>
                            </div>
                            <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                <span>⚡</span>
                                <span>Powered by Razorpay</span>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="text-center">
                            <p className="text-[10px] text-text-secondary mb-2">We Accept</p>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                <span className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">💳 UPI</span>
                                <span className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">💳 Cards</span>
                                <span className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">🏦 NetBanking</span>
                                <span className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200">📱 Wallets</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
