const https = require('https');
https.get('https://orchidhub.in/products?category=girls', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Cloudinary matches:", data.match(/res\.cloudinary\.com[^"']+/g)?.slice(0, 5));
    console.log("Firebase matches:", data.match(/firebasestorage\.googleapis\.com[^"']+/g)?.slice(0, 5));
  });
});
