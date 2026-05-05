import * as admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase
const serviceAccountPath = path.resolve(__dirname, 'orchids-wholesale-firebase-adminsdk.json');
let app;
if (!admin.apps.length) {
    // We will just use the default env vars since they are already set in .env
    require('dotenv').config();
    app = admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
} else {
    app = admin.app();
}

const db = admin.firestore(app);

async function main() {
    try {
        console.log('Fetching global settings...');
        const docRef = db.collection('settings').doc('global');
        const doc = await docRef.get();

        if (doc.exists) {
            console.log('Current settings:', doc.data());
            
            await docRef.update({
                gstRate: 0.05
            });
            console.log('✅ Successfully updated global gstRate to 5% (0.05) in Firestore!');
        } else {
            console.log('Settings document not found. Default in code will be used.');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
