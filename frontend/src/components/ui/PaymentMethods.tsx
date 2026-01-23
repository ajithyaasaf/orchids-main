'use client';

import React from 'react';
import Image from 'next/image';

interface PaymentMethod {
    name: string;
    icon: React.ReactNode;
}

// SVG components for payment icons
const RazorpayIcon = () => (
    <svg viewBox="0 0 120 40" className="h-8 w-auto">
        <rect fill="#072654" width="120" height="40" rx="4" />
        <text x="10" y="26" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">razorpay</text>
    </svg>
);

const UPIIcon = () => (
    <svg viewBox="0 0 80 40" className="h-8 w-auto">
        <rect fill="#097939" width="80" height="40" rx="4" />
        <text x="12" y="26" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">UPI</text>
    </svg>
);

const VisaIcon = () => (
    <svg viewBox="0 0 80 40" className="h-8 w-auto">
        <rect fill="#1A1F71" width="80" height="40" rx="4" />
        <text x="8" y="28" fill="#F7B600" fontSize="22" fontWeight="bold" fontFamily="Arial" style={{ fontStyle: 'italic' }}>VISA</text>
    </svg>
);

const MastercardIcon = () => (
    <svg viewBox="0 0 80 40" className="h-8 w-auto">
        <rect fill="#000000" width="80" height="40" rx="4" />
        <circle cx="28" cy="20" r="10" fill="#EB001B" />
        <circle cx="40" cy="20" r="10" fill="#F79E1B" />
        <path d="M 34 12 A 10 10 0 0 1 34 28 A 10 10 0 0 1 34 12" fill="#FF5F00" />
    </svg>
);

const RuPayIcon = () => (
    <svg viewBox="0 0 80 40" className="h-8 w-auto">
        <rect fill="#097939" width="80" height="40" rx="4" />
        <text x="6" y="26" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">RuPay</text>
    </svg>
);

const NetBankingIcon = () => (
    <svg viewBox="0 0 80 40" className="h-8 w-auto">
        <rect fill="#4A5568" width="80" height="40" rx="4" />
        <g transform="translate(15, 10)">
            <rect x="0" y="10" width="50" height="3" fill="white" />
            <rect x="5" y="13" width="8" height="7" fill="white" />
            <rect x="16" y="13" width="8" height="7" fill="white" />
            <rect x="27" y="13" width="8" height="7" fill="white" />
            <rect x="38" y="13" width="8" height="7" fill="white" />
            <polygon points="25,0 0,10 50,10" fill="white" />
        </g>
    </svg>
);

const PAYMENT_METHODS: PaymentMethod[] = [
    { name: 'Razorpay', icon: <RazorpayIcon /> },
    { name: 'UPI', icon: <UPIIcon /> },
    { name: 'Visa', icon: <VisaIcon /> },
    { name: 'Mastercard', icon: <MastercardIcon /> },
    { name: 'RuPay', icon: <RuPayIcon /> },
    { name: 'Net Banking', icon: <NetBankingIcon /> },
];

interface PaymentMethodsProps {
    className?: string;
    compact?: boolean; // For checkout page (smaller version)
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ className = '', compact = false }) => {
    return (
        <div className={`${className}`}>
            {!compact && (
                <p className="text-center text-sm font-medium text-gray-400 mb-4">
                    We Accept All Major Payment Methods
                </p>
            )}

            <div className={`flex items-center justify-center gap-3 flex-wrap ${compact ? 'gap-2' : 'gap-4'}`}>
                {PAYMENT_METHODS.map((method) => (
                    <div
                        key={method.name}
                        className="grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100"
                        title={method.name}
                    >
                        {method.icon}
                    </div>
                ))}
            </div>

            {!compact && (
                <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                    <span className="inline-block">🔒</span>
                    100% Secure & Encrypted Transactions
                </p>
            )}
        </div>
    );
};
