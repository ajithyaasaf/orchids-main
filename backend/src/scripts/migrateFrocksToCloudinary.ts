
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { collections } from '../config/firebase';

/**
 * Migration Script: Local Image Paths → Cloudinary URLs
 *
 * This script finds all wholesale products whose image URLs are
 * still pointing to local /public paths and migrates them to the
 * Cloudinary CDN URLs we uploaded to.
 *
 * Cloudinary structure used:
 *   wholesale/products/girls/frocks/{folderName}/{imageIndex}
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrateFrocksToCloudinary.ts
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

if (!CLOUD_NAME) {
    console.error('❌ CLOUDINARY_CLOUD_NAME is not set in .env');
    process.exit(1);
}

// -------------------------------------------------------------------
// Folder name mappings: local path segment → Cloudinary folder name
// These must match exactly what you uploaded to Cloudinary.
// -------------------------------------------------------------------
const FOLDER_MAPPING: Record<string, string> = {
    'frock1':        'frock1',
    'frock2':        'frock2',
    'frock3':        'frock3',
    'frock4':        'frock4',
    'Girl Frock 5':  'Girl Frock 5',
    'Girl Frock 6':  'Girl Frock 6',
    'Girl Frock 7':  'Girl Frock 7',
    'Girl Frock 8':  'Girl Frock 8',
    'Girl Frock 9':  'Girl Frock 9',
    'frock10':       'frock10',
    'product 11':    'product 11',
    'product 12':    'product 12',
    'product 13':    'product 13',
    'product 14':    'product 14',
    'product 15':    'product 15',
};

// Supported image extensions by Cloudinary (used to build the URL)
const IMAGE_EXTENSIONS: Record<string, string> = {
    '1': 'png',
    '2': 'png',
    '3': 'png',
};

/**
 * Convert a local image path like /images/Products/Frocks/frock1/1.png
 * to a fully qualified Cloudinary URL.
 */
function convertToCloudinaryUrl(localPath: string): string | null {
    // Match pattern: /images/Products/Frocks/{folderName}/{imageName}.{ext}
    const match = localPath.match(/\/images\/Products\/Frocks\/(.+?)\/(\d+)\.(png|jpg|jpeg|webp)/i);

    if (!match) return null;

    const [, rawFolder, imageIndex] = match;

    // Lookup the Cloudinary folder name (handles spaces in folder names)
    const cloudinaryFolder = FOLDER_MAPPING[rawFolder];
    if (!cloudinaryFolder) {
        console.warn(`  ⚠️  No Cloudinary folder mapping for: "${rawFolder}". Skipping.`);
        return null;
    }

    const encodedFolder = encodeURIComponent(cloudinaryFolder).replace(/%20/g, '%20');
    const ext = IMAGE_EXTENSIONS[imageIndex] ?? 'png';

    // Build the Cloudinary URL
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/wholesale/products/girls/frocks/${encodedFolder}/${imageIndex}.${ext}`;
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------
async function run() {
    console.log('🚀 Starting Firestore → Cloudinary migration...\n');

    const snapshot = await collections.wholesaleProducts.get();

    if (snapshot.empty) {
        console.log('ℹ️  No products found in Firestore.');
        return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const currentImages: string[] = data.images ?? [];

        // Check if ANY image is still a local path
        const needsMigration = currentImages.some(img => img.startsWith('/images/'));

        if (!needsMigration) {
            console.log(`⏭️  Skipping "${data.title}" (already using remote URLs)`);
            skippedCount++;
            continue;
        }

        console.log(`\n🔄 Migrating: "${data.title}" (${doc.id})`);

        const newImages: string[] = [];
        let conversionFailed = false;

        for (const localPath of currentImages) {
            if (!localPath.startsWith('/images/')) {
                // Already a remote URL, keep as-is
                newImages.push(localPath);
                continue;
            }

            const cloudinaryUrl = convertToCloudinaryUrl(localPath);

            if (cloudinaryUrl) {
                console.log(`   ✅ ${localPath}`);
                console.log(`      → ${cloudinaryUrl}`);
                newImages.push(cloudinaryUrl);
            } else {
                console.error(`   ❌ Could not convert: ${localPath}`);
                newImages.push(localPath); // Keep original if conversion fails
                conversionFailed = true;
            }
        }

        try {
            await collections.wholesaleProducts.doc(doc.id).update({
                images: newImages,
                updatedAt: new Date(),
            });

            if (conversionFailed) {
                console.warn(`   ⚠️  Partially migrated "${data.title}" (some images could not be converted)`);
                errorCount++;
            } else {
                console.log(`   💾 Firestore updated for "${data.title}"`);
                migratedCount++;
            }
        } catch (err: any) {
            console.error(`   💥 Failed to update Firestore for "${data.title}":`, err.message);
            errorCount++;
        }
    }

    console.log('\n─────────────────────────────────');
    console.log(`✨ Migration complete!`);
    console.log(`   ✅ Migrated : ${migratedCount} products`);
    console.log(`   ⏭️  Skipped  : ${skippedCount} products (already migrated)`);
    console.log(`   ❌ Errors   : ${errorCount} products`);
    console.log('─────────────────────────────────\n');
}

run().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
