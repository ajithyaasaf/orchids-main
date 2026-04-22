
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getAllWholesaleProducts, deleteWholesaleProduct } from '../services/wholesaleProductService';

async function run() {
    try {
        const products = await getAllWholesaleProducts();
        const target = products.find(p => p.title.includes('Style 13') || p.images.some(img => img.includes('product 13')));

        if (target) {
            console.log(`Found product to delete: ${target.title} (${target.id})`);
            await deleteWholesaleProduct(target.id);
            console.log('✅ Deleted successfully!');
        } else {
            console.log('❌ Could not find product "frock 13".');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
