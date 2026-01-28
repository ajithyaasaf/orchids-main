import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { auth } from '../config/firebase';

type AllowedRole = 'superadmin' | 'admin' | 'customer';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: AllowedRole[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
            console.log(`⚠️ Token role '${userRole}' failed. Checking fresh claims via Admin SDK...`);

            try {
                // FALLBACK: Fetch fresh user record from Firebase Admin
                // This handles cases where custom claims were updated but token is stale
                const freshUser = await auth.getUser(req.user.uid);
                const freshRole = (freshUser.customClaims?.role as AllowedRole) || 'customer';

                console.log(`🔍 Fresh server-side role: '${freshRole}'`);

                if (allowedRoles.includes(freshRole)) {
                    console.log('✅ PASSED: Fresh server claims verified (Token was stale)');
                    // Update request user with fresh role
                    req.user.role = freshRole;
                    next();
                    return;
                }
            } catch (err) {
                console.error('❌ Failed to fetch fresh claims:', err);
            }

            console.log('❌ REJECTED: Role mismatch');
            res.status(403).json({
                success: false,
                error: `Forbidden: Insufficient permissions. Required: ${allowedRoles.join(' or ')}. Found role: '${userRole}'`,
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
