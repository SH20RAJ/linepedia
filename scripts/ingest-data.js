import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

const DATA_DIR = './src/data';
const LEGACY_PATH = './src/content/poems.json';
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

function getEnrichedMeaning(poem) {
    const author = poem.writer || 'the poet';
    const title = poem.title || 'this piece';
    const category = poem.category?.[0] || 'classic poetry';
    
    const templates = [
        `This evocative piece by ${author}, titled "${title}", represents a masterful exploration of ${category}. The lines capture a profound emotional resonance, inviting the reader to reflect on the deeper themes of human experience and artistic expression. In the broader context of ${author}'s bibliography, these specific lines stand out for their clarity and poignancy. Whether you are searching for inspiration or a moment of quiet contemplation, this work offers a timeless perspective that transcends its original era.`,
        
        `"${title}" is a quintessential example of ${author}'s signature style, blending technical precision with raw emotional depth. These lines specifically focus on the nuances of ${category}, offering a unique window into the poet's psyche. At Linespedia, we have curated this work because it continues to resonate with modern readers, proving that great poetry remains relevant across centuries. This selection is perfect for those who appreciate the delicate craft of verse and the power of a well-placed word.`,
        
        `Exploring the themes of ${category}, ${author} delivers a powerful performance in "${title}". The imagery used in these lines is both startling and familiar, creating a sensory experience that lingers long after the first reading. As part of our commitment to preserving literary excellence, Linespedia provides this deep context to help you connect more personally with the work. We recommend reflecting on these lines during moments of solitude or sharing them with fellow poetry enthusiasts to spark meaningful dialogue.`,
        
        `${author}'s contribution to ${category} is further solidified by the brilliance found in "${title}". These lines are often cited by critics and scholars for their innovative use of language and their ability to capture complex human emotions in a few brief expressions. Whether you're encountering ${author} for the first time or are a long-time admirer, this piece offers fresh insights into the enduring legacy of classical poetry. It serves as a beautiful reminder of the impact that a few carefully chosen lines can have on the world.`
    ];

    // Pick a template based on the poem hash to keep it stable
    const templateIndex = parseInt(generateId(`${author}-${title}`).slice(0, 1), 16) % templates.length;
    const baseMeaning = templates[templateIndex] || templates[0];

    return `${baseMeaning}

### Why We Love This Line
At Linespedia, we believe that poetry is the ultimate sanctuary for the soul. This specific line by ${author} is a favorite among our editors because of its sheer honesty and the way it masterfully utilizes the conventions of ${category}. It's a perfect candidate for your digital collection, whether as a thoughtful social media caption or a printed poster for your personal space.

### About ${author}
${author} remains one of the most influential figures in the world of ${category}. Their ability to transcend time and culture through verse is what makes them a cornerstone of the literary world. We invite you to explore more of their work right here on Linespedia, where we continue to celebrate the power of words every single day.`;
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
                meaning: getEnrichedMeaning({ writer: author, category: ['classic'] }),
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
                meaning: getEnrichedMeaning({ writer: author, category: ['classical-poetry'] }),
                meta: {
                    source: 'public-domain-poetry'
                }
            });
        }
    }

    console.log(`✅ Total unique new poems: ${results.length}`);
    
    // Sort by popularity
    results.sort((a, b) => (b.meta?.views || 0) - (a.meta?.views || 0));

    // 1. Prepare ALL (Legacy + New) for KV storage
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

    // 2. Generate Sitemap for ALL 75,000+ poems
    // Legacy poems go to /line/, New ones go to /p/
    console.log('Generating sitemap.xml for all poems...');
    const SITEMAP_FILE = './public/sitemap-poems.xml';
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Legacy Sitemap (/line/)
    for (const poem of legacyMap.values()) {
        sitemap += `  <url>\n    <loc>https://linespedia.com/line/${poem.slug}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    // New Enriched Sitemap (/p/)
    for (const poem of results) {
        sitemap += `  <url>\n    <loc>https://linespedia.com/p/${poem.slug}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    sitemap += '</urlset>';
    fs.writeFileSync(SITEMAP_FILE, sitemap);
    console.log(`Sitemap saved to ${SITEMAP_FILE}`);
    
    console.log('DONE!');
}

ingest();
