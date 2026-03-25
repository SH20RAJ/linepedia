import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://linepedia.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    sitemap()
  ],
  prefetch: true
});