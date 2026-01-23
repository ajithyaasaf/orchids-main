import React from 'react';
import { Metadata } from 'next';
import { Mail, Phone, MapPin, Instagram, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Contact Us - TNtrends',
    description: 'Get in touch with TNtrends. Contact us for any queries about our products, orders, or customer support.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white py-16">
                <div className="container-custom">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
                    <p className="text-xl opacity-90">We're here to help and answer any questions you might have</p>
                </div>
            </div>

            {/* Contact Information */}
            <div className="container-custom py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Details */}
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary mb-8">Contact Information</h2>

                        <div className="space-y-6">
                            {/* Business Name */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-xl font-semibold text-text-primary mb-2">TNtrends</h3>
                                <p className="text-text-secondary">Proprietary Concern of Riyaz Ahamad</p>
                            </div>

                            {/* Address */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <MapPin className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary mb-2">Our Address</h3>
                                        <p className="text-text-secondary leading-relaxed">
                                            18/44, Kongu Nagar, 3rd Street,<br />
                                            Kongu Main Road,<br />
                                            Tiruppur – 641607,<br />
                                            Tamil Nadu, India
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <Mail className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary mb-2">Email Us</h3>
                                        <a
                                            href="mailto:tntrendsdigital@gmail.com"
                                            className="text-primary hover:underline"
                                        >
                                            tntrendsdigital@gmail.com
                                        </a>
                                        <p className="text-sm text-text-secondary mt-1">
                                            We'll respond within 24-48 hours
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <Phone className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary mb-2">Call Us</h3>
                                        <a
                                            href="tel:+919150673839"
                                            className="text-primary hover:underline text-lg"
                                        >
                                            +91 9150673839
                                        </a>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
                                            <Clock className="w-4 h-4" />
                                            <span>Mon - Sat: 10 AM - 7 PM IST</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-lg">
                                        <Instagram className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-primary mb-2">Follow Us</h3>
                                        <a
                                            href="https://www.instagram.com/tntrends_/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            @tntrends_
                                        </a>
                                        <p className="text-sm text-text-secondary mt-1">
                                            Stay updated with our latest collections
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form / FAQ */}
                    <div>
                        <h2 className="text-3xl font-bold text-text-primary mb-8">Quick Help</h2>

                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-text-primary mb-6">Frequently Asked Questions</h3>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-text-primary mb-2">📦 How do I track my order?</h4>
                                    <p className="text-text-secondary text-sm">
                                        You can track your order from your account under "My Orders" section.
                                        You'll also receive tracking updates via email.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-text-primary mb-2">🚚 What are your delivery areas?</h4>
                                    <p className="text-text-secondary text-sm">
                                        We deliver across India! FREE delivery in South India
                                        (Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, Telangana).
                                        ₹60 shipping charge for other states.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-text-primary mb-2">💳 What payment methods do you accept?</h4>
                                    <p className="text-text-secondary text-sm">
                                        We accept UPI, Credit/Debit Cards, Net Banking, and popular wallets
                                        through our secure Razorpay payment gateway.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-text-primary mb-2">🔄 Do you accept returns?</h4>
                                    <p className="text-text-secondary text-sm">
                                        Currently, we do not accept returns or exchanges. Please choose your
                                        size and color carefully before placing your order.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-text-primary mb-2">⏱️ How long does delivery take?</h4>
                                    <p className="text-text-secondary text-sm">
                                        Delivery typically takes 3-5 days for South India and 5-7 days for
                                        other regions after order confirmation.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-sm text-text-secondary">
                                    <strong className="text-text-primary">Still have questions?</strong><br />
                                    Email us at <a href="mailto:tntrendsdigital@gmail.com" className="text-primary hover:underline">tntrendsdigital@gmail.com</a> or
                                    call <a href="tel:+919150673839" className="text-primary hover:underline">+91 9150673839</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
