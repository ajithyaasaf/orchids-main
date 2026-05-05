'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');
    const { signIn, user } = useAuthStore();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial check: if already logged in, redirect away
    useEffect(() => {
        if (!user || loading) return;

        if (redirectPath) {
            router.replace(redirectPath);
        } else if (user.role === 'superadmin' || user.role === 'admin') {
            router.replace('/admin');
        } else {
            router.replace('/profile');
        }
    }, [user, redirectPath, router, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(formData.email, formData.password);
            
            // Re-fetch user from store to get updated role
            const user = useAuthStore.getState().user;
            
            // Manual redirect ONLY after successful backend session creation
            // We use window.location.href instead of router.replace to bypass Next.js Router Cache
            // which might have cached a previous middleware redirect from unauthenticated attempts.
            if (redirectPath) {
                window.location.href = redirectPath;
            } else if (user?.role === 'superadmin' || user?.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/profile';
            }
        } catch (err: any) {
            let userFriendlyMessage = 'Failed to login. Please check your credentials.';
            
            // Map raw Firebase errors to user-friendly messages
            if (err.message?.includes('auth/invalid-credential') || err.message?.includes('auth/wrong-password') || err.message?.includes('auth/user-not-found')) {
                userFriendlyMessage = 'Invalid email or password.';
            } else if (err.message?.includes('auth/too-many-requests')) {
                userFriendlyMessage = 'Too many failed login attempts. Please try again later.';
            } else if (err.message?.includes('auth/api-key-not-valid') || err.message?.includes('auth/invalid-api-key')) {
                userFriendlyMessage = 'System configuration error. Please contact support.';
            } else if (err.message?.includes('network-request-failed')) {
                userFriendlyMessage = 'Network error. Please check your internet connection.';
            } else if (err.message) {
                // Remove the "Firebase:" prefix if it exists but keep the core message if it's not a known code
                userFriendlyMessage = err.message.replace('Firebase:', '').trim();
            }

            setError(userFriendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
            <div className="max-w-md w-full">

                <div className="text-center mb-8">
                    <div className="relative w-64 h-20 mx-auto mb-4">
                        <Image
                            src="/images/logo.png"
                            alt="ORCHID Wholesale"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h2 className="text-2xl font-semibold text-text-primary">Welcome Back</h2>
                </div>

                <div className="bg-white rounded-xl shadow-soft p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span>Don't have an account? </span>
                        <Link href="/auth/register" className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
