import type { APIRoute } from 'astro';
import { getFeaturedPoems } from '../../../lib/cdn';

export const GET: APIRoute = async () => {
  try {
    const poems = await getFeaturedPoems();
    if (!poems.length) {
      return new Response(JSON.stringify({ error: 'No poems available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const poem = poems[Math.floor(Math.random() * poems.length)];
    return new Response(JSON.stringify({
      id: poem.id,
      slug: poem.slug,
      content: poem.content,
      writer: poem.writer,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
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
