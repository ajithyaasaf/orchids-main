'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Package, Loader2 } from 'lucide-react';
import { WholesaleOrder } from '@orchids/shared';
import { useAuthToken } from '@/hooks/useAuthToken';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    // Support both 'id' (Razorpay flow) and 'orderId' (Legacy)
    const orderId = searchParams.get('id') || searchParams.get('orderId');
    const [order, setOrder] = useState<WholesaleOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const { authenticatedFetch } = useAuthToken();

    useEffect(() => {
        const checkOrderStatus = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }

            try {
                // With Razorpay popup flow, payment verification already happened
                // inline in the checkout page before navigating here.
                // We just fetch the order to display its current status.
                const orderRes = await authenticatedFetch(`/api/wholesale/orders/${orderId}`);
                const orderData = await orderRes.json();

                if (orderData.success && orderData.data) {
                    setOrder(orderData.data);
                    
                    if (orderData.data.paymentStatus === 'paid') {
                        setPaymentStatus('success');
                    } else if (orderData.data.paymentStatus === 'failed') {
                        setPaymentStatus('failed');
                    } else {
                        setPaymentStatus('pending');
                    }
                } else {
                    setPaymentStatus('failed');
                }
            } catch (error) {
                console.error('Failed to fetch order status:', error);
                setPaymentStatus('failed');
            } finally {
                setLoading(false);
            }
        };

        checkOrderStatus();
    }, [orderId]);

    if (loading) {
        return (
            <div className="container-custom section min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-lg text-text-secondary">Verifying your payment...</p>
                    <p className="text-sm text-text-secondary mt-2">Please do not close or refresh this page.</p>
                </div>
            </div>
        );
    }

    if (!orderId) {
        return (
            <div className="container-custom section text-center py-16">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Request</h1>
                <p>Order ID is missing.</p>
                <Link href="/">
                    <Button className="mt-6">Return Home</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container-custom section">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-soft p-8 text-center">
                    
                    {paymentStatus === 'success' && (
                        <CheckCircle className="w-20 h-20 text-success mx-auto mb-6" />
                    )}
                    {paymentStatus === 'failed' && (
                        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                    )}
                    {paymentStatus === 'pending' && (
                        <Loader2 className="w-20 h-20 text-yellow-500 animate-spin mx-auto mb-6" />
                    )}

                    <h1 className="text-3xl font-bold text-text-primary mb-4">
                        {paymentStatus === 'success' ? 'Payment Successful!' :
                         paymentStatus === 'failed' ? 'Payment Failed' :
                         'Payment Pending'}
                    </h1>

                    <p className="text-text-secondary mb-8">
                        {paymentStatus === 'success' ? "Thank you for your purchase. Your payment has been verified." :
                         paymentStatus === 'failed' ? "Unfortunately, your payment could not be processed. Any deducted amount will be refunded by your bank within 3-5 business days." :
                         "Your payment is still being processed by the bank. We will notify you once it completes."}
                    </p>

                    {order && (
                        <div className="bg-background rounded-lg p-6 mb-8 text-left">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-text-secondary block">Order ID:</span>
                                    <p className="font-mono text-text-primary mt-1">{order.id}</p>
                                </div>
                                <div>
                                    <span className="text-text-secondary block">Total Amount:</span>
                                    <p className="font-semibold text-text-primary mt-1">₹{order.totalAmount}</p>
                                </div>
                                <div>
                                    <span className="text-text-secondary block">Payment Status:</span>
                                    <p className={`font-semibold capitalize mt-1 ${
                                        order.paymentStatus === 'paid' ? 'text-success' : 
                                        order.paymentStatus === 'failed' ? 'text-red-500' : 'text-yellow-600'
                                    }`}>
                                        {order.paymentStatus}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-text-secondary block">Order Status:</span>
                                    <p className="font-semibold text-primary capitalize mt-1">{order.orderStatus}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {paymentStatus !== 'failed' && (
                            <Link href="/profile">
                                <Button variant="primary" className="w-full sm:w-auto">
                                    <Package className="w-4 h-4 mr-2 inline" />
                                    Track Order
                                </Button>
                            </Link>
                        )}
                        <Link href={paymentStatus === 'failed' ? '/cart' : '/'}>
                            <Button variant="outline" className="w-full sm:w-auto">
                                {paymentStatus === 'failed' ? 'Try Again' : 'Continue Shopping'}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={
            <div className="container-custom section min-h-[60vh] flex items-center justify-center">
                <div className="text-center text-gray-500">Loading...</div>
            </div>
        }>
            <OrderSuccessContent />
        </Suspense>
    );
}
