import rss from '@astrojs/rss';
import { getFeaturedPoems, getPanchatantraStories } from '../lib/cdn';

export async function GET(context) {
  const [poemsData, stories] = await Promise.all([
    getFeaturedPoems(),
    getPanchatantraStories()
  ]);
  
  const poemItems = (poemsData || [])
    .filter(poem => poem && (poem.title || poem.content))
    .map((poem) => ({
      title: poem.title || 'Poetic Line',
      pubDate: new Date(poem.createdAt || Date.now()),
      description: poem.content || '',
      link: `/line/${poem.slug}/`,
    }));

  const storyItems = (stories || []).map(story => ({
    title: story.title,
    pubDate: new Date(),
    description: story.moral ? `Moral: ${story.moral}` : story.content.slice(0, 200),
    link: `/panchtantra/${story.slug}/`,
  }));

  return rss({
    title: 'Linespedia',
    description: 'Ultra fast pages for poetry, stories, and insights.',
    site: context.site,
    items: [...storyItems, ...poemItems],
    customData: `<language>en-us</language>`,
  });
}
