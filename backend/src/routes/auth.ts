import { Router } from 'express';
import { auth } from '../config/firebase';

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

        // Ensure token was issued recently (within 5 minutes)
        if (new Date().getTime() / 1000 - decodedIdToken.auth_time > 5 * 60) {
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
 * @access Public
 */
router.post('/revoke', async (req, res) => {
    try {
        const { uid } = req.body;
        if (uid) {
            // Revoke all sessions for this specific user
            await auth.revokeRefreshTokens(uid);
        }
        res.json({ success: true, message: 'Sessions revoked' });
    } catch (error: any) {
        console.error('Session revocation error:', error);
        res.status(500).json({ success: false, error: 'Failed to revoke sessions' });
    }
});

export default router;
