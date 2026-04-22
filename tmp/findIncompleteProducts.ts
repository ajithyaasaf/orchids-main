
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/wholesale-products';

async function diagnoseProducts() {
    try {
        const response = await axios.get(API_URL);
        const products = response.data.products;
        
        console.log(`Total products found: ${products.length}`);
        
        const issues = [];
        
        for (const p of products) {
            const productIssues = [];
            if (!p.bundlePrice && p.bundlePrice !== 0) productIssues.push('Missing bundlePrice');
            if (!p.bundleQty && p.bundleQty !== 0) productIssues.push('Missing bundleQty');
            if (p.availableBundles === undefined) productIssues.push('Missing availableBundles');
            if (!p.slug) productIssues.push('Missing slug');
            
            if (productIssues.length > 0) {
                issues.push({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    issues: productIssues
                });
            }
        }
        
        if (issues.length > 0) {
            console.log('\n--- Products with potential 500 error triggers ---');
            console.log(JSON.stringify(issues, null, 2));
        } else {
            console.log('\nNo products found with critical missing fields.');
        }
    } catch (error) {
        console.error('Error fetching products:', error.message);
    }
}

diagnoseProducts();
