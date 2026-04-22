
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getAllWholesaleProducts } from '../services/wholesaleProductService';

async function diagnose() {
    console.log('🔍 Starting Product Diagnostic...');
    try {
        const products: any[] = await getAllWholesaleProducts();
        console.log(`📊 Found ${products.length} products.`);

        const slugs = new Set<string>();
        const duplicates: string[] = [];
        const itemsWithIssues: any[] = [];

        products.forEach((p: any) => {
            const issues: string[] = [];
            if (!p.id) issues.push('missing id');
            if (!p.slug) issues.push('missing slug');
            if (!p.title) issues.push('missing title');
            if (!p.bundleComposition) issues.push('missing bundleComposition');
            if (p.bundleComposition && Object.keys(p.bundleComposition).length === 0) issues.push('empty bundleComposition');
            if (!p.images || p.images.length === 0) issues.push('missing images');
            if (!p.styleCode) issues.push('missing styleCode');
            if (p.bundlePrice === undefined || p.bundlePrice === null) issues.push('missing bundlePrice');

            if (issues.length > 0) {
                itemsWithIssues.push({ id: p.id, title: p.title, issues });
            }

            if (p.slug) {
                if (slugs.has(p.slug)) {
                    duplicates.push(p.slug);
                }
                slugs.add(p.slug);
            }
        });

        if (duplicates.length > 0) {
            console.log('❌ Duplicate Slugs found:', duplicates);
        } else {
            console.log('✅ No duplicate slugs found.');
        }

        if (itemsWithIssues.length > 0) {
            console.log('❌ Products with Issues:');
            itemsWithIssues.forEach(p => {
                console.log(`- [${p.id}] ${p.title || 'Untitled'}: ${p.issues.join(', ')}`);
            });
        } else {
            console.log('✅ All products have required fields.');
        }

    } catch (err) {
        console.error('💥 Diagnostic Failed:', err);
    }
}

diagnose();
