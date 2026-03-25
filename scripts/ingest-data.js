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
    console.log('🚀 Starting deep ingestion of 220MB dataset...');
    
    const results = [];
    const seen = new Set();

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
    
    // Sort by popularity (Views)
    results.sort((a, b) => (b.meta?.views || 0) - (a.meta?.views || 0));

    // For now, let's export the top 10,000 for the first scaling phase
    const topBatch = results.slice(0, 10000);
    const poemsDir = './src/content/poems';
    
    if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE);
    if (!fs.existsSync(poemsDir)) fs.mkdirSync(poemsDir, { recursive: true });

    console.log(`Exporting 10,000 individual poem files to ${poemsDir}...`);
    
    for (const poem of topBatch) {
        fs.writeFileSync(path.join(poemsDir, `${poem.id}.json`), JSON.stringify(poem, null, 2));
    }
    
    console.log('DONE!');
}

ingest();
