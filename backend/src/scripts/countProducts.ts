
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getAllWholesaleProducts } from '../services/wholesaleProductService';

async function run() {
    try {
        const products = await getAllWholesaleProducts();
        console.log(`Total Wholesale Products in database: ${products.length}`);
        
        // List recent ones
        const recent = products.slice(0, 5);
        console.log('Recent products:');
        recent.forEach(p => console.log(`- ${p.title} (${p.id})`));
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
