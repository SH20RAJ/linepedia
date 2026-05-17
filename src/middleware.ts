import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Set security headers on the response
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://js.puter.com https://translate.google.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://js.puter.com https://translate.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://cdn.jsdelivr.net https://www.googletagmanager.com https://pagead2.googlesyndication.com; frame-src 'self' https://www.googletagmanager.com https://pagead2.googlesyndication.com;"
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '0');

  // Cache SSR HTML at Cloudflare edge for 60s, serve stale for 5min while revalidating
  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('text/html') && !contentType.includes('text/event-stream')) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  return response;
});
