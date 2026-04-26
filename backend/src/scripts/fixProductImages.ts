import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { v2 as cloudinary } from 'cloudinary';
import { collections } from '../config/firebase';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Mapping: Cloudinary folder name → Firestore product title
const FOLDER_MAP: Record<string, string> = {
  'frock1': 'Designer Cotton Frock - Style 1',
  'frock2': 'Designer Cotton Frock - Style 2',
  'frock3': 'Designer Cotton Frock - Style 3',
  'frock4': 'Designer Cotton Frock - Style 4',
  'Girl Frock 5': 'Premium Girl Frock - Style 5',
  'Girl Frock 6': 'Premium Girl Frock - Style 6',
  'Girl Frock 7': 'Premium Girl Frock - Style 7',
  'Girl Frock 8': 'Premium Girl Frock - Style 8',
  'Girl Frock 9': 'Premium Girl Frock - Style 9',
  'frock10': 'Designer Cotton Frock - Style 10',
  'product 11': 'Wholesale Frock - Style 11',
  'product 12': 'Wholesale Frock - Style 12',
  'product 13': 'Wholesale Frock - Style 13',
  'product 14': 'Wholesale Frock - Style 14',
  'product 15': 'Wholesale Frock - Style 15',
};

const BASE_FOLDER = 'wholesale/products/girls/frocks';

async function getPublicIdsInFolder(folderName: string): Promise<string[]> {
  try {
    const result = await (cloudinary.api as any).resources_by_asset_folder(
      `${BASE_FOLDER}/${folderName}`,
      { max_results: 20 }
    );
    // Sort by display_name for consistent ordering (1, 2, 3...)
    const sorted = result.resources.sort((a: any, b: any) =>
      (a.display_name || a.public_id).localeCompare(b.display_name || b.public_id)
    );
    // ✅ BEST PRACTICE: Store the public_id, NOT the secure_url.
    // The full optimized URL is constructed at render time by getCloudinaryUrl()
    // in frontend/src/lib/cloudinaryImage.ts, with f_auto,q_auto applied.
    return sorted.map((r: any) => r.public_id);
  } catch (e: any) {
    console.error(`  ERROR fetching "${folderName}":`, e.message);
    return [];
  }
}


async function main() {
  console.log('☁️  Cloud:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('🔍 Fetching all products from Firestore...\n');

  const snapshot = await collections.wholesaleProducts.get();
  const products = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  console.log(`  Found ${products.length} products in DB\n`);

  let updated = 0;
  let skipped = 0;

  for (const [folderName, titlePattern] of Object.entries(FOLDER_MAP)) {
    console.log(`\n📁 ${folderName} → "${titlePattern}"`);

    const publicIds = await getPublicIdsInFolder(folderName);
    if (publicIds.length === 0) {
      console.log(`  ⚠️  No images found`);
      skipped++;
      continue;
    }
    console.log(`  ✅ ${publicIds.length} public_id(s): ${publicIds.join(', ')}`);

    const product = products.find(p => p.title === titlePattern);
    if (!product) {
      console.log(`  ❌ No matching DB product`);
      skipped++;
      continue;
    }

    await collections.wholesaleProducts.doc(product.id).update({ images: publicIds });
    console.log(`  📝 Updated DB: "${product.title}" (${product.id}) — stored ${publicIds.length} public_id(s)`);
    updated++;
  }

  console.log(`\n=============================`);
  console.log(`✅ Done! Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
