'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
    {
        id: 1,
        quote: "The bundle pricing from Orchids transformed our margin structure. The quality of the export surplus is unmatched. Our customers love the newborn collection.",
        author: "Ramesh K.",
        store: "Kids Paradise Retail, Chennai",
        rating: 5,
    },
    {
        id: 2,
        quote: "Fastest delivery we've experienced from Tirupur to Mumbai. The GST invoices are always perfect, making accounting a breeze.",
        author: "Priya S.",
        store: "Little Trendz Boutique, Mumbai",
        rating: 5,
    },
    {
        id: 3,
        quote: "We shifted 80% of our sourcing to Orchids. Their girls' wear selection is trendy and the fabric holds up incredibly well after multiple washes.",
        author: "Mohammed F.",
        store: "Faiz Garments, Hyderabad",
        rating: 5,
    },
];

export function Testimonials() {
    return (
        <section className="section bg-slate-50 border-y border-gray-200">
            <div className="container-custom">

                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-sm font-bold text-primary tracking-widest uppercase mb-4 block">
                        Retailer Success Stories
                    </span>
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-text-primary mb-6">
                        Trusted by High-Volume Retailers
                    </h2>
                    <p className="text-lg text-text-secondary">
                        Don't just take our word for it. Hear from store owners across India who have scaled with our wholesale supply.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, i) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                            className="bg-white p-8 rounded-2xl shadow-soft border border-gray-100 relative group hover:shadow-lg transition-all"
                        >
                            {/* Decorative Quotation Mark */}
                            <div className="absolute top-6 right-8 text-6xl text-gray-100 font-serif leading-none group-hover:text-primary-light transition-colors">
                                "
                            </div>

                            <div className="flex mb-6 text-yellow-400 relative z-10">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-current" />
                                ))}
                            </div>

                            <p className="text-text-secondary mb-8 leading-relaxed relative z-10 italic">
                                "{testimonial.quote}"
                            </p>

                            <div className="mt-auto relative z-10">
                                <p className="font-bold text-text-primary">{testimonial.author}</p>
                                <p className="text-sm text-gray-500">{testimonial.store}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
