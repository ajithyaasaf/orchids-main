'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NewsletterCta() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            setEmail('');
        }, 1500);
    };

    return (
        <section className="bg-text-primary pt-24 pb-24 relative overflow-hidden">
            {/* Background elements for premium dark feel */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2 translate-y-1/2" />

            <div className="container-custom relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/10">
                            <Mail className="w-8 h-8 text-primary-light" />
                        </div>

                        <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
                            Join the Orchids Wholesale Network
                        </h2>

                        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                            Get exclusive access to our newest premium arrivals,
                            trend reports, and bulk pricing promotions directly in your inbox.
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your business email"
                                required
                                className="flex-grow px-6 py-4 rounded-full bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                            <Button
                                type="submit"
                                size="lg"
                                className="rounded-full px-8 py-4 h-auto text-lg whitespace-nowrap"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    'Subscribing...'
                                ) : status === 'success' ? (
                                    'Subscribed!'
                                ) : (
                                    <>
                                        Get Access
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <p className="text-sm text-gray-500 mt-6">
                            We respect your inbox. Unsubscribe at any time.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
