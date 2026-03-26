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
        const contentDiv = doc.querySelector('#dvContent');
        
        if (!contentDiv) {
            console.log(`Fallback for ${url}`);
            return null;
        }

        // Extract Images before cleaning
        const imgTags = [...doc.querySelectorAll('img.picDisplay')];
        const imgUrls = imgTags.map(img => {
            let src = img.getAttribute('src');
            if (src && !src.startsWith('http')) {
                src = src.startsWith('/') ? `${BASE_URL}${src}` : `${BASE_URL}/${src}`;
            }
            return src;
        }).filter(Boolean);

        // Download all images
        const savedImages = [];
        for (let i = 0; i < imgUrls.length; i++) {
            const imgName = `${path.basename(url)}_${i + 1}.png`;
            const success = await downloadImage(imgUrls[i], imgName);
            if (success) savedImages.push(imgName);
        }

        // Clean content for HTML display (using dvAllLft inside dvContent)
        const storyTextEl = doc.querySelector('#dvAllLft.textNormal.textFormat');
        if (storyTextEl) {
            storyTextEl.querySelectorAll('div, script, ins, .textBelowNormal, table, .neoButton').forEach(el => el.remove());
        }
        
        let html = storyTextEl ? storyTextEl.innerHTML : '';
        html = html
            .replace(/Home\s*»\s*Complete Works\s*»\s*Stories\s*/gi, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
        
        // Extract plain text for search indices
        const text = storyTextEl ? storyTextEl.textContent.replace(/\s+/g, ' ').trim() : '';

        // Extract Moral
        const moralMatch = text.match(/"([^"]+)"/);
        const moral = moralMatch ? moralMatch[1] : null;

        return {
            title,
            slug: path.basename(url),
            content: text,
            html,
            images: savedImages, // Multiple images
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
