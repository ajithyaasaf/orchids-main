import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type AllowedRole = 'superadmin' | 'admin' | 'customer';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: AllowedRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        console.log('==== ROLE CHECK MIDDLEWARE ====');
        console.log('Required roles:', allowedRoles);
        console.log('User exists?:', !!req.user);
        console.log('User data:', req.user ? {
            uid: req.user.uid,
            email: req.user.email,
            role: req.user.role
        } : 'NO USER');

        if (!req.user) {
            console.log('❌ REJECTED: No user');
            res.status(401).json({
                success: false,
                error: 'Unauthorized: Authentication required',
            });
            return;
        }

        const userRole = req.user.role as AllowedRole;
        console.log('Checking if', userRole, 'is in', allowedRoles);

        if (!allowedRoles.includes(userRole)) {
            console.log('❌ REJECTED: Role mismatch');
            res.status(403).json({
                success: false,
                error: 'Forbidden: Insufficient permissions',
            });
            return;
        }

        console.log('✅ PASSED: Role check successful');
        next();
    };
};

/**
 * Convenience middleware for admin access (admin + superadmin)
 */
export const requireAdmin = requireRole(['admin', 'superadmin']);

/**
 * Convenience middleware for superadmin-only access
 */
export const requireSuperAdmin = requireRole(['superadmin']);
