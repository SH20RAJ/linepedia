/**
 * Google Apps Script for IndexNow Submission
 * Project: Linespedia (pSEO 10x Expansion)
 * 
 * Instructions:
 * 1. Go to script.google.com
 * 2. Paste this code.
 * 3. Update the INDEXNOW_KEY and SITEMAP_URL (if needed).
 * 4. Run 'submitUrlsToIndexNow' or setup a Time-driven Trigger.
 */

const INDEXNOW_KEY = '2f3a29d127b84110a911375a73d97702';
const HOST = 'linespedia.com';
const SITEMAP_INDEX_URL = 'https://linespedia.com/sitemap.xml';

function submitUrlsToIndexNow() {
  const allUrls = [];
  
  try {
    // 1. Fetch the Sitemap Index to get all shards (including localized ones)
    const response = UrlFetchApp.fetch(SITEMAP_INDEX_URL, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      Logger.log('Error fetching sitemap index: ' + response.getContentText());
      return;
    }
    
    const xml = response.getContentText();
    const sitemapUrls = extractXmlLocs(xml);
    Logger.log('Found ' + sitemapUrls.length + ' sitemaps to process.');

    // 2. Process each sitemap shard to extract individual URLs
    sitemapUrls.forEach(url => {
      try {
        const sitemapRes = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        if (sitemapRes.getResponseCode() === 200) {
          const sitemapXml = sitemapRes.getContentText();
          const pageUrls = extractXmlLocs(sitemapXml);
          allUrls.push(...pageUrls);
        }
      } catch (e) {
        Logger.log('Error processing shard ' + url + ': ' + e.message);
      }
    });

    Logger.log('📊 Total localized URLs harvested: ' + allUrls.length);

    if (allUrls.length === 0) {
      Logger.log('No URLs found to submit.');
      return;
    }

    // 3. Submit in batches of 9,000 (IndexNow limit)
    const batchSize = 9000;
    for (let i = 0; i < allUrls.length; i += batchSize) {
      const batch = allUrls.slice(i, i + batchSize);
      Logger.log('📤 Submitting batch ' + (Math.floor(i / batchSize) + 1) + ' (' + batch.length + ' URLs)...');

      const payload = {
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: 'https://' + HOST + '/' + INDEXNOW_KEY + '.txt',
        urlList: batch
      };

      const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const res = UrlFetchApp.fetch('https://api.indexnow.org/indexnow', options);
      Logger.log('Response Status: ' + res.getResponseCode());
    }

    Logger.log('🎉 IndexNow submission complete!');

  } catch (err) {
    Logger.log('Fatal Error: ' + err.message);
  }
}

/**
 * Utility to extract <loc> tags from XML
 */
function extractXmlLocs(xml) {
  const locs = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    locs.push(match[1]);
  }
  return locs;
}
