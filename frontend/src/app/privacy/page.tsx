import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy - TNtrends',
    description: 'Learn how TNtrends collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white py-16">
                <div className="container-custom">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
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
                                At TNtrends, we respect your privacy and are committed to protecting your personal information.
                                This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit
                                our website or make a purchase.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">1. Information We Collect</h2>

                            <h3 className="text-xl font-semibold text-text-primary mb-3">Personal Information</h3>
                            <p className="text-text-secondary mb-4">When you create an account or place an order, we collect:</p>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary mb-6">
                                <li>Name and contact information (email address, phone number)</li>
                                <li>Shipping address and billing information</li>
                                <li>Payment information (processed securely through Razorpay)</li>
                                <li>Order history and preferences</li>
                                <li>Account credentials (encrypted)</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-text-primary mb-3">Automatically Collected Information</h3>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>Browser type and version</li>
                                <li>Device information and IP address</li>
                                <li>Pages visited and time spent on our website</li>
                                <li>Referring website addresses</li>
                                <li>Cookies and similar tracking technologies</li>
                            </ul>
                        </section>

                        {/* How We Use Your Information */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">2. How We Use Your Information</h2>
                            <p className="text-text-secondary mb-4">We use your information to:</p>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>Process and fulfill your orders</li>
                                <li>Send order confirmations and shipping updates</li>
                                <li>Provide customer support and respond to inquiries</li>
                                <li>Improve our website, products, and services</li>
                                <li>Send promotional emails about new products and offers (with your consent)</li>
                                <li>Prevent fraud and enhance security</li>
                                <li>Comply with legal obligations</li>
                                <li>Analyze website usage and customer behavior</li>
                            </ul>
                        </section>

                        {/* Third-Party Services */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">3. Third-Party Services</h2>
                            <p className="text-text-secondary mb-4">We use the following trusted third-party services:</p>

                            <div className="grid gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-text-primary mb-2">Firebase (Google)</h4>
                                    <p className="text-sm text-text-secondary">
                                        Authentication, database, and hosting services. Data stored securely in Firebase infrastructure.
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-text-primary mb-2">Razorpay</h4>
                                    <p className="text-sm text-text-secondary">
                                        Payment processing. We do not store your complete card details; they are handled securely by Razorpay.
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-text-primary mb-2">Cloudinary</h4>
                                    <p className="text-sm text-text-secondary">
                                        Image hosting and optimization for product images.
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-text-primary mb-2">Resend</h4>
                                    <p className="text-sm text-text-secondary">
                                        Email delivery service for order confirmations and updates.
                                    </p>
                                </div>
                            </div>

                            <p className="text-text-secondary mt-4">
                                These services have their own privacy policies. We recommend reviewing them for more information.
                            </p>
                        </section>

                        {/* Data Sharing */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">4. Information Sharing</h2>
                            <p className="text-text-secondary mb-4">We do NOT sell your personal information. We may share your data with:</p>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li><strong>Service Providers:</strong> Third parties who assist us in operating our website and processing orders</li>
                                <li><strong>Shipping Partners:</strong> Courier services to deliver your orders</li>
                                <li><strong>Payment Processors:</strong> Razorpay for secure payment processing</li>
                                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                            </ul>
                        </section>

                        {/* Cookies */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">5. Cookies & Tracking</h2>
                            <p className="text-text-secondary mb-4">
                                We use cookies and similar technologies to enhance your browsing experience. Cookies help us:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>Remember your preferences and login status</li>
                                <li>Understand how you use our website</li>
                                <li>Provide personalized content and ads</li>
                                <li>Analyze website traffic and performance</li>
                            </ul>
                            <p className="text-text-secondary mt-4">
                                You can control cookies through your browser settings. Note that disabling cookies may affect website functionality.
                            </p>
                        </section>

                        {/* Data Security */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">6. Data Security</h2>
                            <p className="text-text-secondary mb-4">We implement industry-standard security measures to protect your data:</p>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li>SSL/TLS encryption for data transmission</li>
                                <li>Secure authentication through Firebase</li>
                                <li>Encrypted password storage</li>
                                <li>PCI-DSS compliant payment processing via Razorpay</li>
                                <li>Regular security audits and updates</li>
                                <li>Restricted access to personal data</li>
                            </ul>
                            <p className="text-text-secondary mt-4">
                                While we strive to protect your information, no method of transmission over the internet is 100% secure.
                            </p>
                        </section>

                        {/* Data Retention */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">7. Data Retention</h2>
                            <p className="text-text-secondary">
                                We retain your personal information for as long as necessary to provide services, comply with legal
                                obligations, resolve disputes, and enforce our agreements. Order history is maintained for accounting
                                and legal purposes. You can request deletion of your account and data by contacting us.
                            </p>
                        </section>

                        {/* Your Rights */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">8. Your Rights</h2>
                            <p className="text-text-secondary mb-4">You have the right to:</p>
                            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                <li><strong>Access:</strong> Request a copy of your personal data</li>
                                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                                <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
                                <li><strong>Data Portability:</strong> Request your data in a portable format</li>
                                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
                            </ul>
                            <p className="text-text-secondary mt-4">
                                To exercise these rights, contact us at <a href="mailto:tntrendsdigital@gmail.com" className="text-primary hover:underline">tntrendsdigital@gmail.com</a>
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">9. Children's Privacy</h2>
                            <p className="text-text-secondary">
                                Our website is not intended for children under 18 years of age. We do not knowingly collect personal
                                information from children. If you believe we have collected information from a child, please contact us
                                immediately so we can delete it.
                            </p>
                        </section>

                        {/* Changes to Policy */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">10. Changes to This Policy</h2>
                            <p className="text-text-secondary">
                                We may update this Privacy Policy from time to time. We will notify you of significant changes by
                                posting the new policy on this page and updating the "Last updated" date. Your continued use of our
                                website after changes constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="mb-0">
                            <h2 className="text-2xl font-bold text-text-primary mb-4">11. Contact Us</h2>
                            <p className="text-text-secondary mb-4">
                                If you have questions about this Privacy Policy or how we handle your data, please contact us:
                            </p>
                            <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                                <p className="text-text-secondary"><strong>TNtrends</strong></p>
                                <p className="text-text-secondary"><strong>Proprietor:</strong> Riyaz Ahamad</p>
                                <p className="text-text-secondary mt-2"><strong>Email:</strong> <a href="mailto:tntrendsdigital@gmail.com" className="text-primary hover:underline">tntrendsdigital@gmail.com</a></p>
                                <p className="text-text-secondary"><strong>Phone:</strong> <a href="tel:+919150673839" className="text-primary hover:underline">+91 9150673839</a></p>
                                <p className="text-text-secondary"><strong>Address:</strong> 18/44, Kongu Nagar, 3rd Street, Tiruppur – 641607, Tamil Nadu, India</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
