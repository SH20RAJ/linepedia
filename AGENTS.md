# AI Agent Protocol: Linespedia Content Engine

Welcome, Agent. This document outlines the architecture, scaling logic, and maintenance protocols for **Linespedia**, a high-performance programmatic SEO (pSEO) platform.

## 🚀 Core Architecture

Linespedia is built for extreme scale (200,000+ indexable URLs) using a serverless SSR stack.

- **Framework**: Astro (SSR Mode)
- **Deployment**: Cloudflare Workers
- **Styling**: Tailwind CSS v4 (Premium Aesthetics First)
- **AI Engine**: Puter.js v2 (Chat, Insight, Translation)
- **Data Source**: External GitHub repository (`linespedia-data`) served via JSDelivr CDN.

## 🕸️ Programmatic SEO (pSEO) Expansion

The project maintains a **10x Link Expansion** strategy to dominate international search results.

### 1. Language Localization
We target 11 major languages via the `?lang=xx` query parameter.
- **Languages**: `en, es, fr, de, hi, ar, zh, ja, ru, pt, it`.
- **Logic**: Detected in `src/pages/[...slug].astro`. If present, it triggers a client-side Puter AI translation of the poem content, meaning, and page title.

### 2. Sitemap Sharding
To prevent sitemap size limit issues and ensure rapid indexing:
- **Index**: `sitemap.xml.js` serves as a dynamic index.
- **Shards**: Each language is split into 5 shards (e.g., `sitemap-allpoetry.xml?shard=1&lang=hi`).
- **Total URLs**: This system handles roughly 150k - 200k unique poetry entries.

### 3. Search Engine Submission
We use a **Codebase-Driven Submission** strategy via `scripts/submit-indexnow.js`.
- **Logic**: Instead of crawling site-generated maps, the script harvests URLs directly from `src/data/` and `linespedia-data/`.
- **Scaling**: It automatically generates localized URLs (11 languages) for all writers, categories, and poems, reaching ~2 million indexable URLs.
- **TLS Bypass**: The script includes `tls: { rejectUnauthorized: false }` to bypass common local certificate issues during automated runs.

## 📂 Data Management

All poetry metadata and writer profiles are decoupled from the main app.
- **Resolver**: `src/lib/cdn.ts` contains the logic for resolving slugs and fetching JSON batches.
- **JSON Structure**: Uses `all-poems-metadata.json` for pSEO mapping and specific writer batches for performance.

## 🧠 AI Integration

- **SSR-Safe Wrapper**: `src/lib/puter.ts` provides a safety layer for the Puter SDK, ensuring the build doesn't crash during SSR evaluation while maintaining full functionality in the browser.
- **Puter Insight**: Managed by `src/components/AIPanel.astro`. It supports stateful, streaming chat messages between users and the AI about specific poems.
- **Translation**: `src/lib/translate.ts` encapsulates the prompting logic used for on-the-fly localization.

## 🛠️ Maintenance & Workflows

### Deployment
Always use the following command for production pushes:
```bash
bun run deploy
```

### Scraping New Content
When adding new writers or categories:
1. Run the relevant script in `scripts/` (e.g., `scrape-rekhta.js`).
2. Update the `all-poems-metadata.json` in the `linespedia-data` repo.
3. Bump the shard count in `src/pages/sitemap.xml.js` if necessary.

### Design Principles
- **Wow Factor**: Use vibrant HSL colors, glassmorphism (`backdrop-blur-3xl`), and radial gradients.
- **Micro-animations**: Use Tailwind `animate-in` and hover scales for engagement.

---
*Maintained by Antigravity AI @ Google Deepmind*
