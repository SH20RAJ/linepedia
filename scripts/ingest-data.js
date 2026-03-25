import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

const DATA_DIR = './src/data';
const LEGACY_PATH = '/tmp/poems-legacy.json';
const POEMS_DIR = './src/content/poems';
const KV_BATCH_FILE = './src/data/poems-kv-batch.json';

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

function generateId(text) {
    return crypto.createHash('md5').update(text).digest('hex').slice(0, 12);
}

async function ingest() {
    console.log('🚀 Starting deep ingestion with KV split...');
    
    const legacyMap = new Map();
    const results = [];
    const seen = new Set();
    const seenTitles = new Set();

    // 0. Load Legacy Poems (Pinned for SEO/Continuity)
    if (fs.existsSync(LEGACY_PATH)) {
        console.log('Loading 311 Legacy Poems...');
        const legacyPoems = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf-8'));
        for (const poem of legacyPoems) {
            const titleKey = slugify(`${poem.writer}-${poem.title}`);
            seenTitles.add(titleKey);
            seen.add(poem.id);
            legacyMap.set(poem.id, poem);
        }
    }

    // 1. Ingest Kaggle CSV (130MB)
    const csvPath = path.join(DATA_DIR, 'poem-data.csv');
    if (fs.existsSync(csvPath)) {
        console.log('Reading Kaggle CSV...');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const records = parse(csvContent, { columns: true, skip_empty_lines: true });
        
        for (const record of records) {
            const content = record['Poem Text'] || record['Lines'];
            if (!content) continue;
            
            const title = record['Title'] || 'Untitled';
            const author = record['Author'] || 'Unknown';
            const titleKey = slugify(`${author}-${title}`);
            
            if (seenTitles.has(titleKey)) continue;
            seenTitles.add(titleKey);

            const hash = generateId(`${author}-${title}-${content.slice(0, 50)}`);
            if (seen.has(hash)) continue;
            seen.add(hash);

            results.push({
                id: hash,
                slug: `${slugify(title)}-${hash}`,
                title: title,
                content: content,
                writer: author,
                category: ['classic'],
                meaning: record['About'] || `A classic poem by ${author}.`,
                meta: {
                    views: parseInt(record['Views']) || 0,
                    dates: record['Birth and Death Dates'] || null
                }
            });
        }
    }

    // 2. Ingest HuggingFace JSON (90MB)
    const jsonPath = path.join(DATA_DIR, 'poems.json');
    if (fs.existsSync(jsonPath)) {
        console.log('Reading HuggingFace JSON...');
        const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
        const records = JSON.parse(jsonContent);
        
        for (const record of records) {
            const content = record['text'];
            if (!content) continue;
            
            const title = record['Title'] || 'Untitled';
            const author = record['Author'] || 'Unknown';
            const titleKey = slugify(`${author}-${title}`);
            
            if (seenTitles.has(titleKey)) continue;
            seenTitles.add(titleKey);

            const hash = generateId(`${author}-${title}-${content.slice(0, 50)}`);
            if (seen.has(hash)) continue;
            seen.add(hash);

            results.push({
                id: hash,
                slug: `${slugify(title)}-${hash}`,
                title: title,
                content: content,
                writer: author,
                category: ['classical-poetry'],
                meaning: `An insightful piece by ${author}.`,
                meta: {
                    source: 'public-domain-poetry'
                }
            });
        }
    }

    console.log(`✅ Total unique new poems: ${results.length}`);
    
    // Sort by popularity
    results.sort((a, b) => (b.meta?.views || 0) - (a.meta?.views || 0));

    // CLEAN EXPORT
    if (fs.existsSync(POEMS_DIR)) fs.rmSync(POEMS_DIR, { recursive: true, force: true });
    fs.mkdirSync(POEMS_DIR, { recursive: true });

    // 1. Export Legacy Poems to Content Collection (Pinned)
    console.log(`Exporting ${legacyMap.size} legacy poems to content collection...`);
    for (const [id, poem] of legacyMap) {
        fs.writeFileSync(path.join(POEMS_DIR, `${id}.json`), JSON.stringify(poem, null, 2));
    }

    // 2. Prepare ALL (Legacy + New) for KV storage
    // We will use a separate script to upload to KV, but we generate the file here
    const kvData = [...legacyMap.values(), ...results];
    console.log(`Preparing ${kvData.length} poems for KV...`);
    
    // Cloudflare KV Bulk format: [{ "key": "...", "value": "..." }]
    const kvBulk = kvData.map(p => ({
        key: `poem:${p.id}`,
        value: JSON.stringify(p)
    }));
    
    // Also store by slug for fast lookup
    kvData.forEach(p => {
        kvBulk.push({
            key: `slug:${p.slug}`,
            value: JSON.stringify(p)
        });
    });

    fs.writeFileSync(KV_BATCH_FILE, JSON.stringify(kvBulk));
    console.log(`KV Bulk batch saved to ${KV_BATCH_FILE}`);

    // 3. Export Top 500 new poems to content collection for "Latest" previews
    console.log('Exporting top 500 new poems to content collection for preview...');
    for (const poem of results.slice(0, 500)) {
        fs.writeFileSync(path.join(POEMS_DIR, `${poem.id}.json`), JSON.stringify(poem, null, 2));
    }

    // 4. Generate Sitemap for ALL 75,000+ poems
    console.log('Generating sitemap.xml for all poems...');
    const SITEMAP_FILE = './public/sitemap-poems.xml';
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const poem of kvData) {
        sitemap += `  <url>\n    <loc>https://linespedia.com/line/${poem.slug}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>0.8</priority>\n  </url>\n`;
    }
    sitemap += '</urlset>';
    fs.writeFileSync(SITEMAP_FILE, sitemap);
    console.log(`Sitemap saved to ${SITEMAP_FILE}`);
    
    console.log('DONE!');
}

ingest();
