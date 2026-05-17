import type { APIRoute } from 'astro';
import { readFileSync } from 'fs';
import { join } from 'path';

export const GET: APIRoute = async () => {
  let content = '';
  try {
    content = readFileSync(join(process.cwd(), 'public', 'llms.txt'), 'utf-8');
  } catch {
    content = `# Linespedia\n\n> A curated archive of shayari, poems, quotes, and poetic lines.\n\n## Site Structure\n\n- /\n- /line/{slug}/\n- /{writer-slug}/\n- /{category-slug}/\n- /blog/\n- /api/\n`;
  }

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
