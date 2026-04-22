
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { collections } from '../config/firebase';

async function run() {
    const snapshot = await collections.wholesaleProducts.get();
    console.log(`\n📦 Total products: ${snapshot.size}\n`);

    let localPathCount = 0;
    let cloudinaryCount = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const images: string[] = data.images ?? [];
        const firstImage = images[0] ?? 'NO IMAGE';
        const isLocal = firstImage.startsWith('/images/');

        if (isLocal) localPathCount++;
        else cloudinaryCount++;

        console.log(`${isLocal ? '❌ LOCAL' : '✅ CDN  '} | ${data.title}`);
        console.log(`         ${firstImage.substring(0, 80)}`);
    }

    console.log('\n─────────────────────────────────────────────────');
    console.log(`✅ Using Cloudinary CDN : ${cloudinaryCount}`);
    console.log(`❌ Still on local path  : ${localPathCount}`);
    console.log('─────────────────────────────────────────────────\n');
}

run().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
