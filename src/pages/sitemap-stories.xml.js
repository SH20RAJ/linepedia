import { getPanchatantraStories } from '../lib/cdn';

const LASTMOD = new Date().toISOString().split('T')[0];

function withTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

export async function GET(context) {
  const stories = await getPanchatantraStories();
  const site = withTrailingSlash(context.site?.toString() || 'https://linespedia.com');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}panchtantra/</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ${stories.map(story => `
  <url>
    <loc>${site}panchtantra/${story.slug}/</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }
  });
}
