import { Router, Response } from 'express';
import { auth } from '../config/firebase';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @desc Create Firebase Session Cookie from ID Token
 * @route POST /api/auth/session
 * @access Public
 */
router.post('/session', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(401).json({ success: false, error: 'ID token is required' });
        }

        // Set session expiration to 14 days
        const expiresIn = 1000 * 60 * 60 * 24 * 14;

        // Verify the ID token before creating the session cookie
        const decodedIdToken = await auth.verifyIdToken(idToken);

        // Allow up to 15 minutes of leeway for clock skew instead of 5
        if (new Date().getTime() / 1000 - decodedIdToken.auth_time > 15 * 60) {
            console.warn(`[Auth] Token auth_time (${decodedIdToken.auth_time}) is older than 15 minutes. Rejecting.`);
            return res.status(401).json({ success: false, error: 'Recent sign-in required' });
        }

        // Create the session cookie
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        res.json({
            success: true,
            data: { sessionCookie }
        });
    } catch (error: any) {
        console.error('Session creation error:', error);
        res.status(401).json({ success: false, error: 'Invalid or expired ID token' });
    }
});

/**
 * @desc Completely revoke a user's session
 * @route POST /api/auth/revoke
 * @access Protected (Self or Admin)
 */
router.post('/revoke', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const targetUid = req.body.uid || req.user?.uid;
        if (!targetUid) {
            return res.status(400).json({ success: false, error: 'User UID is required' });
        }

        // Only the user themselves or an admin can revoke tokens
        const isSelf = req.user?.uid === targetUid;
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';

        if (!isSelf && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: You do not have permission to revoke this session'
            });
        }

        // Revoke all sessions for this specific user
        await auth.revokeRefreshTokens(targetUid);
        res.json({ success: true, message: 'Sessions revoked successfully' });
    } catch (error: any) {
        console.error('Session revocation error:', error);
        res.status(500).json({ success: false, error: 'Failed to revoke sessions' });
    }
});

export default router;
