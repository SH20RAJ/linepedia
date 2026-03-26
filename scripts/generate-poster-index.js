import fs from 'fs';
import path from 'path';

const POSTERS_DIR = './linespedia-data/posters/v1';
const OUTPUT_METADATA_DIR = './linespedia-data/metadata/v1';

if (!fs.existsSync(OUTPUT_METADATA_DIR)) fs.mkdirSync(OUTPUT_METADATA_DIR, { recursive: true });

async function generatePosterIndex() {
    console.log('🖼️ Generating Poster Index...');
    
    if (!fs.existsSync(POSTERS_DIR)) {
        console.log('Posters directory not found. Saving empty array.');
        fs.writeFileSync(path.join(OUTPUT_METADATA_DIR, 'poster-index.json'), JSON.stringify([]));
        return;
    }

    const files = fs.readdirSync(POSTERS_DIR).filter(f => f.endsWith('.png'));
    const slugs = files.map(f => f.replace('.png', ''));
    
    console.log(`Found ${slugs.length} posters.`);
    
    fs.writeFileSync(path.join(OUTPUT_METADATA_DIR, 'poster-index.json'), JSON.stringify(slugs));
    
    // Also copy to src/data for local bundling (fast check)
    if (!fs.existsSync('./src/data')) fs.mkdirSync('./src/data', { recursive: true });
    fs.writeFileSync('./src/data/poster-index.json', JSON.stringify(slugs));

    console.log('DONE!');
}

generatePosterIndex();
