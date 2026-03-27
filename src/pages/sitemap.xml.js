export async function GET(context) {
  const site = context.site?.toString() || 'https://linespedia.com/';
  
  const baseSitemaps = [
    'sitemap-seo.xml',
    'sitemap-stories.xml'
  ];

  const languages = ['en', 'es', 'fr', 'de', 'hi', 'ar', 'zh', 'ja', 'ru', 'pt', 'it'];
  const shardsPerLang = 5; 

  const allPoetrySitemaps = [];
  languages.forEach(lang => {
    for (let i = 1; i <= shardsPerLang; i++) {
        const langParam = lang === 'en' ? '' : `&lang=${lang}`;
        allPoetrySitemaps.push(`sitemap-allpoetry.xml?shard=${i}${langParam}`);
    }
  });

  const sitemaps = [...baseSitemaps, ...allPoetrySitemaps];

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
