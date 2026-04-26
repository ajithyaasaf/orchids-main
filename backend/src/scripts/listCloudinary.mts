import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloud:', process.env.CLOUDINARY_CLOUD_NAME);

// Try fixed-folder API (newer Cloudinary accounts use this)
try {
  const result = await (cloudinary.api as any).resources_by_asset_folder(
    'wholesale/products/girls/frocks/frock1',
    { max_results: 10 }
  );
  console.log('\n[Fixed Folder API] frock1:');
  result.resources.forEach((r: any) => console.log(' ', r.public_id, r.display_name, r.secure_url));
} catch (e: any) {
  console.log('Fixed folder API error:', e.message);
}

// Try legacy prefix API
try {
  const result2 = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'wholesale/products/girls/frocks/frock1',
    max_results: 10,
  });
  console.log('\n[Prefix API] frock1:', result2.resources.length, 'items');
  result2.resources.forEach((r: any) => console.log(' ', r.public_id, r.secure_url));
} catch (e: any) {
  console.log('Prefix API error:', e.message);
}

// Try search API 
try {
  const result3 = await cloudinary.search
    .expression('folder="wholesale/products/girls/frocks/frock1"')
    .max_results(10)
    .execute();
  console.log('\n[Search API] frock1:', result3.total_count, 'items');
  result3.resources.forEach((r: any) => console.log(' ', r.public_id, r.secure_url));
} catch (e: any) {
  console.log('Search API error:', e.message);
}

process.exit(0);
