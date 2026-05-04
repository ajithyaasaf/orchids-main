import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { auth } from '../config/firebase';
import logger from '../utils/logger';

type AllowedRole = 'superadmin' | 'admin' | 'customer';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: AllowedRole[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            logger.warn('Access rejected: No user session found');
            res.status(401).json({
                success: false,
                error: 'Unauthorized: Authentication required',
            });
            return;
        }

        const userRole = req.user.role as AllowedRole;

        if (!allowedRoles.includes(userRole)) {
            logger.warn(`Token role '${userRole}' insufficient. Checking fresh claims & Firestore...`, {
                uid: req.user.uid,
                email: req.user.email,
                required: allowedRoles
            });

            try {
                // FALLBACK 1: Check fresh custom claims from Auth
                const freshUser = await auth.getUser(req.user.uid);
                let finalRole = (freshUser.customClaims?.role as AllowedRole);

                // FALLBACK 2: Check Firestore 'users' collection (The source of truth in the UI)
                if (!finalRole || !allowedRoles.includes(finalRole)) {
                    const { collections } = await import('../config/firebase');
                    const userDoc = await collections.users.doc(req.user.uid).get();
                    const dbRole = userDoc.exists ? (userDoc.data()?.role as AllowedRole) : null;

                    if (dbRole) {
                        logger.info(`Source of Truth: Firestore role '${dbRole}' found for user ${req.user.uid}`);
                        
                        // SELF-HEALING: If DB has the role but Auth doesn't, sync them now
                        if (dbRole !== finalRole) {
                            logger.info(`Self-Healing: Syncing Firestore role '${dbRole}' to Firebase Auth custom claims...`);
                            await auth.setCustomUserClaims(req.user.uid, { ...freshUser.customClaims, role: dbRole });
                            finalRole = dbRole;
                        }
                    }
                }

                if (finalRole && allowedRoles.includes(finalRole)) {
                    logger.info(`Access granted after sync: Role '${finalRole}' verified for ${req.user.uid}`);
                    // Update request user with fresh role for the rest of this request
                    req.user.role = finalRole;
                    next();
                    return;
                }
            } catch (err) {
                logger.error('Critical failure in role verification fallback:', err);
            }

            logger.security('Access denied: Role mismatch', {
                uid: req.user.uid,
                foundRole: userRole,
                requiredRoles: allowedRoles
            });
            res.status(403).json({
                success: false,
                error: `Forbidden: Insufficient permissions. Required: ${allowedRoles.join(' or ')}. Found role: '${userRole}'`,
            });
            return;
        }

        logger.debug('Access granted: Role verified');
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
