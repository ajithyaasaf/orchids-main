
import { collections } from '../config/firebase';
import { WholesaleProduct } from '@orchids/shared';

const inspectProduct = async () => {
    const id = 'Zn2LQKYU7oYtpod7k5qP';
    const doc = await collections.wholesaleProducts.doc(id).get();
    if (!doc.exists) {
        console.log('Product not found');
        return;
    }
    const product = doc.data();
    console.log('Product Data:', JSON.stringify(product, null, 2));
};

inspectProduct().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
