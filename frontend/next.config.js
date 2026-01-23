/** @type {import('next').NextConfig} */
const nextConfig = {
    // TNtrends Next.js Configuration
    // 1. Transpile shared packages
    transpilePackages: ['@tntrends/shared', 'undici', 'firebase', '@firebase/auth', '@firebase/component', '@firebase/util'],

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '**',
            },
        ],
        formats: ['image/webp', 'image/avif'],
    },

    output: 'standalone',
    swcMinify: true,

    // 2. Webpack config to prevent node module crashes
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        return config;
    },
};

module.exports = nextConfig;