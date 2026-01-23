'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { orderApi } from '@/lib/api';
import { CheckCircle, Package } from 'lucide-react';
import { Order } from '@tntrends/shared';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderId) {
            orderApi.getById(orderId)
                .then(({ data }) => setOrder(data))
                .catch((error) => console.error('Failed to load order:', error))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="container-custom section">
                <div className="max-w-2xl mx-auto text-center py-16">
                    <p>Loading order details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom section">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-soft p-8 text-center">
                    <CheckCircle className="w-20 h-20 text-success mx-auto mb-6" />

                    <h1 className="text-3xl font-bold text-text-primary mb-4">
                        Order Placed Successfully!
                    </h1>

                    <p className="text-text-secondary mb-8">
                        Thank you for your purchase. We've received your order and will send you a confirmation email shortly.
                    </p>

                    {order && (
                        <div className="bg-background rounded-lg p-6 mb-8 text-left">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-text-secondary">Order ID:</span>
                                    <p className="font-semibold text-text-primary">{order.id}</p>
                                </div>
                                <div>
                                    <span className="text-text-secondary">Total Amount:</span>
                                    <p className="font-semibold text-text-primary">₹{order.totalAmount}</p>
                                </div>
                                <div>
                                    <span className="text-text-secondary">Payment Status:</span>
                                    <p className="font-semibold text-success capitalize">{order.paymentStatus}</p>
                                </div>
                                <div>
                                    <span className="text-text-secondary">Order Status:</span>
                                    <p className="font-semibold text-primary capitalize">{order.orderStatus}</p>
                                </div>

                                {/* Coupon Savings (if any) */}
                                {order.appliedCoupon && (
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <div className="flex items-center justify-center gap-2 text-center">
                                            <span className="text-success text-lg font-semibold">
                                                🎉 You saved ₹{order.appliedCoupon.discount} with coupon
                                            </span>
                                            <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 text-sm font-medium rounded-full">
                                                {order.appliedCoupon.code}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/profile">
                            <Button variant="primary">
                                <Package className="w-4 h-4 mr-2" />
                                Track Order
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline">Continue Shopping</Button>
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
            <div className="container-custom section">
                <div className="max-w-2xl mx-auto text-center py-16">
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <OrderSuccessContent />
        </Suspense>
    );
}
