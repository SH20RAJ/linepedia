import fs from 'fs';
import path from 'path';

const POEMS_DIR = './linespedia-data/poems/v1';
const OUTPUT_METADATA_DIR = './linespedia-data/metadata/v1';
const WRITERS_DIR = path.join(OUTPUT_METADATA_DIR, 'writers');
const CATEGORIES_DIR = path.join(OUTPUT_METADATA_DIR, 'categories');

if (!fs.existsSync(OUTPUT_METADATA_DIR)) fs.mkdirSync(OUTPUT_METADATA_DIR, { recursive: true });
if (!fs.existsSync(WRITERS_DIR)) fs.mkdirSync(WRITERS_DIR, { recursive: true });
if (!fs.existsSync(CATEGORIES_DIR)) fs.mkdirSync(CATEGORIES_DIR, { recursive: true });

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

async function generateIndices() {
    console.log('🚀 Regenerating Segmented Indices from Poem Files...');
    
    const slugMap = {}; 
    const writerIndex = {}; 
    const categoryIndex = {}; 
    const featuredPoems = [];
    
    const files = fs.readdirSync(POEMS_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} poem files.`);

    let count = 0;
    for (const file of files) {
        const filePath = path.join(POEMS_DIR, file);
        try {
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const { id, slug, title, writer, category } = content;
            
            if (!id || !slug) continue;

            slugMap[slug] = id;
            
            const poemSnippet = { 
                id, 
                slug, 
                title, 
                writer,
                content: content.content.slice(0, 150)
            };

            const writerSlug = slugify(writer);
            if (!writerIndex[writerSlug]) writerIndex[writerSlug] = [];
            writerIndex[writerSlug].push(poemSnippet);

            if (category) {
                const categories = Array.isArray(category) ? category : [category];
                categories.forEach(cat => {
                    const catSlug = slugify(cat);
                    if (!categoryIndex[catSlug]) categoryIndex[catSlug] = [];
                    categoryIndex[catSlug].push(poemSnippet);
                });
            }

            if (count < 150) {
                featuredPoems.push(poemSnippet);
            }
            
            count++;
            if (count % 5000 === 0) console.log(`Processed ${count} files...`);
        } catch (e) {
            console.error(`Error processing ${file}:`, e);
        }
    }

    console.log('Saving segmented metadata files...');
    
    // 1. Slug Map (still monolithic but 2MB is okay for server-side lookup if needed, or we fetch it)
    fs.writeFileSync(path.join(OUTPUT_METADATA_DIR, 'slug-map.json'), JSON.stringify(slugMap));
    
    // 2. Individual Writer Files
    for (const [slug, poems] of Object.entries(writerIndex)) {
        fs.writeFileSync(path.join(WRITERS_DIR, `${slug}.json`), JSON.stringify(poems));
    }
    
    // 3. Individual Category Files
    for (const [slug, poems] of Object.entries(categoryIndex)) {
        fs.writeFileSync(path.join(CATEGORIES_DIR, `${slug}.json`), JSON.stringify(poems));
    }
    
    // 4. Featured Poems
    fs.writeFileSync(path.join(OUTPUT_METADATA_DIR, 'featured-poems.json'), JSON.stringify(featuredPoems));

    console.log(`Saved ${Object.keys(writerIndex).length} writer files and ${Object.keys(categoryIndex).length} category files.`);
    console.log('DONE!');
}

generateIndices();
