/**
 * Category Migration Script
 * Normalizes legacy category strings (e.g. "Girls - T-Shirts") into the new
 * structured format: { category: 'girls', tags: ['t-shirts'] }
 *
 * Usage: npx tsx src/scripts/migrateCategories.ts
 */

import { db } from '../config/firebase';
import { migrateLegacyCategory } from '@orchids/shared';

async function migrateWholesaleCategories() {
    console.log('🚀 Starting wholesale categories migration...\n');
    const snapshot = await db.collection('wholesaleProducts').get();

    console.log(`📊 Found ${snapshot.size} documents in wholesaleProducts collection.`);

    if (snapshot.empty) {
        console.log('No products found. Nothing to migrate.');
        return;
    }

    let migratedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    const batch = db.batch();

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const legacyCategory = data.category as string;

        // If it already has tags and category is a slug (no ' - '), it may already be migrated
        if (data.tags && Array.isArray(data.tags) && data.tags.length > 0 && !legacyCategory.includes(' - ')) {
            console.log(`⏭️  [SKIP] Already migrated: "${legacyCategory}" (ID: ${doc.id})`);
            skippedCount++;
            return;
        }

        const mapped = migrateLegacyCategory(legacyCategory);

        if (mapped) {
            console.log(`✅ [MIGRATE] "${legacyCategory}" → category: "${mapped.category}", tags: [${mapped.tags.join(', ')}]`);
            batch.update(doc.ref, {
                category: mapped.category,
                tags: mapped.tags,
            });
            migratedCount++;
        } else if (!legacyCategory.includes(' - ')) {
            // No " - " separator but potentially tagless? 
            // Ensure tags field exists at least as []
            console.log(`🔧 [REPAIR] Initializing missing tags for slug category: "${legacyCategory}" (ID: ${doc.id})`);
            batch.update(doc.ref, {
                tags: data.tags || []
            });
            migratedCount++;
        } else {
            console.log(`❌ [FAILED] Cannot map: "${legacyCategory}" (ID: ${doc.id})`);
            failedCount++;
        }
    });

    if (migratedCount > 0) {
        console.log(`\n💾 Committing batch of ${migratedCount} updates to Firestore...`);
        await batch.commit();
        console.log('✅ Batch commit successful!\n');
    } else {
        console.log('\nNothing to commit.\n');
    }

    console.log('📊 Migration Summary:');
    console.log(`   ✅ Migrated:  ${migratedCount}`);
    console.log(`   ⏭️  Skipped:   ${skippedCount}`);
    console.log(`   ❌ Failed:    ${failedCount}`);
    console.log('\n✨ Done.');
    process.exit(0);
}

migrateWholesaleCategories().catch(err => {
    console.error('💥 Migration failed:', err);
    process.exit(1);
});
