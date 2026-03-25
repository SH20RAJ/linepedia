import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

const DATA_DIR = './src/data';
const OUTPUT_FILE = './src/content/poems-dataset.json';

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
    console.log('🚀 Starting deep ingestion with legacy restoration...');
    
    const results = [];
    const seen = new Set();
    const seenTitles = new Set();

    // 0. Load Legacy Poems (Fix 404s)
    const legacyPath = '/tmp/poems-legacy.json';
    if (fs.existsSync(legacyPath)) {
        console.log('Restoring 311 Legacy Poems...');
        const legacyPoems = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
        for (const poem of legacyPoems) {
            const titleKey = slugify(`${poem.writer}-${poem.title}`);
            if (seenTitles.has(titleKey)) continue;
            
            seenTitles.add(titleKey);
            seen.add(poem.id);
            results.push(poem); // Keep original id/slug
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

    console.log(`✅ Total unique poems processed: ${results.length}`);
    
    // Sort by popularity (Views) - keep legacy at the top or sorted naturally
    results.sort((a, b) => (b.meta?.views || 0) - (a.meta?.views || 0));

    // Export individual poem files
    const poemsDir = './src/content/poems';
    
    // Safety check: ensure 102.json from legacy is present
    const legacyCheck = results.find(p => p.id === '102');
    if (legacyCheck) {
        console.log('Verified: Legacy poem 102 (An Exile\'s Farewell) is available.');
    }

    if (!fs.existsSync(poemsDir)) fs.mkdirSync(poemsDir, { recursive: true });

    console.log(`Exporting poems to ${poemsDir}...`);
    
    // 1. Export ALL legacy poems first (guarantees they exist)
    const legacyPoems = results.filter(p => !p.id.includes('-') && p.id.length < 10); // Simple check for legacy numeric IDs
    // Actually, I have the list from /tmp/poems-legacy.json
    const legacyIds = new Set(JSON.parse(fs.readFileSync('/tmp/poems-legacy.json', 'utf-8')).map(p => p.id));
    
    let exportedCount = 0;
    for (const poem of results) {
        if (legacyIds.has(poem.id)) {
            fs.writeFileSync(path.join(poemsDir, `${poem.id}.json`), JSON.stringify(poem, null, 2));
            exportedCount++;
        }
    }
    console.log(`Restored ${exportedCount} legacy poems.`);

    // 2. Export top remaining up to 10,000 total (to avoid overwhelming Astro in dev)
    const topRemaining = results.filter(p => !legacyIds.has(p.id)).slice(0, 10000 - exportedCount);
    
    for (const poem of topRemaining) {
        fs.writeFileSync(path.join(poemsDir, `${poem.id}.json`), JSON.stringify(poem, null, 2));
        exportedCount++;
    }
    
    console.log(`Total poems exported: ${exportedCount}`);
    console.log('DONE!');
}

ingest();
