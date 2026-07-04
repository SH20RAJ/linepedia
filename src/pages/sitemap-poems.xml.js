const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BluredCodes/linespedia-data@main';

function toLastmod() {
  return new Date().toISOString().split('T')[0];
}

export async function GET(context) {
  const site = context.site?.toString()?.replace(/\/$/, '') || 'https://library.linespedia.com';
  const FALLBACK_LASTMOD = toLastmod();

  let slugMap = {};
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/slug-map.json`);
    if (res.ok) slugMap = await res.json();
  } catch (e) {
    console.error('Sitemap poems fetch error:', e);
  }

  let writers = [];
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/writers.json`);
    if (res.ok) writers = await res.json();
  } catch (e) {}

  let categories = [];
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/categories.json`);
    if (res.ok) categories = await res.json();
  } catch (e) {}

  let collections = [];
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/collections.json`);
    if (res.ok) collections = await res.json();
  } catch (e) {}

  const poemEntries = Object.keys(slugMap)
    .map((slug) => `  <url>
    <loc>${site}/line/${slug}/</loc>
    <lastmod>${FALLBACK_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
    .join('\n');

  const writerEntries = writers
    .map((w) => `  <url>
    <loc>${site}/${w.slug}/</loc>
    <lastmod>${FALLBACK_LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
    .join('\n');

  const categoryEntries = categories
    .map((c) => `  <url>
    <loc>${site}/${c.slug}/</loc>
    <lastmod>${FALLBACK_LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`)
    .join('\n');

  const collectionEntries = collections
    .map((c) => `  <url>
    <loc>${site}/${c.slug}/</loc>
    <lastmod>${FALLBACK_LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`)
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${poemEntries}
${writerEntries}
${categoryEntries}
${collectionEntries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
