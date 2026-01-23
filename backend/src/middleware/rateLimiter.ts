import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter Configuration
 * 
 * Provides different rate limiting strategies for different endpoint types.
 */

/**
 * Strict rate limiter for payment endpoints
 * 5 requests per 15 minutes per IP
 */
export const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        error: 'Too many payment attempts. Please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count all requests
    handler: (req, res) => {
        const resetTime = (req as any).rateLimit?.resetTime;
        res.status(429).json({
            success: false,
            error: 'Too many payment attempts from this IP, please try again after 15 minutes.',
            retryAfter: resetTime ? Math.ceil(resetTime / 1000) : undefined,
        });
    },
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Admin API rate limiter  
 * Higher limit for admin operations
 * 200 requests per 15 minutes per IP
 */
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Higher limit for admins
    message: {
        success: false,
        error: 'Too many admin requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for superadmins in development
        if (process.env.NODE_ENV !== 'production') {
            const user = (req as any).user;
            return user?.role === 'superadmin';
        }
        return false;
    },
});

/**
 * File upload rate limiter
 * 10 uploads per 15 minutes per IP
 */
export const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        error: 'Too many upload attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export default {
    paymentLimiter,
    apiLimiter,
    adminLimiter,
    uploadLimiter,
};
