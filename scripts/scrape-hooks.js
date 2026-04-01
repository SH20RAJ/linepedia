import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import pLimit from 'p-limit';

const BASE_URL = 'https://transitionalhooks.com/social-media-video-hook-library/';
const TOTAL_PAGES = 63;
const limit = pLimit(1); // Reduce concurrency to 1 to be more human-like

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapePage(pageNum) {
  const url = pageNum === 1 ? BASE_URL : `${BASE_URL}page/${pageNum}/`;
  console.log(`Scraping page ${pageNum}: ${url}...`);

  // Random delay between 1-3 seconds
  await delay(Math.floor(Math.random() * 2000) + 1000);

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://transitionalhooks.com/',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const $ = cheerio.load(data);
    const pageHooks = [];

    $('li.post-card.fusion-grid-column').each((_, el) => {
      const title = $(el).find('h3.fusion-title-heading').text().trim();
      // Inspecting for direct video sources or button links
      let videoUrl = $(el).find('video source').attr('src');
      if (!videoUrl) {
         videoUrl = $(el).find('a.fusion-button.button-custom').attr('href');
      }
      
      const inspirationUrl = $(el).find('a.fusion-button.button-default').filter((_, btn) => {
        const text = $(btn).text().toLowerCase();
        return text.includes('inspiration') || text.includes('view');
      }).attr('href');

      if (title && videoUrl) {
        pageHooks.push({
          title,
          videoUrl,
          inspirationUrl: inspirationUrl || '#'
        });
      }
    });

    console.log(`Successfully scraped ${pageHooks.length} hooks from page ${pageNum}.`);
    return pageHooks;
  } catch (error) {
    console.error(`Error scraping page ${pageNum}: ${error.message}`);
    return [];
  }
}

async function run() {
  console.log('Starting full hooks scraping...');
  
  const tasks = [];
  for (let i = 1; i <= TOTAL_PAGES; i++) {
    tasks.push(limit(() => scrapePage(i)));
  }

  const results = await Promise.all(tasks);
  const allHooks = results.flat();

  console.log(`Finished! Scraped a total of ${allHooks.length} hooks.`);

  const outputPath = path.join(process.cwd(), 'src/data/transitional-hooks.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(allHooks, null, 2));
  
  console.log(`Data saved to ${outputPath}`);
}

run();
