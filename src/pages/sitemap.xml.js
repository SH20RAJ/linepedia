export async function GET(context) {
  const site = context.site?.toString() || 'https://linespedia.com/';
  
  const sitemaps = [
    'sitemap-seo.xml',
    'sitemap-stories.xml',
    'sitemap-allpoetry.xml'
  ];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps.map(s => `
  <sitemap>
    <loc>${site.endsWith('/') ? site : `${site}/`}${s}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('')}
</sitemapindex>`;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
