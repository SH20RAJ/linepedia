import { getPanchatantraStories } from '../lib/cdn';

export async function GET(context) {
  const stories = await getPanchatantraStories();
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${context.site}panchtantra/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ${stories.map(story => `
  <url>
    <loc>${context.site}panchtantra/${story.slug}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
