'use client';

import { useEffect } from 'react';

/**
 * Global Error Boundary for the Next.js Frontend.
 * Catches any backend SSR failures globally, preventing blank white screens.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Output the error to telemetry/logging service if applicable
        console.error('SSR or Component Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="max-w-md w-full text-center bg-white rounded-xl shadow-soft p-8 border border-gray-100">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-6">
                    We're having trouble communicating with the server. Please check your connection and try again.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => reset()}
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors font-semibold"
                    >
                        Try Again
                    </button>
                    <a
                        href="/login"
                        className="block w-full border border-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Return to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
