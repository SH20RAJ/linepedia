import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const DATA_REPO = './linespedia-data';
const POEMS_FILE = path.join(DATA_REPO, 'raw/poems.json'); // Smaller sample or raw
const POSTERS_DIR = path.join(DATA_REPO, 'posters/v1');

if (!fs.existsSync(POSTERS_DIR)) fs.mkdirSync(POSTERS_DIR, { recursive: true });

function wrapText(text, maxChars) {
    const lines = [];
    const paragraphs = text.split('\n');
    for (const p of paragraphs) {
        const words = p.split(' ');
        let line = '';
        for (const w of words) {
            if ((line + w).length > maxChars) {
                lines.push(line.trim());
                line = w + ' ';
            } else {
                line += w + ' ';
            }
        }
        lines.push(line.trim());
    }
    return lines;
}

async function generatePoster(poem) {
    const { slug, content, writer } = poem;
    if (!content || !slug) return;

    const width = 1080;
    const height = 1080;
    const wrappedContent = wrapText(content, 35).slice(0, 10);
    const writerName = writer ? writer.replace(/-/g, ' ') : 'Anonymous';

    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#fdfcf7" />
        <defs>
            <radialGradient id="grad" cx="50%" cy="50%" r="70%" fx="80%" fy="20%">
                <stop offset="0%" style="stop-color:rgb(99,102,241);stop-opacity:0.1" />
                <stop offset="100%" style="stop-color:rgb(236,72,153);stop-opacity:0.05" />
            </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        
        <!-- Quote Mark Backdrop -->
        <text x="100" y="250" font-family="serif" font-size="300" fill="#263759" opacity="0.03">"</text>

        <text x="50%" y="45%" font-family="serif" font-size="52" font-style="italic" fill="#263759" text-anchor="middle" dominant-baseline="middle">
            ${wrappedContent.map((line, i) => `<tspan x="50%" dy="${i === 0 ? 0 : '1.4em'}">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</tspan>`).join('')}
        </text>

        <line x1="480" y1="850" x2="600" y2="850" stroke="#263759" stroke-width="2" opacity="0.2" />

        <text x="50%" y="900" font-family="sans-serif" font-size="28" font-weight="bold" fill="#263759" text-anchor="middle" opacity="0.6">
            — ${writerName.replace(/&/g, '&amp;')}
        </text>
        
        <text x="50%" y="980" font-family="sans-serif" font-size="20" font-weight="bold" fill="#facc15" text-anchor="middle" letter-spacing="4">
            LINESPEDIA
        </text>
    </svg>
    `;

    try {
        await sharp(Buffer.from(svg))
            .png()
            .toFile(path.join(POSTERS_DIR, `${slug}.png`));
        console.log(`✅ Generated: ${slug}`);
    } catch (e) {
        console.error(`❌ Failed: ${slug}`, e.message);
    }
}

async function main() {
    console.log('🎨 Starting Poster Generation...');
    
    // Use slug-map to get poems
    const slugMap = JSON.parse(fs.readFileSync(path.join(DATA_REPO, 'metadata/v1/slug-map.json'), 'utf-8'));
    const slugs = Object.keys(slugMap).slice(0, 50); // Just top 50 for now
    
    for (const slug of slugs) {
        const id = slugMap[slug];
        const poemData = JSON.parse(fs.readFileSync(path.join(DATA_REPO, `poems/v1/${id}.json`), 'utf-8'));
        await generatePoster({ slug, ...poemData });
    }
    
    console.log('🎬 Batch Completed.');
}

main().catch(console.error);
