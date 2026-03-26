import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://linespedia.com',
  output: 'static',
  trailingSlash: 'always',
  adapter: cloudflare({
    mode: 'advanced',
  }),
  integrations: [
    sitemap()
  ],
  prefetch: true
});