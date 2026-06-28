import { getCollection } from 'astro:content';
import { getSeoUrls } from '../utils/programmatic-seo';

export async function GET(context) {
  const site = context.site?.toString()?.replace(/\/$/, '') || 'https://linespedia.com';
  const FALLBACK_LASTMOD = new Date().toISOString().split('T')[0];

  let posts = [];
  try {
    posts = (await getCollection('blog')).sort(
      (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
    );
  } catch (e) {
    // No blog content
  }

  // Static pages with meaningful lastmod
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/about/', priority: '0.6', changefreq: 'monthly' },
    { path: '/explore/', priority: '0.8', changefreq: 'weekly' },
    { path: '/categories/', priority: '0.7', changefreq: 'weekly' },
    { path: '/writers/', priority: '0.7', changefreq: 'weekly' },
    { path: '/collections/', priority: '0.7', changefreq: 'weekly' },
    { path: '/blog/', priority: '0.7', changefreq: 'weekly' },
    { path: '/contact/', priority: '0.4', changefreq: 'monthly' },
    { path: '/privacy/', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms/', priority: '0.3', changefreq: 'yearly' },
    { path: '/copyright/', priority: '0.3', changefreq: 'yearly' },
    { path: '/submit/', priority: '0.5', changefreq: 'monthly' },
  ];

  const staticEntries = staticPages
    .map(
      (p) => `  <url>
    <loc>${site}${p.path}</loc>
    <lastmod>${FALLBACK_LASTMOD}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
    )
    .join('\n');

  // Blog post entries with actual pubDate
  const blogEntries = posts
    .filter((post) => !post.data.noindex)
    .map((post) => {
      const lastmod = post.data.updatedDate
        ? new Date(post.data.updatedDate).toISOString().split('T')[0]
        : new Date(post.data.pubDate).toISOString().split('T')[0];
      return `  <url>
    <loc>${site}/blog/${post.id}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    })
    .join('\n');

  // Programmatic SEO URLs
  let pseoEntries = '';
  try {
    const pseoUrls = await getSeoUrls(site);
    pseoEntries = pseoUrls
      .map((url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${FALLBACK_LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`)
      .join('\n');
  } catch (e) {}

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${blogEntries}
${pseoEntries}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
