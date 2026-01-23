import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms & Conditions - TNtrends',
    description: 'Read our terms and conditions for using TNtrends online store and making purchases.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white py-16">
                <div className="container-custom">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
                    <p className="text-xl opacity-90">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Content */}
            <div className="container-custom py-16">
                <div className="max-w-4xl mx-auto bg-white rounded-xl p-8 md:p-12 shadow-sm border border-gray-100">
                    <div className="prose prose-lg max-w-none">
                        {/* Introduction */}
                        <section className="mb-8">
                            <p className="text-text-secondary leading-relaxed">
                                Welcome to TNtrends. By accessing and using our website, you agree to be bound by these Terms and Conditions.
                                Please read them carefully before making any purchase.
                            </p>
                        </section>

                        {/* Business Information */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">1. Business Information</h2>
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <p className="text-text-secondary mb-2"><strong>Business Name:</strong> TNtrends</p>
                                <p className="text-text-secondary mb-2"><strong>Proprietor:</strong> Riyaz Ahamad</p>
                                <p className="text-text-secondary mb-2"><strong>Address:</strong> 18/44, Kongu Nagar, 3rd Street, Kongu Main Road, Tiruppur – 641607, Tamil Nadu, India</p>
                                <p className="text-text-secondary mb-2"><strong>Email:</strong> tntrendsdigital@gmail.com</p>
                                <p className="text-text-secondary"><strong>Phone:</strong> +91 9150673839</p>
                            </div>
                        </section>

                        {/* Account & Registration */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">2. User Account</h2>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>You must be at least 18 years old to create an account and make purchases</li>
                                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                                <li>You agree to provide accurate, current information during registration</li>
                                <li>You are responsible for all activities that occur under your account</li>
                                <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                            </ul>
                        </section>

                        {/* Products & Pricing */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Products & Pricing</h2>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>All product descriptions, images, and specifications are provided for general information</li>
                                <li>We make every effort to display colors accurately, but actual colors may vary due to screen settings</li>
                                <li>All prices displayed are final and inclusive of all applicable charges</li>
                                <li>Prices are subject to change without prior notice</li>
                                <li>We reserve the right to limit quantities purchased per person or household</li>
                                <li>Products are subject to availability and we may cancel orders if stock is unavailable</li>
                            </ul>
                        </section>

                        {/* Orders & Payment */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Orders & Payment</h2>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>Placing an order constitutes an offer to purchase products</li>
                                <li>We reserve the right to accept or decline any order</li>
                                <li>Order confirmation will be sent via email after successful payment</li>
                                <li>Payment is processed securely through Razorpay payment gateway</li>
                                <li>We accept UPI, Credit Cards, Debit Cards, Net Banking, and Wallets</li>
                                <li>Full payment must be received before order processing</li>
                                <li>You agree not to dispute valid charges with your payment provider</li>
                            </ul>
                        </section>

                        {/* Shipping & Delivery */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Shipping & Delivery</h2>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li><strong>FREE Delivery:</strong> Available for orders delivered to South India (Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, Telangana)</li>
                                <li><strong>Other Regions:</strong> Additional shipping charge of ₹60 applies</li>
                                <li>Delivery Timeline: 3-5 days for South India, 5-7 days for other regions</li>
                                <li>Address must be complete and accurate; we are not responsible for delivery failures due to incorrect addresses</li>
                                <li>Risk of loss and title for products pass to you upon delivery to the shipping address</li>
                                <li>We are not liable for delays caused by courier services or force majeure events</li>
                            </ul>
                        </section>

                        {/* Returns & Exchanges */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Returns & Exchanges</h2>
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded">
                                <p className="text-amber-900 font-semibold mb-2">⚠️ Important Policy</p>
                                <p className="text-amber-800">
                                    <strong>We currently do not accept returns or exchanges.</strong> All sales are final.
                                    Please carefully review product details, size charts, and images before placing your order.
                                </p>
                            </div>
                            <p className="text-text-secondary mt-4">
                                However, if you receive damaged or defective products, please contact us within 48 hours
                                of delivery at <a href="mailto:tntrendsdigital@gmail.com" className="text-primary hover:underline">tntrendsdigital@gmail.com</a> with
                                photos of the defect. We'll review each case individually.
                            </p>
                        </section>

                        {/* Intellectual Property */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Intellectual Property</h2>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>All content on this website, including text, images, logos, and design, is owned by TNtrends</li>
                                <li>You may not reproduce, distribute, or create derivative works without written permission</li>
                                <li>TNtrends and our logo are trademarks of our business</li>
                                <li>Unauthorized use of our intellectual property may result in legal action</li>
                            </ul>
                        </section>

                        {/* User Conduct */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">8. User Conduct</h2>
                            <p className="text-text-secondary mb-4">You agree not to:</p>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>Use our website for any unlawful purpose</li>
                                <li>Attempt to gain unauthorized access to our systems</li>
                                <li>Interfere with the proper functioning of the website</li>
                                <li>Submit false or misleading information</li>
                                <li>Engage in fraudulent activities or payment disputes</li>
                                <li>Impersonate any person or entity</li>
                            </ul>
                        </section>

                        {/* Limitation of Liability */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">9 Limitation of Liability</h2>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>Our website and products are provided "as is" without warranties of any kind</li>
                                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                                <li>Our maximum liability is limited to the purchase price of the product</li>
                                <li>We are not responsible for delays or failures due to circumstances beyond our control</li>
                            </ul>
                        </section>

                        {/* Governing Law */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">10. Governing Law</h2>
                            <p className="text-text-secondary">
                                These Terms and Conditions are governed by the laws of India. Any disputes arising from these
                                terms or your use of our website shall be subject to the exclusive jurisdiction of the courts
                                in Tiruppur, Tamil Nadu, India.
                            </p>
                        </section>

                        {/* Changes to Terms */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">11. Changes to Terms</h2>
                            <p className="text-text-secondary">
                                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective
                                immediately upon posting to the website. Your continued use of the website after changes are posted
                                constitutes your acceptance of the modified terms.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="mb-0">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">12. Contact Us</h2>
                            <p className="text-text-secondary mb-4">
                                If you have any questions about these Terms and Conditions, please contact us:
                            </p>
                            <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                                <p className="text-text-secondary"><strong>Email:</strong> <a href="mailto:tntrendsdigital@gmail.com" className="text-primary hover:underline">tntrendsdigital@gmail.com</a></p>
                                <p className="text-text-secondary"><strong>Phone:</strong> <a href="tel:+919150673839" className="text-primary hover:underline">+91 9150673839</a></p>
                                <p className="text-text-secondary"><strong>Address:</strong> 18/44, Kongu Nagar, 3rd Street, Tiruppur – 641607, Tamil Nadu</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
