import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

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

const promoteToAdmin = async (email: string) => {
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;

        console.log(`Found user: ${email} (${uid})`);

        // Set Custom Claims
        await admin.auth().setCustomUserClaims(uid, { role: 'admin' });

        // Update Firestore
        await db.collection('users').doc(uid).set({
            uid: uid,
            email: email,
            name: 'Admin User',
            role: 'admin',
            updatedAt: new Date(),
            createdAt: new Date()
        }, { merge: true });

        console.log(`SUCCESS: ${email} is now an ADMIN.`);
    } catch (error) {
        console.error('Error promoting user:', error);
    }
};

const run = async () => {
    await promoteToAdmin('admin@gmail.com');
    await promoteToAdmin('orchidadmin@gmail.com');
    process.exit(0);
};

run();
