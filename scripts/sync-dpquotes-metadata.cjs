const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DATA_DIR = '/Users/shaswatraj/Desktop/earn/linepedia/linespedia-data/blogs/dpquotes';
const META_FILE = '/Users/shaswatraj/Desktop/earn/linepedia/linespedia-data/blogs/dpquotes-meta.json';

function getExcerpt(markdown) {
    if (!markdown) return '';
    // Skip frontmatter
    const parts = markdown.split('---');
    const content = parts.length > 2 ? parts.slice(2).join('---') : markdown;
    return content.trim().slice(0, 160).replace(/[#\*\[\]]/g, '').replace(/\n/g, ' ') + '...';
}

function sync() {
    console.log('Synchronizing DPQuotes metadata...');
    if (!fs.existsSync(DATA_DIR)) {
        console.error('Data directory not found');
        return;
    }

    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.md'));
    const meta = files.map(file => {
        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Simple frontmatter parser
        const titleMatch = content.match(/title: "(.*?)"/);
        const dateMatch = content.match(/date: (.*?)\n/);
        const imageMatch = content.match(/image: (.*?)\n/);
        const categoriesMatch = content.match(/categories: \[(.*?)\]/);
        const urlMatch = content.match(/url: "(.*?)"/);

        return {
            slug: file.replace('.md', ''),
            title: titleMatch ? titleMatch[1] : 'Untitled',
            date: dateMatch ? dateMatch[1] : new Date().toISOString(),
            image: imageMatch ? imageMatch[1] : '',
            categories: categoriesMatch ? categoriesMatch[1].split(',').map(c => c.replace(/"/g, '').trim()) : [],
            url: urlMatch ? urlMatch[1] : '',
            excerpt: getExcerpt(content)
        };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
    console.log(`Successfully indexed ${meta.length} articles to ${META_FILE}`);
}

sync();
