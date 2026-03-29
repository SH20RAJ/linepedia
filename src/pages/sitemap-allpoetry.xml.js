const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BluredCodes/linespedia-data@main';
const SHARD_SIZE = 25000;
const FALLBACK_LASTMOD = new Date().toISOString().split('T')[0];
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'hi', 'ar', 'zh', 'ja', 'ru', 'pt', 'it'];

function toPoetSlug(poem) {
  return String(poem?.writerSlug || poem?.writer || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

function toPoemLastmod(poem) {
  const candidate =
    poem?.updatedAt ||
    poem?.updated_at ||
    poem?.modifiedAt ||
    poem?.dateModified ||
    poem?.createdAt ||
    poem?.date ||
    '';

  const parsed = new Date(candidate);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return FALLBACK_LASTMOD;
}

export async function GET({ url }) {
  const shardParam = Number.parseInt(url.searchParams.get('shard') || '1', 10);
  const shard = Number.isFinite(shardParam) && shardParam > 0 ? shardParam : 1;
  const requestedLang = String(url.searchParams.get('lang') || 'en').toLowerCase();
  const lang = SUPPORTED_LANGUAGES.includes(requestedLang) ? requestedLang : 'en';
  
  let allMetadata = [];
  try {
    const res = await fetch(`${CDN_BASE}/automation/all-poems-metadata.json`);
    if (res.ok) allMetadata = await res.json();
  } catch (e) {
    console.error("Sitemap Fetch Error:", e);
  }

  if (!Array.isArray(allMetadata)) {
    allMetadata = [];
  }

  // Calculate range for this shard
  const start = (shard - 1) * SHARD_SIZE;
  const end = start + SHARD_SIZE;
  const limitedMetadata = allMetadata.slice(start, end);

  const entries = limitedMetadata
    .map(poem => {
    const poetSlug = toPoetSlug(poem);
    const poemSlug = String(poem?.slug || '').trim();
    if (!poetSlug || !poemSlug) return '';

    const poemUrl = `https://linespedia.com/line/ap/${poetSlug}/${poemSlug}/`;
    const langUrl = lang === 'en' ? poemUrl : `${poemUrl}?lang=${lang}`;
    
    return `
  <url>
    <loc>${langUrl}</loc>
    <lastmod>${toPoemLastmod(poem)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
  })
  .filter(Boolean)
  .join('');

  // Also include poet URLs in shard 1 for English
  let poetEntries = '';
  if (shard === 1 && lang === 'en') {
    const poetLastmod = new Map();

    for (const poem of allMetadata) {
      const poetSlug = toPoetSlug(poem);
      if (!poetSlug) continue;

      const lastmod = toPoemLastmod(poem);
      const current = poetLastmod.get(poetSlug);
      if (!current || lastmod > current) {
        poetLastmod.set(poetSlug, lastmod);
      }
    }

    poetEntries = Array.from(poetLastmod.entries()).map(([slug, lastmod]) => `
  <url>
    <loc>https://linespedia.com/poet/${slug}/</loc>
    <lastmod>${lastmod}</lastmod>
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
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
