'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
    const router = useRouter();
    const { signIn, user } = useAuthStore();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect based on role AFTER login
    useEffect(() => {
        if (!user) return;

        // Both superadmin and admin go to /admin dashboard
        if (user.role === 'superadmin' || user.role === 'admin') {
            router.replace('/admin');
        } else {
            router.replace('/');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(formData.email, formData.password);
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
            <div className="max-w-md w-full">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gradient mb-2">TNtrends</h1>
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
