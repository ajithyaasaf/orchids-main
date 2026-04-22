
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/wholesale-products';

async function diagnoseProducts() {
    try {
        console.log(`Fetching products from ${API_URL}...`);
        const response = await axios.get(API_URL);
        const products = response.data.products;
        
        console.log(`Total products found: ${products.length}`);
        
        const issues = [];
        const missingSlugs = [];
        
        for (const p of products) {
            const productIssues = [];
            // Check for fields that trigger 500 error in frontend
            if (p.bundlePrice === undefined || p.bundlePrice === null) productIssues.push('Missing bundlePrice');
            if (p.bundleQty === undefined || p.bundleQty === null) productIssues.push('Missing bundleQty');
            if (p.availableBundles === undefined || p.availableBundles === null) productIssues.push('Missing availableBundles');
            
            if (productIssues.length > 0) {
                issues.push({
                    id: p.id,
                    title: p.title,
                    slug: p.slug || 'NO_SLUG',
                    issues: productIssues
                });
            }

            if (!p.slug) {
                missingSlugs.push({
                    id: p.id,
                    title: p.title
                });
            }
        }
        
        if (issues.length > 0) {
            console.log('\n--- CRITICAL: Products that WILL trigger 500 error ---');
            console.log(JSON.stringify(issues, null, 2));
        } else {
            console.log('\nNo products found with critical missing pricing/qty fields.');
        }

        if (missingSlugs.length > 0) {
            console.log('\n--- WARNING: Products missing slugs (cannot be opened) ---');
            console.log(JSON.stringify(missingSlugs, null, 2));
        }
        
    } catch (error) {
        console.error('Error fetching products:', error.message);
    }
}

diagnoseProducts();
