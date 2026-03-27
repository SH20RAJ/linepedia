const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BluredCodes/linespedia-data@main';

export async function GET({ url }) {
  const shard = parseInt(url.searchParams.get('shard') || '1');
  const lang = url.searchParams.get('lang') || 'en';
  const SHARD_SIZE = 25000;
  
  let allMetadata = [];
  try {
    const res = await fetch(`${CDN_BASE}/automation/all-poems-metadata.json`);
    if (res.ok) allMetadata = await res.json();
  } catch (e) {
    console.error("Sitemap Fetch Error:", e);
  }

  // Calculate range for this shard
  const start = (shard - 1) * SHARD_SIZE;
  const end = start + SHARD_SIZE;
  const limitedMetadata = allMetadata.slice(start, end);

  const entries = limitedMetadata.map(poem => {
    const poetSlug = poem.writerSlug || poem.writer?.toLowerCase().replace(/\s+/g, '-');
    const poemUrl = `https://linespedia.com/line/ap/${poetSlug}/${poem.slug}/`;
    const langUrl = lang === 'en' ? poemUrl : `${poemUrl}?lang=${lang}`;
    
    return `
  <url>
    <loc>${langUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
  }).join('');

  // Also include poet URLs in shard 1 for English
  let poetEntries = '';
  if (shard === 1 && lang === 'en') {
    const uniquePoets = [...new Set(allMetadata.map(m => m.writerSlug || m.writer?.toLowerCase().replace(/\s+/g, '-')))];
    poetEntries = uniquePoets.map(slug => `
  <url>
    <loc>https://linespedia.com/poet/${slug}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${poetEntries}
  ${entries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
