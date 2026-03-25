import fs from 'fs';
import path from 'path';

const HOST = 'https://linespedia.com';
const KEY = '2f3a29d127b84110a911375a73d97702';
const KV_BATCH_FILE = './src/data/poems-kv-batch.json';

async function submit() {
    console.log('🔍 Preparing IndexNow submission for 37,000+ URLs...');
    
    if (!fs.existsSync(KV_BATCH_FILE)) {
        console.error('Error: KV batch file not found. Run ingest-data.js first.');
        return;
    }

    const kvBulk = JSON.parse(fs.readFileSync(KV_BATCH_FILE, 'utf-8'));
    const urlList = [];

    // Base pages
    urlList.push(`${HOST}/`);
    urlList.push(`${HOST}/explore`);
    urlList.push(`${HOST}/blog`);
    urlList.push(`${HOST}/likes`);
    urlList.push(`${HOST}/writers`);
    urlList.push(`${HOST}/categories`);
    urlList.push(`${HOST}/collections`);

    // Poem pages (from slugs)
    for (const item of kvBulk) {
        if (item.key.startsWith('slug:')) {
            const slug = item.key.replace('slug:', '');
            urlList.push(`${HOST}/line/${slug}`);
        }
    }

    console.log(`🚀 Submitting ${urlList.length} URLs to IndexNow...`);

    // Split into batches of 10,000 per request (Bings limit is relatively high)
    const batchSize = 10000;
    for (let i = 0; i < urlList.length; i += batchSize) {
        const batch = urlList.slice(i, i + batchSize);
        
        try {
            const response = await fetch('https://www.bing.com/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host: 'linespedia.com',
                    key: KEY,
                    keyLocation: `${HOST}/${KEY}.txt`,
                    urlList: batch
                })
            });

            console.log(`Batch ${Math.floor(i / batchSize) + 1}: Status ${response.status}`);
        } catch (error) {
            console.error(`Error submitting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        }
    }

    console.log('DONE!');
}

submit();
