'use client';

import React, { useState } from 'react';
import { MapPin, Truck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { shippingApi } from '@/lib/api/wholesaleApi';

export const PincodeCheck: React.FC = () => {
    const [pincode, setPincode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (pincode.length !== 6) {
            setError('Please enter a 6-digit pincode');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setError(null);

        try {
            const data = await shippingApi.checkPincode(pincode);
            setResult(data);
            setStatus('success');
        } catch (err: any) {
            setError(err.message || 'Failed to check pincode');
            setStatus('error');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4 text-primary" />
                Delivery Check
            </h2>

            <form onSubmit={handleCheck} className="flex gap-2">
                <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Enter Pincode"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                    />
                </div>
                <button
                    type="submit"
                    disabled={status === 'loading' || pincode.length !== 6}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {status === 'loading' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        'Check'
                    )}
                </button>
            </form>

            {status === 'success' && result && (
                <div className={`mt-4 p-3 rounded-lg border flex items-start gap-3 ${
                    result.serviceable 
                        ? 'bg-green-50 border-green-100 text-green-800' 
                        : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                    {result.serviceable ? (
                        <>
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold">{result.message}</p>
                                <p className="text-xs opacity-80 mt-1">Delivery by {result.deliveryLabel}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold">Not Serviceable</p>
                                <p className="text-xs opacity-80 mt-1">{result.message}</p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {status === 'error' && error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
        </div>
    );
};
