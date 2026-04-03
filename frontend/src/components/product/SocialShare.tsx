'use client';

import React, { useState } from 'react';
import { Share2, Facebook, Twitter, MessageCircle, Link, Check } from 'lucide-react';

interface SocialShareProps {
    title: string;
    slug: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({ title, slug }) => {
    const [copied, setCopied] = useState(false);
    
    // Check if running on client to get origin
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/product/${slug}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(`Check out this wholesale deal: ${title}`);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: <MessageCircle className="w-5 h-5" />,
            url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            color: 'hover:text-[#25D366]'
        },
        {
            name: 'Facebook',
            icon: <Facebook className="w-5 h-5" />,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: 'hover:text-[#1877F2]'
        },
        {
            name: 'Twitter',
            icon: <Twitter className="w-5 h-5" />,
            url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            color: 'hover:text-[#1DA1F2]'
        }
    ];

    return (
        <div className="py-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Share2 className="w-4 h-4 text-primary" />
                Share with Customers
            </h3>
            
            <div className="flex items-center gap-4">
                {shareLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-gray-400 transition-colors p-2 rounded-lg hover:bg-gray-100 ${link.color}`}
                        title={`Share on ${link.name}`}
                    >
                        {link.icon}
                    </a>
                ))}
                
                <button
                    onClick={handleCopy}
                    className="text-gray-400 transition-colors p-2 rounded-lg hover:bg-gray-100 hover:text-gray-900 ml-auto"
                    title="Copy Link"
                >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Link className="w-5 h-5" />}
                </button>
            </div>
            {copied && <p className="text-[10px] text-green-600 font-bold mt-1 text-right">Link Copied!</p>}
        </div>
    );
};
