'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { doc, setDoc, collection } from 'firebase/firestore'; // Import collection
import { db, auth } from '@/lib/firebase'; // Import db AND auth

export default function RegisterPage() {
    const router = useRouter();
    const { signUp } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // 1. Create User in Firebase Authentication
            await signUp(formData.email, formData.password);

            // 2. Get the current user directly from auth to be safe
            const user = auth.currentUser;

            if (!user) {
                throw new Error('Registration failed: User not found after signup.');
            }

            // 3. Create User Document in Firestore (CRITICAL STEP)
            if (!db) {
                throw new Error('Firestore database instance is not initialized. Check your firebase.ts configuration.');
            }

            // Use collection() reference explicitly to prevent "Expected first argument..." errors
            // This ensures we are strictly following the modular SDK pattern
            const userRef = doc(collection(db, 'users'), user.uid);

            await setDoc(userRef, {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                role: 'customer', // Default role is always customer
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // 4. Success! Redirect to home
            router.push('/');
        } catch (err: any) {
            console.error("Registration Error:", err);
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary mb-2">TNtrends</h1>
                    <h2 className="text-2xl font-semibold text-slate-900">Create Account</h2>
                    <p className="text-slate-500 mt-2">Join TNtrends today</p>
                </div>

                <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Full Name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            autoComplete="name"
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            autoComplete="email"
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            autoComplete="new-password"
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            autoComplete="new-password"
                        />

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary-dark transition-colors"
                            isLoading={loading}
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500">Already have an account? </span>
                        <Link href="/auth/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}