
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_PRIVATE_KEY || '{}');
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error);
        process.exit(1);
    }
}

const checkUserClaims = async (email: string) => {
    try {
        console.log(`🔍 Checking claims for: ${email}`);
        const user = await admin.auth().getUserByEmail(email);

        console.log(`\n👤 User Details:`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Verified: ${user.emailVerified}`);
        console.log(`\n🔐 Custom Claims:`, user.customClaims || '(None)');

        const role = user.customClaims?.role;
        console.log(`\n👮 Effective Role: ${role || 'customer'}`);

        if (role === 'admin' || role === 'superadmin') {
            console.log('\n✅ User HAS admin privileges on the server.');
            console.log('💡 If they still get "Forbidden", they MUST sign out and sign in again to refresh their token.');
        } else {
            console.log('\n❌ User DOES NOT have admin privileges.');
            console.log('   Run setAdminRole.ts to fix this.');
        }

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log(`❌ No user found with email: ${email}`);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
};

const email = process.argv[2] || 'contact@orchids.store';
checkUserClaims(email);
