
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createWholesaleProduct } from '../services/wholesaleProductService';

/**
 * Cloudinary CDN base URL for frock images.
 * Structure: wholesale/products/girls/frocks/{folderName}/{imageIndex}.{ext}
 */
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/wholesale/products/girls/frocks`;

/**
 * Generates a Cloudinary image URL for a given folder and image index.
 * Handles folder names with spaces by encoding them.
 */
function getCloudinaryImageUrl(folder: string, index: number): string {
    const encodedFolder = folder.replace(/ /g, '%20');
    return `${CLOUDINARY_BASE}/${encodedFolder}/${index}.png`;
}

const FROCK_FOLDERS = [
    'frock1', 'frock2', 'frock3', 'frock4',
    'Girl Frock 5', 'Girl Frock 6', 'Girl Frock 7', 'Girl Frock 8', 'Girl Frock 9',
    'frock10',
    'product 11', 'product 12', 'product 13', 'product 14', 'product 15'
];

async function run() {
    if (!CLOUD_NAME) {
        console.error('❌ CLOUDINARY_CLOUD_NAME is not set in .env');
        process.exit(1);
    }

    console.log('🚀 Starting bulk import of 15 frocks...');
    
    for (const folder of FROCK_FOLDERS) {
        // Generate a nice title
        let title = folder;
        if (folder.startsWith('frock')) title = `Designer Cotton Frock - Style ${folder.replace('frock', '')}`;
        else if (folder.startsWith('Girl Frock')) title = `Premium Girl Frock - Style ${folder.replace('Girl Frock ', '')}`;
        else if (folder.startsWith('product')) title = `Wholesale Frock - Style ${folder.replace('product ', '')}`;

        const productData = {
            title,
            description: "High-quality, breathable cotton frock for girls. Perfect for wholesale bundles. Features vibrant prints and comfortable fit.",
            category: 'girls',
            tags: ['frocks'],
            styleCode: `FROCK-${folder.replace(/\s+/g, '-').toUpperCase()}`,
            colorName: "Assorted Prints",
            bundleQty: 20,
            bundleComposition: { 
                '2-3Y': 5, 
                '3-4Y': 5, 
                '4-5Y': 5, 
                '5-6Y': 5 
            },
            bundlePrice: 10000,
            availableBundles: 25,
            reservedBundles: 0,
            colorDescription: "Assorted patterns and colors in every bundle.",
            // ✅ Using Cloudinary CDN URLs instead of local public paths
            images: [
                getCloudinaryImageUrl(folder, 1),
                getCloudinaryImageUrl(folder, 2),
                getCloudinaryImageUrl(folder, 3),
            ],
            mixedColors: true
        };

        try {
            const result = await createWholesaleProduct(productData as any);
            console.log(`✅ Created: ${result.title} (ID: ${result.id})`);
        } catch (error: any) {
            console.error(`❌ Failed to create ${title}:`, error.message);
        }
    }
    
    console.log('✨ Bulk import complete!');
}

run();
