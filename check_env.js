const https = require('https');

https.get('https://orchidhub.in/auth/login', (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
        const scriptUrls = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(m => m[1]);
        
        let found = false;
        let processed = 0;
        
        if (scriptUrls.length === 0) {
            console.log("No scripts found");
            return;
        }

        scriptUrls.forEach(url => {
            const fullUrl = 'https://orchidhub.in' + url;
            https.get(fullUrl, (jsRes) => {
                let jsData = '';
                jsRes.on('data', chunk => jsData += chunk);
                jsRes.on('end', () => {
                    processed++;
                    // Look for AIzaSy or any api key like string in the vicinity of "apiKey"
                    if (jsData.includes('apiKey:')) {
                        const match = jsData.match(/apiKey:([^,}]+)/);
                        console.log(`Found apiKey in ${url}:`, match ? match[1] : 'No value matched');
                        found = true;
                    }
                    if (processed === scriptUrls.length && !found) {
                        console.log("Finished checking all scripts, no apiKey found.");
                    }
                });
            });
        });
    });
});
