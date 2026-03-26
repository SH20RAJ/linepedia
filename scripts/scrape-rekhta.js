import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const BASE_URL = 'https://www.rekhta.org';
const POET_LIST_API = 'https://www.rekhta.org/PoetCollection';
const DATA_DIR = './linespedia-data/rekhta/v1';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

async function fetchPoets(letter, page = 1) {
    const url = `${POET_LIST_API}?lang=1&pageNumber=${page}&StartsWith=${letter}&Info=poet&typeID=659186cb-44e7-4d94-8b1a-fc70f939a733`;
    console.log(`Fetching poets for ${letter} (Page ${page})...`);
    
    try {
        const res = await fetch(url);
        const html = await res.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        
        const poetItems = doc.querySelectorAll('.nwPoetListingItem');
        const poets = [];
        
        poetItems.forEach(item => {
            const link = item.querySelector('a.nwPoetListingPoetName');
            if (link) {
                const name = link.textContent.trim();
                const url = link.getAttribute('href');
                const slug = url.split('/').pop();
                
                // Extract birth/death/city if possible
                const info = item.querySelector('.nwPoetOtherInfo')?.textContent.trim() || '';
                const image = item.querySelector('.nwPoetListingPoetImg img')?.getAttribute('src') || '';
                
                poets.push({ name, slug, url, info, image });
            }
        });
        
        return poets;
    } catch (e) {
        console.error(`Failed to fetch poets for ${letter} page ${page}:`, e);
        return [];
    }
}

async function scrapeAllPoets() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let allPoets = [];

    for (const letter of alphabet) {
        let page = 1;
        while (true) {
            const list = await fetchPoets(letter, page);
            if (list.length === 0) break;
            allPoets.push(...list);
            console.log(`Poets starting with ${letter}: Found ${list.length} on page ${page}. Total: ${allPoets.length}`);
            page++;
            // Safety break for testing
            if (page > 10) break; 
        }
        // Save intermediate results
        fs.writeFileSync(path.join(DATA_DIR, 'poets-index.json'), JSON.stringify(allPoets, null, 2));
    }

    console.log(`✅ Success! Total poets found: ${allPoets.length}`);
}

scrapeAllPoets().catch(console.error);
