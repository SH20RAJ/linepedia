import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const SITEMAP_URL = 'https://www.talesofpanchatantra.com/sitemap.xml';
const BASE_URL = 'https://www.talesofpanchatantra.com';
const OUTPUT_FILE = './linespedia-data/panchtantra/v1/index.json';
const IMAGE_DIR = './linespedia-data/panchtantra/v1/images';

if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

async function downloadImage(url, filename) {
    if (!url) return null;
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(path.join(IMAGE_DIR, filename), Buffer.from(buffer));
        return true; // We'll reconstruct the URL in the frontend lib
    } catch (e) {
        console.error(`Failed to download image ${url}:`, e);
        return null;
    }
}

async function scrapeStory(url) {
    console.log(`Scraping: ${url}`);
    try {
        const res = await fetch(url);
        const htmlContent = await res.text();
        const dom = new JSDOM(htmlContent);
        const doc = dom.window.document;

        const title = doc.querySelector('h1.textAbnormalXLarge')?.textContent?.trim() || '';
        const contentDiv = doc.querySelector('#dvAllLft.textNormal.textFormat');
        
        if (!contentDiv) {
            console.log(`Fallback for ${url}`);
            // Fallback for different container
            const fallback = doc.querySelector('div.pagecenter.textBelowNormal.textFormat');
            if (!fallback) return null;
            contentDiv = fallback;
        }

        // Clean content: remove breadcrumbs and common ads/social
        contentDiv.querySelectorAll('div, script, ins, .textBelowNormal').forEach(el => el.remove());
        
        // Better HTML cleaning
        let html = contentDiv.innerHTML
            .replace(/Home\s*»\s*Complete Works\s*»\s*Stories\s*/gi, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
        
        // Extract Image (looking for illustrated frames)
        const imgTag = contentDiv.querySelector('img.picDisplay') || contentDiv.querySelector('img');
        let imgUrl = imgTag ? imgTag.getAttribute('src') : null;
        if (imgUrl && !imgUrl.startsWith('http')) {
            imgUrl = imgUrl.startsWith('/') ? `${BASE_URL}${imgUrl}` : `${BASE_URL}/${imgUrl}`;
        }
        
        // Extract plain text for search indices
        const text = contentDiv.textContent.replace(/\s+/g, ' ').trim();
        const hasImage = imgUrl ? await downloadImage(imgUrl, `${path.basename(url)}.png`) : false;

        // Extract Moral
        const moralMatch = text.match(/"([^"]+)"/);
        const moral = moralMatch ? moralMatch[1] : null;

        return {
            title,
            slug: path.basename(url),
            content: text,
            html,
            image: hasImage ? true : null,
            moral,
            url
        };
    } catch (e) {
        console.error(`Error scraping ${url}:`, e);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting Scraper (Target: linespedia-data)...');
    
    const res = await fetch(SITEMAP_URL);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>(https:\/\/www\.talesofpanchatantra\.com\/[^<]+)<\/loc>/g)].map(m => m[1]);
    
    const storyUrls = locs.filter(url => {
        const parts = url.replace(BASE_URL, '').split('/').filter(Boolean);
        return parts.length === 1 && !['short-stories-for-kids', 'about-us', 'contact-us', 'privacy-policy', 'terms-and-conditions', 'sanskrit-manuscripts', 'background-and-summary', 'category'].includes(parts[0]);
    });

    console.log(`Found ${storyUrls.length} potential stories.`);

    const stories = [];
    for (let i = 0; i < storyUrls.length; i++) {
        const story = await scrapeStory(storyUrls[i]);
        if (story) stories.push(story);
        if (i % 5 === 0) fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stories, null, 2));
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stories, null, 2));
    console.log(`✅ Completed! Saved ${stories.length} stories.`);
}

main().catch(console.error);
