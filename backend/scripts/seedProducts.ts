import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

if (!admin.apps.length) {
    try {
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
        console.log('✅ Firebase Connected');
    } catch (error) {
        console.error('❌ Firebase Init Error:', error);
        process.exit(1);
    }
}

const db = admin.firestore();

/**
 * PRICING SYSTEM (Updated 2025-11-28):
 * - basePrice: The actual product cost (what admin sets)
 * - Shipping Buffer: ₹79 added automatically by backend
 * - displayPrice: basePrice + ₹79 (calculated by backend, not stored)
 * - Discounts apply ONLY to basePrice, never to shipping buffer
 * 
 * Formula: Final Price = (basePrice - discount) + ₹79
 */

// NOTE: This array MUST be kept consistent with shared/types.ts
const products = [
    // --- MEN: Linked Variants (styleCode: OX-2025) ---
    {
        title: "Minimalist Oxford Shirt - White",
        description: "Crafted from premium Egyptian cotton. A versatile staple for the modern wardrobe.",
        basePrice: 2420,
        category: "Men",
        tags: ["Shirts", "Formal", "Cotton"],  // Tags for dual navigation
        sizes: ["S", "M", "L", "XL"],
        stockBySize: { S: 10, M: 20, L: 15, XL: 5 },
        inStock: true,
        discountType: "none",
        discountValue: 0,
        styleCode: "OX-2025",
        color: "White",
        images: [
            { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=auto", publicId: "tntrends/products/seed_men_white" },
            { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=auto", publicId: "tntrends/products/seed_men_white_b" }
        ]
    },
    {
        title: "Minimalist Oxford Shirt - Navy Blue",
        description: "Crafted from premium Egyptian cotton. A versatile staple for the modern wardrobe.",
        basePrice: 2420,
        category: "Men",
        tags: ["Shirts", "Formal", "Cotton"],  // Same tags as White variant
        sizes: ["M", "L", "XL"],
        stockBySize: { S: 0, M: 15, L: 15, XL: 10 },
        inStock: true,
        discountType: "percentage",
        discountValue: 15,
        styleCode: "OX-2025",
        color: "Navy Blue",
        images: [
            { url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=auto", publicId: "tntrends/products/seed_men_navy" }
        ]
    },
    // --- MEN: Unlinked product ---
    {
        title: "Slim Tapered Chinos",
        description: "Stretch-infused fabric for maximum comfort.",
        basePrice: 1820,
        category: "Men",
        tags: ["Pants", "Casual"],  // Product-type tags
        sizes: ["S", "M", "L"],
        stockBySize: { S: 12, M: 12, L: 12, XL: 0 },
        inStock: true,
        discountType: "none",
        discountValue: 0,
        styleCode: null,
        color: null,
        images: [
            { url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=auto", publicId: "tntrends/products/seed_men_03" }
        ]
    },

    // --- WOMEN ---
    {
        title: "Oversized Wool Coat",
        description: "A statement piece for the colder months. Features wide lapels.",
        basePrice: 8920,
        category: "Women",
        tags: ["Coats", "Winter", "Outerwear"],  // Product-type tags
        sizes: ["S", "M"],
        stockBySize: { S: 5, M: 5, L: 0, XL: 0 },
        inStock: true,
        discountType: "flat",
        discountValue: 1000,
        styleCode: null,
        color: null,
        images: [
            { url: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&q=auto", publicId: "tntrends/products/seed_women_01" }
        ]
    },
    {
        title: "Silk Touch Midi Dress",
        description: "Elegant silhouette with a fluid drape.",
        basePrice: 4421,
        category: "Women",
        tags: ["Dresses", "Formal", "Elegant"],  // Product-type tags
        sizes: ["XS", "S", "M", "L"],
        stockBySize: { S: 8, M: 8, L: 8, XL: 8 },
        inStock: true,
        discountType: "none",
        discountValue: 0,
        styleCode: null,
        color: null,
        images: [
            { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=auto", publicId: "tntrends/products/seed_women_02" }
        ]
    },
    {
        title: "Essential Knit Sweater",
        description: "Soft, chunky knit texture.",
        basePrice: 2121,
        category: "Women",
        tags: ["Sweaters", "Casual", "Winter"],  // Product-type tags
        sizes: ["S", "M", "L"],
        stockBySize: { S: 20, M: 20, L: 20, XL: 5 },
        inStock: true,
        discountType: "percentage",
        discountValue: 10,
        styleCode: null,
        color: null,
        images: [
            { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=auto", publicId: "tntrends/products/seed_women_03" }
        ]
    },

    // --- KIDS: Flexible Sizing---
    {
        title: "Denim Overall Set",
        description: "Durable denim overalls paired with a soft cotton tee.",
        basePrice: 1420,
        category: "Kids",
        tags: ["Sets", "Denim", "Casual"],  // Product-type tags
        sizes: ["6-12M", "1-2Y", "3-4Y"],
        stockBySize: { "6-12M": 10, "1-2Y": 15, "3-4Y": 5 },
        inStock: true,
        discountType: "none",
        discountValue: 0,
        styleCode: null,
        color: null,
        images: [
            { url: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600&q=auto", publicId: "tntrends/products/seed_kids_01" }
        ]
    },
    {
        title: "Puffer Jacket",
        description: "Warm, lightweight, and water-resistant.",
        basePrice: 2920,
        category: "Kids",
        tags: ["Jackets", "Winter", "Outerwear"],  // Product-type tags
        sizes: ["2-3Y", "4-5Y", "6-7Y"],
        stockBySize: { "2-3Y": 10, "4-5Y": 15, "6-7Y": 5 },
        inStock: true,
        discountType: "percentage",
        discountValue: 20,
        styleCode: null,
        color: null,
        images: [
            { url: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=auto", publicId: "tntrends/products/seed_kids_02" }
        ]
    }
];

const seedDatabase = async () => {
    console.log(`🌱 Starting Seed: ${products.length} products...`);
    console.log('📋 Using NEW pricing system: basePrice + ₹79 buffer');
    console.log('🏷️  WITH tags for dual navigation');

    const batch = db.batch();
    const collectionRef = db.collection('products');

    products.forEach((product: any) => {
        const docRef = collectionRef.doc();

        // Product data with pricing and tags
        const productData = {
            // --- Core Fields ---
            title: product.title,
            description: product.description,
            category: product.category,
            tags: product.tags || [],  // Include tags
            sizes: product.sizes,
            stockBySize: product.stockBySize,
            inStock: product.inStock,
            images: product.images,

            // --- Pricing ---
            basePrice: product.basePrice,
            discountType: product.discountType,
            discountValue: product.discountValue,

            // --- Variants ---
            styleCode: product.styleCode || null,
            color: product.color || null,

            // --- System Fields ---
            id: docRef.id,
            createdAt: new Date(),
        };

        batch.set(docRef, productData);
    });

    try {
        await batch.commit();
        console.log('✅ Database seeded successfully!');
        console.log('');
        console.log('🏷️  Tags added to products:');
        products.forEach(p => {
            console.log(`   ${p.title}: [${(p.tags || []).join(', ')}]`);
        });
        console.log('');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();