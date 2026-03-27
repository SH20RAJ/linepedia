import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const BASE_URL = 'https://www.rekhta.org';
const POET_LIST_API = 'https://www.rekhta.org/PoetCollection';
const DATA_DIR = path.resolve('./linespedia-data/rekhta/v1');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.rekhta.org/poets'
};

async function fetchPoetDetails(slug) {
    const url = `${BASE_URL}/poets/${slug}/couplets`;
    try {
        const res = await fetch(url, { headers: HEADERS });
        const html = await res.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const shers = [];
        const sherElements = doc.querySelectorAll('.nwSherListItem'); // Common Rekhta class
        
        sherElements.forEach(el => {
            const content = el.querySelector('.pntInner')?.textContent.trim() || el.querySelector('.sher-content')?.textContent.trim();
            if (content) {
                shers.push({
                    content,
                    url: el.querySelector('a')?.getAttribute('href') || ''
                });
            }
        });

        return shers;
    } catch (e) {
        console.error(`Error fetching shers for ${slug}:`, e);
        return [];
    }
}

async function fetchPoets(letter, page = 1) {
    const url = `${POET_LIST_API}?lang=1&pageNumber=${page}&StartsWith=${letter}&Info=poet&typeID=659186cb-44e7-4d94-8b1a-fc70f939a733`;
    console.log(`Fetching poets starting with "${letter.toUpperCase()}" (Page ${page})...`);
    
    try {
        const res = await fetch(url, { headers: HEADERS });
        const html = await res.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        
        const poetItems = doc.querySelectorAll('.nwPoetListingItem');
        const poets = [];
        
        for (const item of poetItems) {
            const link = item.querySelector('a.nwPoetListingPoetName');
            if (link) {
                const name = link.textContent.trim();
                const poetUrl = link.getAttribute('href');
                const slug = poetUrl.split('/').pop();
                const image = item.querySelector('.nwPoetListingPoetImg img')?.getAttribute('src') || '';
                
                console.log(`  -> Found poet: ${name} (${slug})`);
                const shers = await fetchPoetDetails(slug);
                
                poets.push({ name, slug, poetUrl, image, shers });
                
                // Rate limiting protection
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        
        return poets;
    } catch (e) {
        console.error(`Failed to fetch poets for ${letter} page ${page}:`, e);
        return [];
    }
}

async function scrapeAllPoets() {
    const alphabet = 'j'.split(''); // Testing with 'j' for Jaun Eliya
    let allPoets = [];

    for (const letter of alphabet) {
        let page = 1;
        while (page <= 1) { // Testing with 1 page
            const list = await fetchPoets(letter, page);
            if (list.length === 0) break;
            allPoets.push(...list);
            page++;
        }
    }

    fs.writeFileSync(path.join(DATA_DIR, 'rekhta-data.json'), JSON.stringify(allPoets, null, 2));
    console.log(`✅ Success! Data saved to rekhta-data.json`);
}

scrapeAllPoets().catch(console.error);
