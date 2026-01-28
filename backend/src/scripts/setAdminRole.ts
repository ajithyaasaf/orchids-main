
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID!,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
            }),
        });
        console.log('✅ Firebase Admin initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error);
        process.exit(1);
    }
}

const setAdminRole = async (email: string) => {
    try {
        console.log(`🔍 Looking for user with email: ${email}`);
        const user = await admin.auth().getUserByEmail(email);

        console.log(`👤 User found: ${user.uid}`);
        console.log(`   Current claims:`, user.customClaims);

        // Set admin role
        await admin.auth().setCustomUserClaims(user.uid, {
            ...user.customClaims,
            role: 'admin',
            isAdmin: true
        });

        console.log('✅ Successfully set admin role for user!');
        console.log('⚠️  NOTE: User must sign out and sign in again for changes to take effect.');

        // Verify
        const updatedUser = await admin.auth().getUser(user.uid);
        console.log('   New claims:', updatedUser.customClaims);

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.error('❌ User not found. Please check the email.');

            // List last 5 users to help debug
            console.log('\n📋 Recent users:');
            const listUsers = await admin.auth().listUsers(5);
            listUsers.users.forEach(u => {
                console.log(`   - ${u.email} (${u.uid})`);
            });
        } else {
            console.error('❌ Error setting admin role:', error);
        }
    }
};

// Get email from command line or use default
const targetEmail = process.argv[2] || 'tntrendsdigital@gmail.com'; // Default from env
setAdminRole(targetEmail);
