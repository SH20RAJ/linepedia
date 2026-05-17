import type { APIRoute } from 'astro';
import { getAllCategories, getAllWriters, getFeaturedPoems } from '../../../lib/cdn';

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q')?.toLowerCase() || '';
  if (!q) {
    return new Response(JSON.stringify({ success: false, error: 'Missing query parameter q' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [poems, writers, categories] = await Promise.all([
    getFeaturedPoems(),
    getAllWriters(),
    getAllCategories(),
  ]);

  const matchedPoems = poems.filter(p => p.content?.toLowerCase().includes(q)).slice(0, 20);
  const matchedWriters = writers.filter(w => w.name?.toLowerCase().includes(q)).slice(0, 10);
  const matchedCategories = categories.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 10);

  return new Response(JSON.stringify({
    success: true,
    data: { poems: matchedPoems, writers: matchedWriters, categories: matchedCategories },
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
  });
};
