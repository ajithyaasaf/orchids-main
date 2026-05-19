'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BannerMessage {
    id: string;
    message: string;
    cta?: string;
    ctaLink?: string;
    icon: string;
}

const BANNER_MESSAGES: BannerMessage[] = [
    {
        id: 'gst-input-credit',
        message: 'Claim GST Input Tax Credit — Get 5% GST B2B Tax Invoices for Your Shop!',
        cta: 'Shop Wholesale',
        ctaLink: '/search',
        icon: '💼'
    },
    {
        id: 'free-delivery-india',
        message: 'FREE Delivery Across India on Orders Above ₹4,999 (Flat ₹199 Below)',
        cta: 'Shop Now',
        ctaLink: '/search',
        icon: '🚚'
    }
];

const ROTATION_INTERVAL = 5000; // 5 seconds
const STORAGE_KEY = 'orchids-banner-dismissed';

export const PromotionalBanner: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // ✅ OPTIMIZATION: Memoize to prevent recalculation
    const currentMessage = useMemo(() => BANNER_MESSAGES[currentIndex], [currentIndex]);

    // ✅ OPTIMIZATION: useCallback to prevent function recreation
    const handleDismiss = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }, 300);
    }, []);

    // Check dismissal status - runs ONCE on mount
    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);

            if (hoursSinceDismissed < 24) {
                setIsVisible(false);
                return;
            }
        }
        setIsVisible(true);
    }, []);

    // Auto-rotate - ONLY runs when visible
    useEffect(() => {
        if (!isVisible) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % BANNER_MESSAGES.length);
        }, ROTATION_INTERVAL);

        return () => clearInterval(timer);
    }, [isVisible]);

    // ✅ OPTIMIZATION: Early return to prevent rendering hidden component
    if (!isVisible) return null;

    return (
        <div
            className={`relative bg-gradient-to-r from-primary via-primary-dark to-primary text-white py-2.5 px-4 shadow-sm z-50 transition-all duration-300 ${isClosing ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
                }`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between gap-4">
                    {/* Message Content */}
                    <div className="flex items-center justify-center gap-2 flex-1 text-center min-w-0">
                        <span className="text-lg hidden sm:inline flex-shrink-0">{currentMessage.icon}</span>
                        <p className="text-[13px] sm:text-base font-medium leading-tight">
                            {currentMessage.message}
                        </p>
                        {currentMessage.cta && (
                            <>
                                <span className="hidden sm:inline text-white/60 flex-shrink-0">|</span>
                                <Link
                                    href={currentMessage.ctaLink || '#'}
                                    className="text-[13px] sm:text-sm font-semibold hover:underline flex items-center gap-1 group whitespace-nowrap flex-shrink-0"
                                >
                                    {currentMessage.cta}
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Rotation Indicators */}
                    <div className="hidden md:flex items-center gap-1.5">
                        {BANNER_MESSAGES.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentIndex
                                    ? 'bg-white w-4'
                                    : 'bg-white/40 hover:bg-white/60'
                                    }`}
                                aria-label={`View banner ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleDismiss}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Dismiss banner"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
