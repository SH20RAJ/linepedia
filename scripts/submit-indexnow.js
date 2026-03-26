import fs from 'fs';
import path from 'path';

const INDEXNOW_KEY = '2f3a29d127b84110a911375a73d97702';
const HOST = 'linespedia.com';
const SITEMAP_FILE = './public/sitemap-poems.xml';

async function submitToIndexNow() {
    console.log('🚀 Starting IndexNow submission...');
    
    if (!fs.existsSync(SITEMAP_FILE)) {
        console.error('Sitemap not found!');
        return;
    }

    const sitemapContent = fs.readFileSync(SITEMAP_FILE, 'utf-8');
    const urls = [];
    const urlRegex = /<loc>(https:\/\/linespedia.com\/[^<]+)<\/loc>/g;
    let match;
    while ((match = urlRegex.exec(sitemapContent)) !== null) {
        urls.push(match[1]);
    }

    // Add main pages
    urls.push(`https://${HOST}/`);
    urls.push(`https://${HOST}/explore/`);
    urls.push(`https://${HOST}/writers/`);
    urls.push(`https://${HOST}/categories/`);
    urls.push(`https://${HOST}/collections/`);

    console.log(`Found ${urls.length} URLs to submit.`);

    const BATCH_SIZE = 9000; // IndexNow limit is typically around 10k
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        console.log(`Submitting batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

        const body = {
            host: HOST,
            key: INDEXNOW_KEY,
            keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
            urlList: batch
        };

        try {
            // Using fetch (available in Node 18+)
            const response = await fetch('https://api.indexnow.org/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} submitted successfully (Status: ${response.status})`);
            } else {
                console.error(`Error submitting batch ${Math.floor(i / BATCH_SIZE) + 1}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Fetch error for batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        }
    }

    console.log('✅ IndexNow submission complete!');
}

submitToIndexNow();
