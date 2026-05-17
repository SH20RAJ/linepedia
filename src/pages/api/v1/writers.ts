import type { APIRoute } from 'astro';
import { getAllWriters } from '../../../lib/cdn';

export const GET: APIRoute = async () => {
  try {
    const writers = await getAllWriters();
    return new Response(JSON.stringify({
      writers: writers.map(w => ({
        name: w.name,
        slug: w.slug,
        poems: w.stats?.poems || 0,
      })),
      total: writers.length,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
