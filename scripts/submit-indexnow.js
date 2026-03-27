const INDEXNOW_KEY = '2f3a29d127b84110a911375a73d97702';
const HOST = 'linespedia.com';
const SITEMAP_URLS = [
    'https://linespedia.com/sitemap-seo.xml',
    'https://linespedia.com/sitemap-stories.xml',
    'https://linespedia.com/sitemap-allpoetry.xml',
    'https://linespedia.com/sitemap-index.xml'
];

async function submitToIndexNow() {
    console.log('🚀 Starting IndexNow submission...');
    
    const urls = new Set();
    const urlRegex = /<loc>(https:\/\/linespedia.com\/[^<]+)<\/loc>/g;

    for (const sitemapUrl of SITEMAP_URLS) {
        try {
            console.log(`Processing sitemap: ${sitemapUrl}`);
            const res = await fetch(sitemapUrl, {
                // @ts-ignore - Bun/Node specific TLS bypass for local/intermediate cert issues
                tls: { rejectUnauthorized: false },
                // Node specific
                agent: new (await import('https')).Agent({ rejectUnauthorized: false })
            });
            if (!res.ok) {
                console.warn(`Failed to fetch sitemap: ${sitemapUrl} (${res.status})`);
                continue;
            }
            const sitemapContent = await res.text();
            let match;
            while ((match = urlRegex.exec(sitemapContent)) !== null) {
                urls.add(match[1]);
            }
        } catch (e) {
            console.error(`Error processing ${sitemapUrl}:`, e.message);
        }
    }

    // Add main pages
    urls.add(`https://${HOST}/`);
    urls.add(`https://${HOST}/explore/`);
    urls.add(`https://${HOST}/writers/`);
    urls.add(`https://${HOST}/categories/`);
    urls.add(`https://${HOST}/collections/`);

    const urlList = Array.from(urls);
    console.log(`Found ${urlList.length} total URLs to submit.`);

    if (urlList.length === 0) {
        console.error('No URLs found to submit!');
        return;
    }

    const BATCH_SIZE = 9000;
    for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
        const batch = urlList.slice(i, i + BATCH_SIZE);
        console.log(`Submitting batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} URLs)...`);

        const body = {
            host: HOST,
            key: INDEXNOW_KEY,
            keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
            urlList: batch
        };

        try {
            const response = await fetch('https://api.indexnow.org/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} submitted successfully (Status: ${response.status})`);
            } else {
                console.error(`❌ Error submitting batch ${Math.floor(i / BATCH_SIZE) + 1}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Fetch error for batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        }
    }

    console.log('🎉 IndexNow submission complete!');
    return urlList.length;
}

// Allow importing or direct execution
if (process.argv[1]?.endsWith('submit-indexnow.js')) {
    submitToIndexNow();
}

export { submitToIndexNow };
