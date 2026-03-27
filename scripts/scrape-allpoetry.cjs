const fs = require('fs');
const path = require('path');
const axios = require('axios');
const zlib = require('zlib');
const { parseStringPromise } = require('xml2js');
const cheerio = require('cheerio');

const BASE_DIR = path.join(__dirname, '../linespedia-data/allpoetry');
const SITEMAP_INDEX = 'https://allpoetry.com/sitemap.xml';

// Ensure base directory exists
if (!fs.existsSync(BASE_DIR)) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchGzip(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return new Promise((resolve, reject) => {
    zlib.gunzip(response.data, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer.toString());
    });
  });
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
];

async function scrapePoem(url) {
  try {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    console.log(`[Poem] Scraping: ${url} (UA: ${ua.slice(0, 30)}...)`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://allpoetry.com/',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (data.includes('unusual traffic from this IP address')) {
      console.warn(`[BLOCK] Detected IP block. Sleeping for 15 minutes...`);
      await sleep(15 * 60 * 1000);
      return await scrapePoem(url); // Retry after sleep
    }

    const $ = cheerio.load(data);

    // Refined selectors for AllPoetry
    const title = $('.poem_title').text().trim() || $('h1').first().text().trim() || 'Untitled';
    let writer = $('.author_name').text().trim() || $('.author-name').text().trim();
    
    // Fallback for writer from URL if not found in HTML
    if (!writer) {
      const match = url.match(/-by-(.*)$/);
      if (match) writer = match[1].replace(/-/g, ' ');
    }
    writer = writer || 'Anonymous';

    const content = $('.poem_body').first().text().trim() || $('.poem-text').text().trim();
    
    if (!content || content.length < 10) {
      console.warn(`[Skip] No content found for ${url}`);
      return null;
    }

    const writerSlug = slugify(writer);
    const poemSlug = slugify(title);
    
    const writerDir = path.join(BASE_DIR, writerSlug);
    if (!fs.existsSync(writerDir)) fs.mkdirSync(writerDir, { recursive: true });

    const markdown = `---
title: "${title.replace(/"/g, '\\"')}"
writer: "${writer.replace(/"/g, '\\"')}"
slug: "${poemSlug}"
source: "AllPoetry"
url: "${url}"
---

${content}
`;

    fs.writeFileSync(path.join(writerDir, `${poemSlug}.md`), markdown);
    console.log(`[Poem] Saved: ${writerSlug}/${poemSlug}.md`);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 403) {
      console.error(`[Fatal] 403 Forbidden. Possible IP Permablock. Pause and notify.`);
      process.exit(1);
    }
    console.error(`[Error] Failed to scrape ${url}: ${e.message}`);
    return false;
  }
}

async function main() {
  try {
    console.log(`[Index] Fetching sitemap index: ${SITEMAP_INDEX}`);
    const { data: indexXml } = await axios.get(SITEMAP_INDEX);
    const indexObj = await parseStringPromise(indexXml);
    const sitemaps = indexObj.sitemapindex.sitemap.map(s => s.loc[0]);

    console.log(`[Index] Found ${sitemaps.length} child sitemaps.`);

    // Start from a random sitemap to diversify
    const randomSitemapIndex = Math.floor(Math.random() * sitemaps.length);
    const selectedSitemap = sitemaps[randomSitemapIndex];
    
    console.log(`[Sitemap] Decompressing: ${selectedSitemap}`);
    const sitemapXml = await fetchGzip(selectedSitemap);
    const sitemapObj = await parseStringPromise(sitemapXml);
    
    // Filter for poem URLs
    const poemUrls = sitemapObj.urlset.url
      .map(u => u.loc[0])
      .filter(url => url.includes('/poem/') || url.includes('/poetry/'))
      .sort(() => Math.random() - 0.5); // Randomize order to look less like a crawler

    console.log(`[Sitemap] Found ${poemUrls.length} potential poems. Starting scrape...`);

    let count = 0;
    const LIMIT = 50; // Smaller limit per run to reduce profile

    for (const url of poemUrls) {
      if (count >= LIMIT) break;
      
      const success = await scrapePoem(url);
      if (success) count++;
      
      const delay = 8000 + Math.random() * 10000;
      console.log(`[Wait] Sleeping for ${Math.round(delay/1000)}s...`);
      await sleep(delay); // Much more respectful delay
    }

    console.log(`[Done] Scraped ${count} poems in this run.`);
  } catch (e) {
    console.error(`[Fatal] ${e.message}`);
  }
}

main();

