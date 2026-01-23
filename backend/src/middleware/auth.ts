import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        role?: string;
    };
}

/**
 * Middleware to verify Firebase ID token
 * 
 * SECURITY: Optimized to make only ONE Firebase API call per request
 * Role is extracted from JWT custom claims (already in the decoded token)
 * instead of making a separate getUser() API call.
 */
export const verifyToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const startTime = Date.now();

    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized: No token provided',
            });
            return;
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify the Firebase ID token (includes custom claims)
        const decodedToken = await auth.verifyIdToken(token);

        // CRITICAL FIX: Role is already in the token's custom claims
        // No need for additional getUser() API call (50% performance improvement)
        const role = (decodedToken as any).role || 'customer';

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: role as string,
        };

        // Log performance in development
        if (process.env.NODE_ENV !== 'production') {
            const duration = Date.now() - startTime;
            console.log(`[AUTH] Token verified in ${duration}ms (1 API call)`);
        }

        next();
    } catch (error) {
        // Use consistent error message to prevent timing attacks
        // Don't reveal why authentication failed
        res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid token',
        });
    }
};

/**
 * Optional auth middleware - continues even if no token
 * SECURITY: Optimized to use token custom claims only
 */
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            const decodedToken = await auth.verifyIdToken(token);

            // Extract role from token custom claims (no extra API call)
            const role = (decodedToken as any).role || 'customer';

            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                role: role as string,
            };
        }

        next();
    } catch (error) {
        // Continue without auth
        next();
    }
};

/**
 * Middleware to require admin role
 * Must be used after verifyToken
 */
export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized: Authentication required',
        });
        return;
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        res.status(403).json({
            success: false,
            error: 'Forbidden: Insufficient permissions',
        });
        return;
    }

    next();
};

/**
 * Middleware to require superadmin role (higher privilege)
 * Must be used after verifyToken
 * Use this for sensitive operations like Collections, Settings, etc.
 */
export const requireSuperAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized: Authentication required',
        });
        return;
    }

    if (req.user.role !== 'superadmin') {
        res.status(403).json({
            success: false,
            error: 'Forbidden: Superadmin access required',
        });
        return;
    }

    next();
};
