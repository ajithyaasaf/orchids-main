import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

import { logger } from '../utils/logger';

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    const requiredEnv = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL'
    ];

    const missing = requiredEnv.filter(k => !process.env[k]);
    if (missing.length > 0) {
        const errorMsg = `CRITICAL: Missing required Firebase environment variables: ${missing.join(', ')}`;
        console.error(errorMsg);
        process.exit(1);
    }

    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY!
            .replace(/^"(.*)"$/, '$1')
            .replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: privateKey,
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
    wholesaleProducts: db.collection('wholesaleProducts'), // WHOLESALE: Product catalog
    wholesaleOrders: db.collection('wholesaleOrders'),     // WHOLESALE: Order management
};

export default admin;
