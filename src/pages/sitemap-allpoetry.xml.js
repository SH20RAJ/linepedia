const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BluredCodes/linespedia-data@main';

export async function GET() {
  let poems = [];
  
  try {
    const res = await fetch(`${CDN_BASE}/automation/all-poems-metadata.json`);
    if (res.ok) {
      const metadata = await res.json();
      // To keep sitemap size manageable, we can limit to recent or all
      // For now, let's try to index all (millions might be too many for one file, but let's start)
      poems = metadata;
    }
  } catch (e) {
    console.error("Sitemap Fetch Error:", e);
  }

  // Note: If 'poems' exceeds 50,000, we should use a sitemap index.
  // For now, we take the top 45,000 to stay safe.
  const limitedPoems = poems.slice(0, 45000);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${limitedPoems.map(poem => `
  <url>
    <loc>https://linespedia.com/line/ap/${poem.writerSlug || poem.writer?.toLowerCase().replace(/\s+/g, '-')}/${poem.slug}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
