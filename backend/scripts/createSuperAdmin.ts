import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

// Initialize Firebase Admin
if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

const db = admin.firestore();

const promoteUser = async (email: string) => {
    try {
        // 1. Find user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        console.log(`🔍 Found user: ${email} (${uid})`);

        // 2. Set Custom Claims (The "Real" Security)
        // This allows backend middleware to verify role without DB lookups
        await admin.auth().setCustomUserClaims(uid, { role: 'superadmin' });

        // 3. Update Firestore (The "UI" Security)
        // This allows the frontend to show the correct UI
        await db.collection('users').doc(uid).set({
            role: 'superadmin',
            updatedAt: new Date()
        }, { merge: true });

        console.log(`✅ SUCCESS: ${email} is now a SUPER ADMIN.`);
        console.log(`👉 NOTE: You must LOG OUT and LOG IN again on the frontend for changes to take effect.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error promoting user:', error);
        process.exit(1);
    }
};

// Get email from command line argument
const targetEmail = process.argv[2];

if (!targetEmail) {
    console.error('Please provide an email address.');
    console.error('Usage: npx ts-node scripts/createSuperAdmin.ts <email>');
    process.exit(1);
}

promoteUser(targetEmail);

`bash
npx ts - node scripts / createSuperAdmin.ts owner @tntrends.com
Run it like this:`

