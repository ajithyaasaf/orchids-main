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

const updateGlobalSettings = async () => {
    try {
        console.log('Updating global settings in Firestore...');
        await db.collection('settings').doc('global').set({
            freeShippingAbove: 4999,
            shippingCharge: 199,
        }, { merge: true });

        const doc = await db.collection('settings').doc('global').get();
        console.log('Updated settings successfully:', doc.data());
    } catch (error) {
        console.error('Error updating settings:', error);
    }
};

const run = async () => {
    await updateGlobalSettings();
    process.exit(0);
};

run();
