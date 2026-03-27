import fs from 'fs';
import path from 'path';

export async function GET(context) {
  const site = context.site?.toString() || 'https://linespedia.com/';
  const ALLPOETRY_DIR = path.resolve('../linespedia-data/allpoetry');
  
  let urls = [];
  
  try {
    if (fs.existsSync(ALLPOETRY_DIR)) {
      const writers = fs.readdirSync(ALLPOETRY_DIR);
      for (const writer of writers) {
        const writerPath = path.join(ALLPOETRY_DIR, writer);
        if (fs.statSync(writerPath).isDirectory()) {
          const poems = fs.readdirSync(writerPath);
          for (const poem of poems) {
            if (poem.endsWith('.md')) {
              const slug = poem.replace('.md', '');
              urls.push(`${site.endsWith('/') ? site : `${site}/`}line/${slug}/`);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("Sitemap Error:", e);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
