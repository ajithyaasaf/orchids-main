import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Orchid Export Surplus Store Brand Colors
                primary: '#E91E8C', // Orchid Magenta (from logo)
                'primary-dark': '#C01A75', // Darker magenta for hover
                'primary-light': '#FCE7F3', // Light pink background
                background: '#F8FAFC',
                'text-primary': '#0F172A', // Slate 900 (Luxury Dark)
                'text-secondary': '#64748B', // Slate 500 (Softer secondary)
                border: '#E2E8F0',
                success: '#10B981',
                error: '#EF4444',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'], // New Heading Font
            },
            boxShadow: {
                'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
                'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.1)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
