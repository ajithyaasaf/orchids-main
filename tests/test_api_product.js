
import axios from 'axios';

async function testProduct() {
  const slug = 'v-neck-jubba-bundle-exclusive-collection-20-pieces';
  try {
    const response = await axios.get(`http://localhost:5001/orchids-5832a/us-central1/api/wholesale-products/slug/${slug}`);
    console.log('Product Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testProduct();
