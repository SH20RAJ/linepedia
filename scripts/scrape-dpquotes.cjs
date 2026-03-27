const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const TARGET_DIR = '/Users/shaswatraj/Desktop/earn/linepedia/linespedia-data/blogs/dpquotes';
const SITEMAP_URL = 'https://dpquotes.com/post-sitemap.xml';

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function scrapeSitemap() {
    console.log('Fetching sitemap...');
    const res = await fetch(SITEMAP_URL);
    const xml = await res.text();
    const dom = new JSDOM(xml, { contentType: 'text/xml' });
    // Only get <loc> that are direct children of <url>, not <image:loc>
    const locs = Array.from(dom.window.document.querySelectorAll('url > loc')).map(el => el.textContent);
    return locs.filter(url => {
        const isImage = /\.(webp|jpg|jpeg|png|gif|svg)$/i.test(url);
        const isRoot = url === 'https://dpquotes.com/';
        return !isImage && !isRoot;
    });
}

async function scrapePost(url) {
    try {
        console.log(`Scraping: ${url}`);
        const res = await fetch(url);
        const html = await res.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const title = doc.querySelector('h1')?.textContent?.trim() || 'Untitled';
        const date = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || 
                     doc.querySelector('.entry-date')?.getAttribute('datetime') || 
                     new Date().toISOString();
        
        const categories = Array.from(doc.querySelectorAll('.cat-links a')).map(a => a.textContent?.trim());
        const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || 
                    doc.querySelector('.post-thumbnail img')?.getAttribute('src');

        const contentElement = doc.querySelector('.entry-content');
        if (!contentElement) {
            console.warn(`No content found for ${url}`);
            return;
        }

        // Clean up content
        const scripts = contentElement.querySelectorAll('script, style, ins, .adsbygoogle');
        scripts.forEach(s => s.remove());

        // Basic HTML to Markdown conversion for quotes and text
        let markdown = contentElement.innerHTML
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '## $1\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<img[^>]*src="(.*?)"[^>]*alt="(.*?)"[^>]*>/gi, '![$2]($1)\n')
            .replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/&nbsp;/g, ' ')
            .replace(/<[^>]+>/g, ''); // Remove remaining tags

        const slug = url.split('/').filter(Boolean).pop();
        const fileName = `${slug}.md`;
        const filePath = path.join(TARGET_DIR, fileName);

        const frontmatter = [
            '---',
            `title: "${title.replace(/"/g, '\\"')}"`,
            `date: ${date}`,
            `image: ${image || ''}`,
            `categories: [${categories.map(c => `"${c}"`).join(', ')}]`,
            `url: "${url}"`,
            '---',
            '',
            markdown
        ].join('\n');

        fs.writeFileSync(filePath, frontmatter);
        console.log(`Saved: ${fileName}`);
    } catch (e) {
        console.error(`Error scraping ${url}: ${e.message}`);
    }
}

async function main() {
    const urls = await scrapeSitemap();
    console.log(`Found ${urls.length} posts.`);

    // Batch processing to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        await Promise.all(batch.map(url => scrapePost(url)));
        console.log(`Processed ${i + batch.length}/${urls.length}`);
        await new Promise(r => setTimeout(r, 1000)); // Rate limit
    }
    console.log('Migration complete!');
}

main();
