import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n')
            : undefined;

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log('✅ Firebase Connected for Wholesale Seed');
    } catch (error) {
        console.error('❌ Firebase Init Error:', error);
        process.exit(1);
    }
}

const db = admin.firestore();

const wholesaleProducts = [
    {
        title: "Premium Cotton T-Shirt Bundle",
        description: "100% Bio-washed cotton t-shirts. 10 pieces per bundle.",
        category: "Men",
        bundleQty: 10,
        bundlePrice: 2500,
        availableBundles: 50,
        sku: "W-TS-MEN-01",
        bundleComposition: {
            "S": 2,
            "M": 3,
            "L": 3,
            "XL": 2
        },
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
        tags: ["Cotton", "Summer", "Basic"]
    },
    {
        title: "Denim Jeans Wholesale Pack",
        description: "High-quality stretchable denim. 5 pieces per bundle.",
        category: "Men",
        bundleQty: 5,
        bundlePrice: 4500,
        availableBundles: 20,
        sku: "W-DN-MEN-02",
        bundleComposition: {
            "30": 1,
            "32": 2,
            "34": 1,
            "36": 1
        },
        images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800"],
        tags: ["Denim", "Jeans", "Casual"]
    }
];

const seedWholesale = async () => {
    console.log(`🌱 Seeding ${wholesaleProducts.length} wholesale products...`);
    const batch = db.batch();
    const collectionRef = db.collection('wholesaleProducts');

    wholesaleProducts.forEach((product: any) => {
        const docRef = collectionRef.doc();
        const data = {
            ...product,
            id: docRef.id,
            slug: product.title.toLowerCase().replace(/ /g, '-') + '-' + docRef.id.slice(-5),
            totalPieces: product.availableBundles * product.bundleQty,
            inStock: true,
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        batch.set(docRef, data);
    });

    try {
        await batch.commit();
        console.log('✅ Wholesale database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding wholesale database:', error);
        process.exit(1);
    }
};

seedWholesale();
