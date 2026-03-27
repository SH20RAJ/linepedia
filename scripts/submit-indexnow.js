import fs from 'fs';
import path from 'path';

const INDEXNOW_KEY = '2f3a29d127b84110a911375a73d97702';
const HOST = 'linespedia.com';
const SITEMAP_FILES = [
    './public/sitemap-poems.xml',
    './public/sitemap.xml',
    './public/sitemapseo.xml'
];

async function submitToIndexNow() {
    console.log('🚀 Starting IndexNow submission...');
    
    const existingSitemaps = SITEMAP_FILES.filter((file) => fs.existsSync(file));
    if (existingSitemaps.length === 0) {
        console.error('No sitemap files found!');
        return;
    }

    const urls = new Set();
    const urlRegex = /<loc>(https:\/\/linespedia.com\/[^<]+)<\/loc>/g;

    for (const sitemapFile of existingSitemaps) {
        const sitemapContent = fs.readFileSync(sitemapFile, 'utf-8');
        let match;
        while ((match = urlRegex.exec(sitemapContent)) !== null) {
            urls.add(match[1]);
        }
    }

    // Add main pages
    urls.add(`https://${HOST}/`);
    urls.add(`https://${HOST}/explore/`);
    urls.add(`https://${HOST}/writers/`);
    urls.add(`https://${HOST}/categories/`);
    urls.add(`https://${HOST}/collections/`);

    const urlList = Array.from(urls);
    console.log(`Found ${urlList.length} URLs to submit.`);

    const BATCH_SIZE = 9000; // IndexNow limit is typically around 10k
    for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
        const batch = urlList.slice(i, i + BATCH_SIZE);
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
