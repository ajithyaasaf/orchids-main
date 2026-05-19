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

const readGlobalSettings = async () => {
    try {
        console.log('Fetching global settings from Firestore...');
        const doc = await db.collection('settings').doc('global').get();
        if (doc.exists) {
            console.log('CURRENT_SETTINGS_JSON:' + JSON.stringify(doc.data()));
        } else {
            console.log('CURRENT_SETTINGS_JSON:NOT_EXISTS');
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
};

const run = async () => {
    await readGlobalSettings();
    process.exit(0);
};

run();
