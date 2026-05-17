import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import remarkStripFirstH1 from './src/utils/remark-strip-first-h1.mjs';

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
    sitemap({
      // Only include non-noindex pages; custom SSR sitemaps handle the rest
      filter: (page) => !page.includes('?lang='),
    }),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [remarkStripFirstH1],
  },
  middleware: './src/middleware.ts',
  prefetch: true,
});
