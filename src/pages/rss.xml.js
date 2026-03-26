import rss from '@astrojs/rss';
import { getFeaturedPoems } from '../lib/cdn';

export async function GET(context) {
  const poemsData = await getFeaturedPoems();
  
  return rss({
    title: 'Linespedia',
    description: 'Ultra fast static pages for poetry, shayari, and quotes.',
    site: context.site,
    items: (poemsData || [])
      .filter(poem => poem && (poem.title || poem.content))
      .map((poem) => ({
        title: poem.title || 'Poetic Line',
        pubDate: new Date(poem.createdAt || Date.now()),
        description: poem.content || '',
        link: `/line/${poem.slug}/`,
      })),
    customData: `<language>en-us</language>`,
  });
}
