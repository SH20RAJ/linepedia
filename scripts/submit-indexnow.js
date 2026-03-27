import fs from 'fs';
import path from 'path';

const INDEXNOW_KEY = '2f3a29d127b84110a911375a73d97702';
const HOST = 'linespedia.com';
const PROTOCOL = 'https://';
const LANGUAGES = ['en', 'es', 'fr', 'de', 'hi', 'ar', 'zh', 'ja', 'ru', 'pt', 'it'];

async function submitToIndexNow() {
    console.log('🚀 Starting Codebase-Driven IndexNow submission...');
    
    const urls = new Set();
    const addUrl = (path) => {
        const fullPath = path.startsWith('/') ? path : `/${path}`;
        LANGUAGES.forEach(lang => {
            const langParam = lang === 'en' ? '' : `?lang=${lang}`;
            urls.add(`${PROTOCOL}${HOST}${fullPath}${langParam}`);
        });
    };

    try {
        // 1. Static & Core Pages
        ['/', '/explore/', '/writers/', '/categories/', '/collections/', '/ap/1/'].forEach(addUrl);

        // 2. Local Metadata (Writers, Categories, Collections)
        const writers = JSON.parse(fs.readFileSync('src/data/writers.json', 'utf8'));
        writers.forEach(w => addUrl(w.slug));

        const categories = JSON.parse(fs.readFileSync('src/data/categories.json', 'utf8'));
        categories.forEach(c => addUrl(c.slug));

        const collections = JSON.parse(fs.readFileSync('src/data/collections.json', 'utf8'));
        collections.forEach(c => addUrl(c.slug));

        // 3. AllPoetry Metadata Expansion (~200k poems)
        const allPoetryPath = 'linespedia-data/automation/all-poems-metadata.json';
        if (fs.existsSync(allPoetryPath)) {
            console.log('📦 Processing AllPoetry Metadata...');
            const allPoetry = JSON.parse(fs.readFileSync(allPoetryPath, 'utf8'));
            const uniquePoets = new Set();

            allPoetry.forEach(poem => {
                // Poet Page
                if (poem.writerSlug) {
                    uniquePoets.add(poem.writerSlug);
                }
                // Poem Page
                if (poem.writerSlug && poem.slug) {
                    addUrl(`line/ap/${poem.writerSlug}/${poem.slug}`);
                }
            });

            // Add all unique AllPoetry poets
            uniquePoets.forEach(slug => addUrl(`poet/${slug}`));
            console.log(`✅ AllPoetry processing complete. Poets: ${uniquePoets.size}, Poems: ${allPoetry.length}`);
        }

    } catch (e) {
        console.error('❌ Error harvesting URLs from codebase:', e.message);
    }

    const urlList = Array.from(urls);
    console.log(`📊 Total localized URLs harvested: ${urlList.length}`);

    if (urlList.length === 0) {
        console.error('No URLs found to submit!');
        return;
    }

    // IndexNow Batch Submission
    const BATCH_SIZE = 9000;
    for (let i = 0; i < urlList.length; i += BATCH_SIZE) {
        const batch = urlList.slice(i, i + BATCH_SIZE);
        console.log(`📤 Submitting batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(urlList.length / BATCH_SIZE)} (${batch.length} URLs)...`);

        const body = {
            host: HOST,
            key: INDEXNOW_KEY,
            keyLocation: `${PROTOCOL}${HOST}/${INDEXNOW_KEY}.txt`,
            urlList: batch
        };

        try {
            const response = await fetch('https://api.indexnow.org/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} success (${response.status})`);
            } else {
                console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${response.status}`);
                // Break or continue? Continue for now as per "run it once" to get as much as possible out
            }
        } catch (error) {
            console.error(`Fetch error for batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        }
    }

    console.log('🎉 IndexNow submission complete!');
    return urlList.length;
}

// Direct execution
if (process.argv[1]?.includes('submit-indexnow.js')) {
    submitToIndexNow();
}

export { submitToIndexNow };
