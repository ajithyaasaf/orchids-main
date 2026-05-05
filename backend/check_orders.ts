import * as admin from 'firebase-admin';
import { collections } from './src/config/firebase';

async function checkRecentOrders() {
    console.log('Fetching recent wholesale orders...');
    const snapshot = await collections.wholesaleOrders
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Order ID: ${doc.id}, Status: ${data.paymentStatus}, isTestMode (implicit): ${data.gatewayOrderId}, createdAt: ${data.createdAt?.toDate?.()}`);
    });
    process.exit(0);
}

checkRecentOrders().catch(console.error);
