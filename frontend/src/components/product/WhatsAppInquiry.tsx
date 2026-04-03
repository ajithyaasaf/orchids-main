'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppInquiryProps {
    productTitle: string;
    productSlug: string;
}

export const WhatsAppInquiry: React.FC<WhatsAppInquiryProps> = ({ productTitle, productSlug }) => {
    const phoneNumber = '919150673839';
    const productUrl = `${window.location.origin}/product/${productSlug}`;
    const message = `Hi, I'm interested in the wholesale product: ${productTitle}. \n\nProduct Link: ${productUrl} \n\nCan you provide more details about bulk pricing and availability?`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md group"
        >
            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Inquire on WhatsApp</span>
        </a>
    );
};
