/**
 * Quick Admin Role Setter
 * Run this to grant admin access to ajith@gmail.com
 * 
 * Usage: npx tsx src/scripts/quickAdminFix.ts
 */

import { auth } from '../config/firebase';

async function setAdmin() {
    try {
        console.log('🔍 Looking up user: ajith@gmail.com');
        const user = await auth.getUserByEmail('ajith@gmail.com');

        console.log(`✅ Found user: ${user.uid}`);
        console.log('Current claims:', user.customClaims);

        // Set superadmin role
        await auth.setCustomUserClaims(user.uid, {
            role: 'superadmin',
            isAdmin: true
        });

        console.log('✅ SUCCESS! Admin role set.');
        console.log('⚠️  User must refresh their browser or sign out/in for changes to take effect.');

        // Verify
        const updated = await auth.getUser(user.uid);
        console.log('New claims:', updated.customClaims);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

setAdmin();
