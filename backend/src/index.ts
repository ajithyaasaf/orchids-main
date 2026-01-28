import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import './config/firebase'; // Initialize Firebase
import './config/cloudinary'; // Initialize Cloudinary
import './config/razorpay'; // Initialize Razorpay

import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payment';
import uploadRoutes from './routes/upload';
import settingsRoutes from './routes/settings';
import comboRoutes from './routes/combos';
import shippingRoutes from './routes/shipping';
import checkoutRoutes from './routes/checkout';
import webhookRoutes from './routes/webhook';
import cartRoutes from './routes/cart';
import couponRoutes from './routes/coupons';
import customersRoutes from './routes/customers';
import dashboardRoutes from './routes/dashboard';
import invoiceRoutes from './routes/invoices';
import collectionRoutes from './routes/collections';

// Wholesale platform routes (greenfield)
import wholesaleProductRoutes from './routes/wholesaleProducts';
import wholesaleOrderRoutes from './routes/wholesaleOrders';
import wholesaleCheckoutRoutes from './routes/wholesaleCheckout';
import createWholesaleOrderRoute from './routes/createWholesaleOrder';

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
            scriptSrc: ["'self'", "'unsafe-inline'", "checkout.razorpay.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "res.cloudinary.com"],
            connectSrc: ["'self'", "https://api.razorpay.com"],
            frameSrc: ["https://api.razorpay.com"],
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
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        maxAge: 86400, // Cache preflight for 24 hours
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Body parser middleware with size limits (SECURITY: Prevent DoS via large payloads)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check route
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'TNtrends API is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes
// WHOLESALE-ONLY SYSTEM: Retail routes commented out (archived for potential reuse)
// app.use('/api/products', productRoutes);        // RETAIL: Product catalog (Disabled for wholesale-only)
// app.use('/api/orders', orderRoutes);            // RETAIL: Order management (Keep disabled if unused, check later)
// app.use('/api/cart', cartRoutes);               // RETAIL: Shopping cart (Re-enable if retail cart needed)
app.use('/api/shipping', shippingRoutes);       // RETAIL: Shipping calculator (Used by product page)
// app.use('/api/checkout', checkoutRoutes);       // RETAIL: Checkout flow
// app.use('/api/coupons', couponRoutes);          // RETAIL: Coupon system 
// app.use('/api/combos', comboRoutes);            // RETAIL: Product combos 
// app.use('/api/collections', collectionRoutes);  // RETAIL: Product collections (Disabled for wholesale-only)
// app.use('/api/customers', customersRoutes);     // RETAIL: Customer analytics
// app.use('/api/dashboard', dashboardRoutes);     // RETAIL: Dashboard analytics

// SHARED INFRASTRUCTURE (Keep for wholesale)
app.use('/api/payment', paymentRoutes);           // Shared: Razorpay payment gateway
app.use('/api/payment', webhookRoutes);           // Shared: Webhook route (handles /api/payment/webhook)
app.use('/api/upload', uploadRoutes);             // Shared: Cloudinary image upload
app.use('/api/settings', settingsRoutes);         // Shared: System configuration (GST, etc.)
app.use('/api/invoices', invoiceRoutes);          // Shared: Invoice generation

// Wholesale platform routes
app.use('/api/wholesale/products', wholesaleProductRoutes);
app.use('/api/wholesale/orders', wholesaleOrderRoutes);
// app.use('/api/wholesale/orders', createWholesaleOrderRoute); // Merged into wholesaleOrderRoutes
app.use('/api/wholesale/checkout', wholesaleCheckoutRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 TNtrends Backend API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});

export default app;
