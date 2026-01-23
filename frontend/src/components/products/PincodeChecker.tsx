'use client';

import React, { useState } from 'react';
import { shippingApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PincodeCheckerProps {
    className?: string;
}

export function PincodeChecker({ className = '' }: PincodeCheckerProps) {
    const [pincode, setPincode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async () => {
        if (!/^\d{6}$/.test(pincode)) {
            setError('Please enter a valid 6-digit pincode');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data } = await shippingApi.checkPincode(pincode);
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Failed to check pincode');
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCheck();
        }
    };

    return (
        <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Check Delivery</h3>

            <div className="flex gap-2 mb-3">
                <Input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter Pincode"
                    className="flex-1"
                    maxLength={6}
                />
                <Button
                    onClick={handleCheck}
                    isLoading={loading}
                    size="sm"
                    variant="outline"
                >
                    Check
                </Button>
            </div>

            {/* Result Display */}
            {result && !error && (
                <div className="space-y-2">
                    {result.shippingFee === 0 ? (
                        <div className="flex items-center gap-2 text-green-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-semibold">{result.shippingLabel}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-text-primary">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold">₹{result.shippingFee} {result.shippingLabel}</p>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-text-secondary">
                        Estimated delivery: {result.estimatedDays}
                    </p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Initial State */}
            {!result && !error && !loading && (
                <p className="text-sm text-text-secondary">
                    Enter your pincode to check delivery availability
                </p>
            )}
        </div>
    );
}
