import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { PaymentMethods } from '@/components/ui/PaymentMethods';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <h3 className="text-white text-xl font-bold mb-4">TNtrends</h3>
                        <p className="text-sm">
                            Your destination for trendy and affordable clothing.
                        </p>
                        <div className="flex space-x-4 mt-4">
                            <a href="#" className="hover:text-primary transition">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-primary transition">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="hover:text-primary transition">
                                <Twitter className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Shop</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/category/men" className="hover:text-primary transition">Men</Link></li>
                            <li><Link href="/category/women" className="hover:text-primary transition">Women</Link></li>
                            <li><Link href="/category/kids" className="hover:text-primary transition">Kids</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Customer Service</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/contact" className="hover:text-primary transition">Contact Us</Link></li>
                            <li><Link href="/shipping" className="hover:text-primary transition">Shipping & Delivery</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition">Terms & Conditions</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary transition">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Newsletter</h4>
                        <p className="text-sm mb-4">Subscribe to get special offers and updates.</p>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="px-4 py-2 bg-gray-800 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary flex-1"
                            />
                            <button className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary-dark transition">
                                <Mail className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payment Methods Section */}
                <div className="border-t border-gray-800 mt-10 pt-10">
                    <PaymentMethods />
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                    <p>&copy; {currentYear} TNtrends. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};
