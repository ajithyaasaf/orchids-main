/**
 * Product Slug Generation Script
 * Generates unique, SEO-friendly slugs for all existing products based on their titles.
 *
 * Usage: npx tsx src/scripts/generateProductSlugs.ts
 */

import { db } from '../config/firebase';

const generateSlug = (title: string, id: string): string => {
    const baseSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove non-word characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '')   // Trim hyphens from ends
        .substring(0, 50);         // Truncate to keep URLs reasonable

    const shortHash = id.substring(id.length - 5).toLowerCase();

    return `${baseSlug}-${shortHash}`;
};

async function generateProductSlugs() {
    console.log('🚀 Starting product slug generation...\n');

    const productsRef = db.collection('wholesaleProducts');
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        console.log('No products found. Nothing to migrate.');
        return;
    }

    console.log(`📊 Found ${snapshot.size} documents in wholesaleProducts collection.`);

    const batch = db.batch();
    let migratedCount = 0;
    let skippedCount = 0;

    snapshot.forEach(doc => {
        const data = doc.data();

        // Force regenerate all slugs to use the new enterprise hashing pattern
        const newSlug = generateSlug(data.title || 'unnamed-product', doc.id);

        console.log(`✅ [GENERATE] "${data.title}" → slug: "${newSlug}"`);

        batch.update(doc.ref, {
            slug: newSlug,
            updatedAt: new Date(),
        });

        migratedCount++;
    });

    if (migratedCount > 0) {
        console.log(`\n💾 Committing batch of ${migratedCount} updates to Firestore...`);
        await batch.commit();
        console.log('✅ Batch commit successful!');
    } else {
        console.log('\nNothing to commit.');
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Generated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped:   ${skippedCount}`);
    console.log('\n✨ Done.');
    process.exit(0);
}

generateProductSlugs().catch(err => {
    console.error('\n❌ Fatal Migration Error:');
    console.error(err);
    process.exit(1);
});
