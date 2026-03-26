import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';

const DATA_DIR = './linespedia-data/raw';
const LEGACY_PATH = './src/content/poems.json';
const OUTPUT_POEMS_DIR = './linespedia-data/poems/v1';
const OUTPUT_METADATA_DIR = './linespedia-data/metadata/v1';

if (!fs.existsSync(OUTPUT_POEMS_DIR)) fs.mkdirSync(OUTPUT_POEMS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_METADATA_DIR)) fs.mkdirSync(OUTPUT_METADATA_DIR, { recursive: true });

function slugify(text) {
    if (!text) return 'unknown';
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
    const categories = poem.category || ['classic poetry'];
    const category = categories[0];
    
    // Pick a template based on the poem hash to keep it stable
    const hash = generateId(`${author}-${title}`);
    const templates = [
        `This evocative piece by ${author}, titled "${title}", represents a masterful exploration of ${category}. The lines capture a profound emotional resonance...`,
        `"${title}" is a quintessential example of ${author}'s signature style...`,
        `Exploring the themes of ${category}, ${author} delivers a powerful performance in "${title}"...`,
        `${author}'s contribution to ${category} is further solidified by the brilliance found in "${title}"...`
    ];

    const templateIndex = parseInt(hash.slice(0, 1), 16) % templates.length;
    const baseMeaning = templates[templateIndex] || templates[0];

    return `${baseMeaning}\n\n### Why We Love This Line\nAt Linespedia, we believe that poetry is the ultimate sanctuary for the soul...`;
}

async function ingest() {
    console.log('🚀 Starting CDN Ingestion (Individual Files)...');
    
    const slugMap = {}; // mapping of slug -> id
    const writerIndex = {}; // writer slug -> array of poem identifiers
    const categoryIndex = {}; // category slug -> array of poem identifiers
    const seen = new Set();
    const seenTitles = new Set();
    const results = [];

    function indexPoem(poem) {
        const writerSlug = slugify(poem.writer);
        if (!writerIndex[writerSlug]) writerIndex[writerSlug] = [];
        writerIndex[writerSlug].push({ id: poem.id, slug: poem.slug, title: poem.title });

        if (poem.category) {
            poem.category.forEach(cat => {
                const catSlug = slugify(cat);
                if (!categoryIndex[catSlug]) categoryIndex[catSlug] = [];
                categoryIndex[catSlug].push({ id: poem.id, slug: poem.slug, title: poem.title });
            });
        }
    }

    // 1. Load Legacy Poems
    if (fs.existsSync(LEGACY_PATH)) {
        console.log('Processing Legacy Poems...');
        const legacyPoems = JSON.parse(fs.readFileSync(LEGACY_PATH, 'utf-8'));
        for (const poem of legacyPoems) {
            const titleKey = slugify(`${poem.writer}-${poem.title}`);
            seenTitles.add(titleKey);
            seen.add(poem.id);
            slugMap[poem.slug] = poem.id;
            
            indexPoem(poem);
            fs.writeFileSync(path.join(OUTPUT_POEMS_DIR, `${poem.id}.json`), JSON.stringify(poem));
        }
    }

    // 2. Ingest Kaggle CSV
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

            const slug = `${slugify(title)}-${hash}`;
            const poem = {
                id: hash,
                slug: slug,
                title: title,
                content: content,
                writer: author,
                category: ['classic'],
                meaning: getEnrichedMeaning({ writer: author, title: title, category: ['classic'] }),
                meta: {
                    views: parseInt(record['Views']) || 0,
                    dates: record['Birth and Death Dates'] || null
                }
            };

            slugMap[slug] = hash;
            indexPoem(poem);
            fs.writeFileSync(path.join(OUTPUT_POEMS_DIR, `${hash}.json`), JSON.stringify(poem));
            results.push(poem);
        }
    }

    // 3. Ingest HuggingFace JSON
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

            const slug = `${slugify(title)}-${hash}`;
            const poem = {
                id: hash,
                slug: slug,
                title: title,
                content: content,
                writer: author,
                category: ['classical-poetry'],
                meaning: getEnrichedMeaning({ writer: author, title: title, category: ['classical-poetry'] }),
                meta: {
                    source: 'public-domain-poetry'
                }
            };

            slugMap[slug] = hash;
            indexPoem(poem);
            fs.writeFileSync(path.join(OUTPUT_POEMS_DIR, `${hash}.json`), JSON.stringify(poem));
            results.push(poem);
        }
    }

    console.log(`✅ Total unique poems saved to individual files: ${Object.keys(slugMap).length}`);

    // 4. Save Metadata
    fs.writeFileSync(path.join(OUTPUT_METADATA_DIR, 'slug-map.json'), JSON.stringify(slugMap));
    fs.writeFileSync(path.join(OUTPUT_METADATA_DIR, 'writer-poems.json'), JSON.stringify(writerIndex));
    fs.writeFileSync(path.join(OUTPUT_METADATA_DIR, 'category-poems.json'), JSON.stringify(categoryIndex));
    
    // Create a featured index
    const featuredPoems = results.slice(0, 100);
    fs.writeFileSync(path.join(OUTPUT_METADATA_DIR, 'featured-poems.json'), JSON.stringify(featuredPoems));

    // 5. Generate Sitemap
    const SITEMAP_FILE = './linespedia-data/metadata/v1/sitemap-poems.xml';
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const slug of Object.keys(slugMap)) {
        sitemap += `  <url>\n    <loc>https://linespedia.com/p/${slug}/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <priority>0.6</priority>\n  </url>\n`;
    }
    sitemap += '</urlset>';
    fs.writeFileSync(SITEMAP_FILE, sitemap);

    console.log('DONE!');
}

ingest();
