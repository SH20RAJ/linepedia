import type { APIRoute } from 'astro';
import { getAllCategories } from '../../../lib/cdn';

export const GET: APIRoute = async () => {
  try {
    const categories = await getAllCategories();
    return new Response(JSON.stringify({
      categories: categories.map(c => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
      })),
      total: categories.length,
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
