import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin (same way as backend does)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
        console.log('✅ Firebase Admin initialized successfully\n');
    } catch (error: any) {
        console.error('❌ Firebase initialization failed:', error.message);
        console.error('\n⚠️  Make sure your .env file has:');
        console.error('   - FIREBASE_PROJECT_ID');
        console.error('   - FIREBASE_PRIVATE_KEY');
        console.error('   - FIREBASE_CLIENT_EMAIL\n');
        process.exit(1);
    }
}

/**
 * Set custom role claim for a user
 * @param email - User's email address
 * @param role - Role to assign: 'customer', 'admin', or 'superadmin'
 */
async function setUserRole(email: string, role: 'customer' | 'admin' | 'superadmin') {
    try {
        // Get user by email
        const user = await admin.auth().getUserByEmail(email);

        // Set custom claims
        await admin.auth().setCustomUserClaims(user.uid, { role });

        console.log(`✅ Successfully set role "${role}" for ${email}`);
        console.log(`   UID: ${user.uid}`);
        console.log('');
        console.log('⚠️  IMPORTANT: User must log out and log back in for changes to take effect!');
        console.log('   Or call: await user.getIdToken(true) to force token refresh');
        console.log('');
    } catch (error: any) {
        console.error(`❌ Error setting role for ${email}:`, error.message);
        if (error.code === 'auth/user-not-found') {
            console.error('   This user does not exist in Firebase Authentication.');
            console.error('   Make sure the user has signed up first!\n');
        }
    }
}

/**
 * Main function - Add your user emails and roles here
 */
async function main() {
    console.log('🔐 Setting User Roles...\n');

    // ========================================
    // ADD YOUR USERS HERE
    // Replace 'your-email@example.com' with your actual email
    // ========================================

    // Example: Set yourself as superadmin
    await setUserRole('test1@gmail.com', 'superadmin');

    // Example: Set another admin
    // await setUserRole('admin@example.com', 'admin');

    // Example: Set a customer (usually not needed, customer is default)
    // await setUserRole('customer@example.com', 'customer');

    console.log('✅ Done! Remember to log out and back in.');
    process.exit(0);
}

// Run the script
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
