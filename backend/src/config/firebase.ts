import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
        });
        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error);
        throw error;
    }
};

initializeFirebase();

export const db = admin.firestore();
export const auth = admin.auth();

// Firestore collections
export const collections = {
    products: db.collection('products'),
    orders: db.collection('orders'),
    users: db.collection('users'),
    settings: db.collection('settings'),
    coupons: db.collection('coupons'),
    analytics: db.collection('analytics'),
};

export default admin;
