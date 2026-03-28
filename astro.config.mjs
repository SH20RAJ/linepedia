import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://linespedia.com',
  output: 'server',
  trailingSlash: 'always',
  adapter: cloudflare({
    mode: 'advanced',
    nodejsCompat: true,
  }),
  integrations: [
    sitemap()
  ],
  prefetch: true
});