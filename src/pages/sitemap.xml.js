const SHARDS_PER_LANG = 5;
const INDEX_LASTMOD = new Date().toISOString().split('T')[0];

function withTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

export async function GET(context) {
  const site = withTrailingSlash(context.site?.toString() || 'https://linespedia.com');

  // Build sitemap index with segmented sitemaps. Only canonical English shards are included.
  const baseSitemaps = ['sitemap-poems.xml', 'sitemap-seo.xml', 'sitemap-stories.xml'];

  const allPoetrySitemaps = [];
  for (let shard = 1; shard <= SHARDS_PER_LANG; shard += 1) {
    allPoetrySitemaps.push(`sitemap-allpoetry.xml?shard=${shard}`);
  }

  const sitemaps = [...baseSitemaps, ...allPoetrySitemaps];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps
    .map(
      (path) => `
  <sitemap>
    <loc>${site}${path}</loc>
    <lastmod>${INDEX_LASTMOD}</lastmod>
  </sitemap>`
    )
    .join('')}
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
