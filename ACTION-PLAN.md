# SEO Action Plan -- Linespedia.com

**Generated:** 2026-05-17
**Overall Health Score:** 48/100

---

## P0 -- This Week (Critical Fixes)

These 5 fixes address the most damaging issues and can be completed in under 2 hours total.

### 1. Add Cache-Control to SSR HTML Responses
**File:** `src/middleware.ts`
**Effort:** 15 minutes
**Impact:** TTFB drops from 4s to <50ms. Single highest-impact change.

Add to the response headers in middleware:
```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

### 2. Fix Sitemap lastmod Epoch Bug
**Files:** `src/pages/sitemap.xml.js`, `sitemap-seo.xml.js`, `sitemap-stories.xml.js`, `sitemap-allpoetry.xml.js`
**Effort:** 20 minutes
**Impact:** Restores crawl priority for all ~65,000 URLs.

Move `new Date().toISOString().split('T')[0]` from module scope into each `GET()` handler.

### 3. Unblock AI Search Crawlers
**Location:** Cloudflare Dashboard (not in code)
**Effort:** 15 minutes
**Impact:** Restores visibility to ChatGPT, Perplexity, Google AI Overviews, Meta AI.

Go to Domain > Settings > AI Bot Management. Allow: GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, Amazonbot, meta-externalagent. Keep blocked: Bytespider (training-only).

### 4. Noindex Thin Blog Posts
**Location:** `src/content/blog/` frontmatter
**Effort:** 1 hour
**Impact:** Eliminates sitewide helpful content penalty risk.

Add `noindex: true` to frontmatter of all "Timeless Legacy" posts and "AI Prompts" posts. Keep only ~25-30 quality posts indexed.

### 5. Fix Broken /placeholder.png
**Effort:** 10 minutes
**Impact:** Fixes CLS and broken images on 2+ blog posts.

Either create `public/placeholder.png` or update blog post frontmatter to use a valid Unsplash fallback.

---

## P1 -- This Sprint (High Impact)

### 6. Fix Schema URL Double-Slash Bug
**File:** `src/components/StructuredData.astro`
**Effort:** 30 minutes
**Impact:** Every page's structured data has URLs like `https://linespedia.com//explore/`.

Fix the `siteUrl` construction to not add trailing slash when the path already starts with `/`.

### 7. Add HSTS Header
**File:** `src/middleware.ts`
**Effort:** 5 minutes
**Impact:** Security hardening + minor ranking signal.

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 8. Move Google Fonts to <head>
**File:** `src/styles/global.css` and `src/layouts/Layout.astro`
**Effort:** 30 minutes
**Impact:** Eliminates font waterfall. LCP improves by ~0.5-1s.

Remove the `@import` from global.css. Add `<link>` tags in Layout.astro `<head>` with preload for Playfair Display.

### 9. Write Unique Writer Bios (Top 50)
**Data source:** linespedia-data repository
**Effort:** 2-3 days
**Impact:** Transforms hundreds of thin pages into ranking-eligible content.

Start with: Shakespeare, Ghalib, Rumi, Faiz, Iqbal, Dickinson, Poe, Keats, Whitman, Angelou.

### 10. Reconcile robots.txt
**File:** `public/robots.txt`
**Effort:** 30 minutes
**Impact:** Eliminates confusion between local and live rules.

Sync the comprehensive local rules to Cloudflare's managed version. Fix sitemap reference to `sitemap.xml`.

### 11. Add Image Dimensions
**Files:** `src/pages/index.astro`, `src/components/PoemCard.astro`
**Effort:** 1 hour
**Impact:** CLS drops below 0.05.

Add explicit `width` and `height` to all `<img>` tags, especially DiceBear avatars and Unsplash blog images.

### 12. Fix llms.txt Serving
**File:** `src/pages/llms.txt.ts` (new route)
**Effort:** 30 minutes
**Impact:** Makes site discoverable by AI systems.

The SSR catch-all `[...slug].astro` intercepts `/llms.txt`. Create a dedicated route that returns the file content.

---

## P1.5 -- Sitemap-Specific Fixes

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| S1 | Fix robots.txt sitemap reference: `sitemap-index.xml` -> `sitemap.xml` | 2 min | Correct sitemap discovery |
| S2 | Remove empty allpoetry shards 3-5 from sitemap index (or reduce SHARDS_PER_LANG to 2) | 15 min | Saves crawl budget |
| S3 | Add missing pages to sitemap: `/poem-of-the-day/`, `/sponsor/`, `/posters/`, `/articles/` | 30 min | Better discovery |
| S4 | Audit 392 programmatic SEO pages for unique content (doorway page risk) | 2 hours | Penalty prevention |
| S5 | Remove deprecated `<priority>` and `<changefreq>` tags from all sitemaps | 30 min | Smaller sitemaps |

---

## P2 -- Next Sprint (Medium Impact)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 13 | Write unique category descriptions | 1 day | Category rankings |
| 14 | Add FAQ schema to poem pages | 2 hours | Rich results |
| 15 | Cache CDN JSON in worker memory | 1 hour | TTFB consistency |
| 16 | Add RSL 1.0 licensing | 2 hours | AI permission clarity |
| 17 | Remove duplicate dns-prefetch | 2 min | HTML cleanliness |
| 18 | Convert images to WebP | 30 min | Page weight -60% |
| 19 | Clean up og:locale:alternate | 1 hour | Cleaner signals |
| 20 | Preload critical fonts | 15 min | LCP improvement |

---

## P3 -- Backlog

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 21 | Self-host DiceBear avatars | 2 hours | Eliminates 10 API calls |
| 22 | Inline critical CSS | 2 hours | LCP improvement |
| 23 | Add social profiles to schema | 30 min | Authority signals |
| 24 | Add speakable schema | 1 hour | Voice search |
| 25 | Migrate to nonce-based CSP | 4 hours | Security |
| 26 | Add named editorial identity | 1 hour | E-E-A-T |
| 27 | Expand llms.txt | 1 hour | AI citation |
| 28 | Fix poem page title duplication | 30 min | Title optimization |

---

## Expected Score After P0+P1

| Category | Current | After P0+P1 | Change |
|----------|---------|-------------|--------|
| Technical SEO | 68 | 82 | +14 |
| Content Quality | 42 | 58 | +16 |
| Performance | 30 | 70 | +40 |
| Schema | 72 | 82 | +10 |
| GEO/AI | 38 | 55 | +17 |
| Images | 40 | 60 | +20 |
| **Overall** | **48** | **68** | **+20** |

---

*Generated by OpenClaude SEO Audit on 2026-05-17.*
