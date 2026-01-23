'use client';

import { useEffect } from 'react';

// GTM Container ID
const GTM_ID = 'GTM-T4LJ42GW';

/**
 * Google Tag Manager Component
 * Loads GTM container and initializes dataLayer
 * Must be placed in root layout for site-wide tracking
 */
export function GoogleTagManager() {
    useEffect(() => {
        // Initialize dataLayer if not exists
        if (typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                'gtm.start': new Date().getTime(),
                event: 'gtm.js',
            });
        }
    }, []);

    return (
        <>
            {/* GTM Script */}
            <script
                id="gtm-script"
                dangerouslySetInnerHTML={{
                    __html: `
                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer','${GTM_ID}');
                    `,
                }}
            />

            {/* GTM NoScript Fallback */}
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                    height="0"
                    width="0"
                    style={{ display: 'none', visibility: 'hidden' }}
                />
            </noscript>
        </>
    );
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        dataLayer: any[];
    }
}
