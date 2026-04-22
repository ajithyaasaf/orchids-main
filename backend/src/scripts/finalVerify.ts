
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getAllWholesaleProducts } from '../services/wholesaleProductService';

async function run() {
    try {
        const products = await getAllWholesaleProducts();
        const frocks = products.filter(p => 
            p.title.includes('Frock') || 
            (p.category === 'girls' && p.tags?.includes('frocks'))
        );
        console.log(`FROK_COUNT_MATCH: ${frocks.length >= 15}`);
        console.log(`TOTAL_FROCKS: ${frocks.length}`);
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
