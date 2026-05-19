import React from 'react';
import { Metadata } from 'next';
import { Truck, Package, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Shipping & Delivery Policy - Wholesale Orchids',
    description: 'Learn about Wholesale Orchids shipping rates, delivery timelines, and policies across India.',
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
                    <div className="bg-primary text-white rounded-xl p-6 mb-8 text-center">
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
                        <p className="text-2xl font-semibold mb-4">On orders above ₹4,999</p>
                        <p className="text-lg opacity-90">Shop more, save more!</p>
                    </div>

                    {/* Shipping Zones Card */}
                    <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-primary p-3 rounded-lg">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary">Delivery Rates & Zones</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                                <p className="text-sm text-green-800 font-bold uppercase tracking-wider mb-1">Orders Above ₹4,999</p>
                                <p className="text-3xl font-extrabold text-green-600 mb-2">FREE SHIPPING</p>
                                <p className="text-green-800 text-sm">Delivery across all states in India with zero additional delivery fee.</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Orders Below ₹4,999</p>
                                <p className="text-3xl font-extrabold text-primary mb-2">₹199 FLAT FEE</p>
                                <p className="text-text-secondary text-sm">Standard flat delivery charge covers heavy bulk wholesale parcel handling.</p>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-text-secondary border-t border-gray-100 pt-4">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Average Delivery Time: 3 to 7 business days depending on location.</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white rounded-xl p-8 md:p-12 shadow-soft">
                        <div className="prose prose-lg max-w-none">
                            {/* Shipping Policy */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">1. Shipping Charges</h2>
                                <p className="text-text-secondary mb-4">
                                    We offer transparent flat-rate shipping for all wholesale orders across India:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 text-text-secondary">
                                    <li><strong>Orders of ₹4,999 or more:</strong> FREE delivery across India.</li>
                                    <li><strong>Orders below ₹4,999:</strong> A flat ₹199 shipping charge is added to cover logistics and bulk cargo handling.</li>
                                    <li>Shipping charges are automatically calculated and added to your tax invoice during checkout.</li>
                                    <li>No hidden charges - final price at checkout includes all costs.</li>
                                </ul>
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mt-4">
                                    <p className="text-green-900 font-semibold">💡 Pro Tip:</p>
                                    <p className="text-green-800">Add products worth ₹4,999 or more to your cart to enjoy completely FREE delivery across all pin-codes in India!</p>
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
                                <div className="bg-primary-light p-6 rounded-lg mb-4 border border-pink-100">
                                    <p className="text-primary font-semibold mb-2">📦 Standard Delivery Times:</p>
                                    <ul className="space-y-2 text-gray-800">
                                        <li>• <strong>All of India:</strong> 3-7 business days (depending on your delivery pincode)</li>
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
                                    <li>If you face any tracking issues, contact us at <a href="mailto:contact@orchids.store" className="text-primary hover:underline">contact@orchids.store</a></li>
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

                            {/* Service Coverage */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">7. Serviceable States & Cities</h2>
                                <p className="text-text-secondary mb-4">
                                    We deliver bulk wholesale clothing bundles and combos to all major cities, commercial hubs, and states across India, including:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-150 text-sm text-text-secondary">
                                    <div>
                                        <h4 className="font-bold text-text-primary mb-1.5">South India Delivery</h4>
                                        <p className="leading-relaxed">
                                            <strong>Tamil Nadu:</strong> Chennai, Coimbatore, Tiruppur, Madurai, Salem, Trichy.<br />
                                            <strong>Karnataka:</strong> Bengaluru, Mysuru, Hubballi, Mangaluru, Belagavi.<br />
                                            <strong>Kerala:</strong> Kochi, Thiruvananthapuram, Kozhikode, Thrissur.<br />
                                            <strong>Andhra Pradesh & Telangana:</strong> Hyderabad, Vijayawada, Visakhapatnam, Guntur, Warangal.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-primary mb-1.5">West & Central India Delivery</h4>
                                        <p className="leading-relaxed">
                                            <strong>Maharashtra:</strong> Mumbai, Pune, Nagpur, Thane, Nashik, Aurangabad.<br />
                                            <strong>Gujarat:</strong> Ahmedabad, Surat, Vadodara, Rajkot, Surat, Bhavnagar.<br />
                                            <strong>Madhya Pradesh & Rajasthan:</strong> Indore, Bhopal, Jaipur, Jodhpur, Udaipur, Kota.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-primary mb-1.5">North & East India Delivery</h4>
                                        <p className="leading-relaxed">
                                            <strong>Delhi NCR:</strong> New Delhi, Noida, Gurugram, Ghaziabad, Faridabad.<br />
                                            <strong>Uttar Pradesh:</strong> Lucknow, Kanpur, Agra, Varanasi, Meerut.<br />
                                            <strong>West Bengal & Bihar:</strong> Kolkata, Howrah, Patna, Gaya, Darbhanga.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Returns Policy */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-text-primary mb-4">8. Returns & Exchanges</h2>
                                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded">
                                    <p className="text-amber-900 font-semibold mb-2">⚠️ Important Policy</p>
                                    <p className="text-amber-800">
                                        <strong>We currently do not accept returns or exchanges.</strong> All sales are final.
                                        Please carefully review product details, size charts, and images before placing your order.
                                    </p>
                                </div>
                                <p className="text-text-secondary mt-4">
                                    <strong>Exception:</strong> If you receive a damaged or defective product, contact us within
                                    48 hours of delivery at <a href="mailto:contact@orchids.store" className="text-primary hover:underline">contact@orchids.store</a> with
                                    clear photos. We'll review each case individually and provide a suitable resolution.
                                </p>
                                <p className="text-text-secondary mb-4">
                                    For any shipping-related queries, feel free to reach out:
                                </p>
                                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                                    <p className="text-text-secondary"><strong>Email:</strong> <a href="mailto:contact@orchids.store" className="text-primary hover:underline">contact@orchids.store</a></p>
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
