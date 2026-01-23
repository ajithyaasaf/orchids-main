import React from 'react';
import { Metadata } from 'next';
import { Truck, Package, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Shipping & Delivery Policy - TNtrends',
    description: 'Learn about TNtrends shipping rates, delivery timelines, and policies across India.',
};

export default function ShippingPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white py-16">
                <div className="container-custom">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping & Delivery</h1>
                    <p className="text-xl opacity-90">Fast, reliable delivery across India</p>
                </div>
            </div>

            {/* Content */}
            <div className="container-custom py-16">
                <div className="max-w-5xl mx-auto">
                    {/* India Only Notice */}
                    <div className="bg-blue-600 text-white rounded-xl p-6 mb-8 text-center">
                        <h3 className="text-2xl font-bold mb-2">🇮🇳 India-Only Delivery</h3>
                        <p className="text-lg opacity-90">
                            We currently deliver within India only. International shipping is not available.
                        </p>
                    </div>

                    {/* FREE Delivery Promotion */}
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl p-8 mb-12 text-center shadow-xl">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <Truck className="w-12 h-12" />
                            <h2 className="text-4xl font-bold">FREE Delivery Across India!</h2>
                        </div>
                        <p className="text-2xl font-semibold mb-4">On orders above ₹1499</p>
                        <p className="text-lg opacity-90">Shop more, save more!</p>
                    </div>

                    {/* Shipping Zones Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* South India - Always FREE */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 border-2 border-green-200 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-green-500 p-3 rounded-lg">
                                    <Truck className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-green-900">South India</h3>
                            </div>
                            <div className="bg-white rounded-lg p-4 mb-4">
                                <p className="text-3xl font-bold text-green-600 mb-2">Always FREE</p>
                                <p className="text-green-800 text-sm">No minimum order required!</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-green-900 font-semibold">Covered States:</p>
                                <ul className="text-green-800 text-sm space-y-1">
                                    <li>✓ Tamil Nadu</li>
                                    <li>✓ Karnataka</li>
                                    <li>✓ Kerala</li>
                                    <li>✓ Andhra Pradesh</li>
                                    <li>✓ Telangana</li>
                                    <li>✓ Puducherry</li>
                                </ul>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-green-800">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">Delivery: 3-5 business days</span>
                            </div>
                        </div>

                        {/* Rest of India */}
                        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-primary p-3 rounded-lg">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary">Rest of India</h3>
                            </div>
                            <div className="space-y-3 mb-4">
                                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                                    <p className="text-2xl font-bold text-green-600 mb-1">FREE</p>
                                    <p className="text-green-800 text-sm">On orders ₹1499 and above</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-2xl font-bold text-primary mb-1">₹60</p>
                                    <p className="text-text-secondary text-sm">For orders below ₹1499</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-text-primary font-semibold">Applicable for:</p>
                                <p className="text-text-secondary text-sm">
                                    All other states across India including North, East, West, Central, and Northeast regions.
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-text-secondary">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">Delivery: 5-7 business days</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-gray-100">
                        <div className="prose prose-lg max-w-none">
                            {/* Shipping Policy */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">1. Shipping Charges</h2>
                                <p className="text-text-secondary mb-4">
                                    We offer competitive and transparent shipping across India:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                    <li><strong>South India (Always FREE):</strong> Free delivery for all orders to Tamil Nadu, Karnataka, Kerala, Andhra Pradesh, Telangana, and Puducherry - no minimum order required!</li>
                                    <li><strong>Rest of India (FREE above ₹1499):</strong> Orders of ₹1499 or more get FREE delivery. For orders below ₹1499, a flat ₹60 shipping charge applies.</li>
                                    <li>Shipping charges are calculated automatically at checkout based on your delivery pincode</li>
                                    <li>No hidden charges - final price at checkout includes all costs</li>
                                </ul>
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                                    <p className="text-green-900 font-semibold">💡 Pro Tip:</p>
                                    <p className="text-green-800">Add items worth ₹1499 or more to get FREE delivery across all  of India!</p>
                                </div>
                            </section>

                            {/* Processing Time */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">2. Order Processing</h2>
                                <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                    <li>Orders are processed within 1-2 business days after payment confirmation</li>
                                    <li>Orders placed on weekends or public holidays will be processed on the next business day</li>
                                    <li>You will receive an order confirmation email immediately after placing your order</li>
                                    <li>A shipping confirmation email with tracking details will be sent once your order is dispatched</li>
                                </ul>
                            </section>

                            {/* Delivery Timeline */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">3. Delivery Timeline</h2>
                                <div className="bg-blue-50 p-6 rounded-lg mb-4">
                                    <p className="text-blue-900 font-semibold mb-2">📦 Standard Delivery Times:</p>
                                    <ul className="space-y-2 text-blue-800">
                                        <li>• <strong>South India:</strong> 3-5 business days</li>
                                        <li>• <strong>Other Regions:</strong> 5-7 business days</li>
                                    </ul>
                                </div>
                                <p className="text-text-secondary text-sm">
                                    *Delivery times are estimates and may vary due to courier delays, weather conditions,
                                    public holidays, or unforeseen circumstances. Remote locations may require additional time.
                                </p>
                            </section>

                            {/* Order Tracking */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">4. Order Tracking</h2>
                                <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                    <li>Track your order anytime from your account under "My Orders"</li>
                                    <li>Tracking information is updated regularly by our courier partners</li>
                                    <li>You'll receive email updates at key stages: Order Placed, Dispatched, Out for Delivery, Delivered</li>
                                    <li>If you face any tracking issues, contact us at <a href="mailto:tntrendsdigital@gmail.com" className="text-primary hover:underline">tntrendsdigital@gmail.com</a></li>
                                </ul>
                            </section>

                            {/* Delivery Address */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">5. Delivery Address</h2>
                                <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                    <li>Please ensure your shipping address is complete and accurate</li>
                                    <li>Include landmarks, floor/apartment numbers for easy delivery</li>
                                    <li>Provide a valid phone number for courier coordination</li>
                                    <li>We are NOT responsible for delivery failures due to incorrect/incomplete addresses</li>
                                    <li>Address cannot be changed once the order is dispatched</li>
                                    <li>We currently do not deliver to PO Box addresses</li>
                                </ul>
                            </section>

                            {/* Failed Delivery */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">6. Failed Delivery Attempts</h2>
                                <p className="text-text-secondary mb-4">If delivery fails due to:</p>
                                <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                    <li>Incorrect address or phone number</li>
                                    <li>Recipient unavailable</li>
                                    <li>Refusal to accept delivery</li>
                                </ul>
                                <p className="text-text-secondary mt-4">
                                    The courier will make 2-3 delivery attempts. If unsuccessful, the order will be returned to us.
                                    You may need to pay return shipping costs if the failure was due to incorrect information.
                                </p>
                            </section>

                            {/* Returns Policy */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">7. Returns & Exchanges</h2>
                                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded">
                                    <p className="text-amber-900 font-semibold mb-2">⚠️ Important Policy</p>
                                    <p className="text-amber-800">
                                        <strong>We currently do not accept returns or exchanges.</strong> All sales are final.
                                        Please carefully review product details, size charts, and images before placing your order.
                                    </p>
                                </div>
                                <p className="text-text-secondary mt-4">
                                    <strong>Exception:</strong> If you receive a damaged or defective product, contact us within
                                    48 hours of delivery at <a href="mailto:tntrendsdigital@gmail.com" className="text-primary hover:underline">tntrendsdigital@gmail.com</a> with
                                    clear photos. We'll review each case individually and provide a suitable resolution.
                                </p>
                                <p className="text-text-secondary mb-4">
                                    For any shipping-related queries, feel free to reach out:
                                </p>
                                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                                    <p className="text-text-secondary"><strong>Email:</strong> <a href="mailto:tntrendsdigital@gmail.com" className="text-primary hover:underline">tntrendsdigital@gmail.com</a></p>
                                    <p className="text-text-secondary"><strong>Phone:</strong> <a href="tel:+919150673839" className="text-primary hover:underline">+91 9150673839</a></p>
                                    <p className="text-text-secondary"><strong>Support Hours:</strong> Mon - Sat, 10 AM - 7 PM IST</p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
