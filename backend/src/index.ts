import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import './config/firebase'; // Initialize Firebase
import './config/cloudinary'; // Initialize Cloudinary


import paymentRoutes from './routes/payment';
import uploadRoutes from './routes/upload';
import settingsRoutes from './routes/settings';
import comboRoutes from './routes/combos';
import webhookRoutes from './routes/webhook';
import couponRoutes from './routes/coupons';
import dashboardRoutes from './routes/dashboard';
import invoiceRoutes from './routes/invoices';
import collectionRoutes from './routes/collections';
import authRoutes from './routes/auth';

// Wholesale platform routes
import wholesaleProductRoutes from './routes/wholesaleProducts';
import wholesaleOrderRoutes from './routes/wholesaleOrders';
import wholesaleCheckoutRoutes from './routes/wholesaleCheckout';
import customerRoutes from './routes/customers';
import shippingRoutes from './routes/shipping';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// SECURITY: Helmet security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "res.cloudinary.com"],
            connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com"],
            frameSrc: ["https://api.razorpay.com", "https://checkout.razorpay.com"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));

// SECURITY: HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// SECURITY: Request ID middleware for tracking
app.use((req, res, next) => {
    const requestId = uuidv4();
    (req as any).id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
});

// CORS configuration (optimized for performance)
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server requests (no origin, e.g. Vercel SSR → Render)
            if (!origin) return callback(null, true);
            const allowed = [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                process.env.FRONTEND_URL,
            ].filter(Boolean) as string[];
            // Also allow any *.vercel.app origin (preview & production deployments)
            if (allowed.includes(origin) || /^https:\/\/[\w-]+(\.[\w-]+)*\.vercel\.app$/.test(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS: Origin ${origin} not allowed`));
        },
        credentials: true,
        maxAge: 86400, // Cache preflight for 24 hours
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// CRITICAL: Webhook routes MUST be mounted before express.json() 
// because signature verification requires the raw unparsed request body.
app.use('/api/payment', webhookRoutes);

// Body parser middleware with size limits (SECURITY: Prevent DoS via large payloads)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Orchid API is running',
        timestamp: new Date().toISOString(),
    });
});

// DIAGNOSTIC: Check Firestore connectivity
app.get('/api/diagnostic/db', async (req, res) => {
    try {
        const { collections } = await import('./config/firebase');
        const productsCount = (await collections.products.get()).size;
        const wholesaleProductsCount = (await collections.wholesaleProducts.get()).size;
        const ordersCount = (await collections.orders.get()).size;
        const wholesaleOrdersCount = (await collections.wholesaleOrders.get()).size;
        const usersCount = (await collections.users.get()).size;

        res.json({
            success: true,
            projectId: process.env.FIREBASE_PROJECT_ID,
            counts: {
                products: productsCount,
                wholesaleProducts: wholesaleProductsCount,
                orders: ordersCount,
                wholesaleOrders: wholesaleOrdersCount,
                users: usersCount
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// API Routes - Wholesale Platform
app.use('/api/coupons', couponRoutes);           // Promotions: Coupon system (wholesale)
app.use('/api/combos', comboRoutes);             // Promotions: Product combos (wholesale)
app.use('/api/collections', collectionRoutes);   // Collections: Manual product grouping
app.use('/api/dashboard', dashboardRoutes);      // Dashboard analytics
app.use('/api/auth', authRoutes);                // Secure session cookie generation
app.use('/api/customers', customerRoutes);       // Customer management & analytics

// Shared Infrastructure
app.use('/api/payment', paymentRoutes);          // Razorpay payment gateway
app.use('/api/upload', uploadRoutes);            // Cloudinary image upload
app.use('/api/settings', settingsRoutes);        // System configuration (GST, etc.)
app.use('/api/invoices', invoiceRoutes);         // Invoice generation
app.use('/api/shipping', shippingRoutes);         // Shipping serviceability & estimation

// Wholesale Core Routes
app.use('/api/wholesale/products', wholesaleProductRoutes);
app.use('/api/wholesale/orders', wholesaleOrderRoutes);
app.use('/api/wholesale/checkout', wholesaleCheckoutRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`\n🚀 Orchid Backend API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);

    // Initialize scheduled tasks
    try {
        const { reconcilePendingOrders } = await import('./scheduled/paymentReconciler');
        // Run immediately on startup
        reconcilePendingOrders().catch(err => logger.error('Initial reconciliation failed', err));

        // Then run every 15 minutes
        setInterval(() => {
            reconcilePendingOrders().catch(err => logger.error('Scheduled reconciliation failed', err));
        }, 15 * 60 * 1000);

        console.log('⏰ Payment reconciler service started (15m interval)');
    } catch (error) {
        logger.error('Failed to start scheduled tasks', error);
    }
});

// GRACEFUL SHUTDOWN: Ensure the process exits cleanly and releases port 5000
const shutdown = () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped. Port released.');
        process.exit(0);
    });

    // Force exit after 5 seconds if server.close() hangs
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 5000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
