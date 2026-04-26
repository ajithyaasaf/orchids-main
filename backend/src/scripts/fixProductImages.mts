import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { v2 as cloudinary } from 'cloudinary';
import { collections } from '../config/firebase.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// All the product folders in Cloudinary (from the UI screenshot)
const FOLDER_MAP: Record<string, string> = {
  'frock1':      'Designer Cotton Frock - Style 1',
  'frock2':      'Designer Cotton Frock - Style 2',
  'frock3':      'Designer Cotton Frock - Style 3',
  'frock4':      'Designer Cotton Frock - Style 4',
  'Girl Frock 5': 'Premium Girl Frock - Style 5',
  'Girl Frock 6': 'Premium Girl Frock - Style 6',
  'Girl Frock 7': 'Premium Girl Frock - Style 7',
  'Girl Frock 8': 'Premium Girl Frock - Style 8',
  'Girl Frock 9': 'Premium Girl Frock - Style 9',
  'frock10':     'Designer Cotton Frock - Style 10',
  'product 11':  'Wholesale Frock - Style 11',
  'product 12':  'Wholesale Frock - Style 12',
  'product 13':  'Wholesale Frock - Style 13',
  'product 14':  'Wholesale Frock - Style 14',
  'product 15':  'Wholesale Frock - Style 15',
};

const BASE_FOLDER = 'wholesale/products/girls/frocks';

async function getImagesInFolder(folderName: string): Promise<string[]> {
  try {
    const result = await (cloudinary.api as any).resources_by_asset_folder(
      `${BASE_FOLDER}/${folderName}`,
      { max_results: 20 }
    );
    // Sort by display_name to get consistent ordering (1, 2, 3)
    const sorted = result.resources.sort((a: any, b: any) =>
      (a.display_name || a.public_id).localeCompare(b.display_name || b.public_id)
    );
    return sorted.map((r: any) => r.secure_url);
  } catch (e: any) {
    console.error(`  ERROR fetching ${folderName}:`, e.message);
    return [];
  }
}

async function main() {
  console.log('🔍 Fetching all products from Firestore...\n');
  const snapshot = await collections.wholesaleProducts.get();
  const products = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  console.log(`  Found ${products.length} products in DB\n`);

  let updated = 0;
  let skipped = 0;

  for (const [folderName, titlePattern] of Object.entries(FOLDER_MAP)) {
    console.log(`\n📁 Folder: ${folderName} → looking for "${titlePattern}"`);

    // Get actual images from Cloudinary
    const urls = await getImagesInFolder(folderName);
    if (urls.length === 0) {
      console.log(`  ⚠️  No images found in folder, skipping`);
      skipped++;
      continue;
    }
    console.log(`  ✅ Found ${urls.length} image(s): ${urls.map(u => u.split('/').pop()).join(', ')}`);

    // Find matching Firestore product by title
    const product = products.find(p => p.title === titlePattern);
    if (!product) {
      console.log(`  ⚠️  No matching product found with title "${titlePattern}"`);
      skipped++;
      continue;
    }

    // Update Firestore with real URLs
    await collections.wholesaleProducts.doc(product.id).update({ images: urls });
    console.log(`  📝 Updated product "${product.title}" (${product.id})`);
    updated++;
  }

  console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
