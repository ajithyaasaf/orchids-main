
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getAllWholesaleProducts, updateWholesaleProduct } from '../services/wholesaleProductService';

async function run() {
    try {
        const products = await getAllWholesaleProducts();
        const testProduct = products.find(p => p.title.toLowerCase().includes('test'));
        
        if (testProduct) {
            console.log(`Found test product: ${testProduct.id}`);
            // Use 3 copies of the same image to test thumbnails
            await updateWholesaleProduct(testProduct.id, {
                images: ['/images/1.png', '/images/1.png', '/images/1.png']
            });
            console.log('✅ Updated test product with 3 sub-images (/images/1.png)');
        } else {
            console.log('❌ Could not find a product with "test" in title.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
