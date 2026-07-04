# Sitemap Audit Report: library.linespedia.com

**Date:** 2026-05-17
**Auditor:** OpenClaude Sitemap Architecture Specialist
**Site:** https://library.library.linespedia.com (programmatic SEO, ~150k-200k target URLs)

---

## Executive Summary

The sitemap infrastructure has **4 critical bugs**, **3 high-severity issues**, and **5 medium-severity concerns**. The most impactful finding is that the `1970-01-01` epoch bug affects **all sitemaps except `sitemap-poems.xml`**, meaning Google sees stale/invalid lastmod dates for the vast majority of the site. Additionally, the robots.txt references a Cloudflare auto-generated sitemap index that is completely disconnected from the actual sitemap architecture.

---

## URL Count Inventory

| Sitemap | URLs | Status |
|---------|------|--------|
| `sitemap-poems.xml` | 38,110 | OK (all identical lastmod) |
| `sitemap-seo.xml` | 392 | ALL epoch dates |
| `sitemap-stories.xml` | 61 | ALL epoch dates |
| `sitemap-allpoetry.xml?shard=1` | 26,751 | ALL epoch dates |
| `sitemap-allpoetry.xml?shard=2` | 9,328 | ALL epoch dates |
| `sitemap-allpoetry.xml?shard=3` | 0 | Empty |
| `sitemap-allpoetry.xml?shard=4` | 0 | Empty |
| `sitemap-allpoetry.xml?shard=5` | 0 | Empty |
| **TOTAL** | **74,642** | |

**Missing from sitemap:** `/poem-of-the-day/`, `/sponsor/`, `/posters/`, `/articles/`, `/ap/` (paginated archive)

---

## Critical Issues (Severity: CRITICAL)

### C1. Epoch Date Bug -- `1970-01-01` in All Sitemaps Except Poems

**Affected files:**
- `/src/pages/sitemap-index.xml.js` (line 2)
- `/src/pages/sitemap-seo.xml.js` (line 3)
- `/src/pages/sitemap-stories.xml.js` (line 3)
- `/src/pages/sitemap-allpoetry.xml.js` (line 3)

**Root cause:** The `FALLBACK_LASTMOD` and `INDEX_LASTMOD` constants are defined at **module scope**:

```js
const FALLBACK_LASTMOD = new Date().toISOString().split('T')[0];
```

In Cloudflare Workers SSR mode, module-scope code evaluates at bundle time, not at request time. The build environment does not initialize `Date` correctly, causing it to resolve to Unix epoch (`1970-01-01`). Every sitemap using this pattern outputs epoch dates.

**Live evidence:**
- `sitemap.xml` index: all 8 `<lastmod>` entries are `1970-01-01`
- `sitemap-seo.xml`: all 392 entries are `1970-01-01`
- `sitemap-stories.xml`: all 61 entries are `1970-01-01`
- `sitemap-allpoetry.xml` (shards 1-2): all 36,079 entries are `1970-01-01`

**Impact:** Google uses `lastmod` to prioritize crawl scheduling. Invalid epoch dates signal "never updated," causing Google to deprioritize recrawling these pages. For a pSEO site that relies on fresh indexing, this is severely damaging.

**Fix:** Move `new Date()` into the `GET()` handler function body so it evaluates at request time, not module load time.

---

### C2. Robots.txt Points to Wrong Sitemap Index

**File:** `/public/robots.txt` (line 48)

```
Sitemap: https://library.library.linespedia.com/sitemap-index.xml
```

**Problem:** `sitemap-index.xml` is a **Cloudflare auto-generated stub** that returns:

```xml
<sitemapindex>
  <sitemap><loc>https://library.library.linespedia.com/sitemap-0.xml</loc></sitemap>
</sitemapindex>
```

This points to `sitemap-0.xml`, which does not exist in the source code and is disconnected from the actual sitemap architecture. The real sitemap index is at `sitemap.xml`.

**Impact:** Google Search Console and other crawlers follow the robots.txt reference and discover a dead-end sitemap index pointing to a non-existent file. The actual sitemap at `sitemap.xml` with 74,642 URLs is never discovered via this path.

**Fix:** Change robots.txt to reference `https://library.library.linespedia.com/sitemap.xml` instead.

---

### C3. sitemap-poems.xml -- All 38,110 Dates Are Identical

**File:** `sitemap-poems.xml` (no source file found at `/src/pages/sitemap-poems.xml.js`)

Every single entry in `sitemap-poems.xml` has `<lastmod>2026-03-26</lastmod>`. While not epoch, this is a **batch-generated static date** rather than per-poem actual modification dates. This signals to Google that all poems were last modified on the same day, which is unrealistic and reduces crawl efficiency.

**Impact:** Google cannot distinguish between recently updated poems and stale ones, leading to uniform crawl scheduling rather than prioritizing genuinely updated content.

---

### C4. Empty AllPoetry Shards 3-5

**File:** `/src/pages/sitemap-index.xml.js`

The sitemap index references 5 allpoetry shards, but shards 3, 4, and 5 return **zero URLs**. The actual data is only 36,079 entries (fits in 2 shards at 25,000 per shard). Three empty sitemaps in the index waste Google's crawl budget on empty responses.

**Fix:** Either dynamically calculate the number of shards based on actual data size, or reduce `SHARDS_PER_LANG` to 2.

---

## High-Severity Issues (Severity: HIGH)

### H1. No Hreflang Tags for 11-Language Support

The site supports 11 languages (`en, es, fr, de, hi, ar, zh, ja, ru, pt, it`) via `?lang=xx` query parameters. However, **zero hreflang tags** exist in any sitemap.

**Evidence:** Searched all 4 live sitemaps for `hreflang` -- 0 results across 74,642 URLs.

**Impact:** Google cannot understand the language relationships between URL variants. This leads to:
- Wrong language versions appearing in search results
- Duplicate content signals across language variants
- Missed traffic from non-English search engines

**Fix:** Add `<xhtml:link rel="alternate" hreflang="xx">` annotations to each URL in the sitemaps, or implement `<link rel="alternate">` tags in page HTML with self-referencing canonicals.

---

### H2. Deprecated Sitemap Tags (`priority` and `changefreq`)

Google officially ignores `<priority>` and `<changefreq>` tags. All sitemaps use these:

| Sitemap | `changefreq` | `priority` |
|---------|-------------|-----------|
| `sitemap-seo.xml` | Yes (weekly/monthly/yearly) | Yes (0.3-1.0) |
| `sitemap-stories.xml` | Yes (weekly/monthly) | Yes (0.6-0.8) |
| `sitemap-poems.xml` | No | Yes (0.6-0.8) |
| `sitemap-allpoetry.xml` | Yes (monthly/weekly) | Yes (0.5-0.8) |

**Impact:** No negative SEO impact, but adds unnecessary bytes to each sitemap. Over 74,642 URLs, this adds ~1.5MB of ignored XML.

**Recommendation:** Remove these tags to reduce sitemap size and simplify maintenance. Focus on accurate `lastmod` dates instead.

---

### H3. Missing Pages from Sitemaps

The following pages exist as Astro components but are absent from all sitemaps:

| Page | Source File | HTTP Status |
|------|-----------|-------------|
| `/poem-of-the-day/` | `src/pages/poem-of-the-day/index.astro` | 301 |
| `/sponsor/` | `src/pages/sponsor.astro` | 301 |
| `/posters/` | `src/pages/posters/index.astro` | 301 |
| `/articles/` | `src/pages/articles/index.astro` | 301 |
| `/ap/` (paginated) | `src/pages/ap/[...page].astro` | Not tested |

**Impact:** These pages are discoverable only through internal links, not through sitemap-guided crawling. Google may deprioritize them.

---

## Medium-Severity Issues (Severity: MEDIUM)

### M1. Quality Gate: 392 Programmatic SEO Pages (Doorway Page Risk)

The `sitemap-seo.xml` contains 392 pages following a pattern of:

```
/{category}/{subcategory}/{modifier}/
```

**Categories (8):** deep-lines, love-shayari, motivational-lines, nature-poetry, romantic-poetry, sad-shayari, spiritual-poetry, urdu-shayari

**Subcategories (7 per category):** short, sad, romantic, deep, attitude, aesthetic, 2-line

**Modifiers (7 per subcategory):** (base), for-instagram, for-whatsapp, copy-paste, in-hindi, for-her, for-him

This is 8 x 7 x 7 = 392 programmatic pages. This exceeds the **30+ WARNING threshold** for location-style pages.

**Risk:** Google's doorway page algorithm specifically targets programmatic pages that differ only in swapped keywords (e.g., "deep lines for Instagram" vs "deep lines for WhatsApp"). Without verified 60%+ unique content per page, these pages face manual action or algorithmic penalty.

**Required action:** Verify that each of these 392 pages has substantial unique content (not just the category name swapped). If content is thin or templated, consolidate or noindex.

---

### M2. Sitemap Naming vs robots.txt Inconsistency

- robots.txt references: `sitemap-index.xml`
- Actual sitemap index: `sitemap.xml`
- `sitemap-poems.xml` has no corresponding source file at `/src/pages/sitemap-poems.xml.js`

The `sitemap-index.xml.js` source does not exist -- the live `sitemap-index.xml` endpoint is a Cloudflare auto-generated stub.

---

### M3. AllPoetry Shard Mixing Poet and Poem URLs

`sitemap-allpoetry.xml?shard=1` mixes two different page types:
- **Poet profile pages:** `https://library.library.linespedia.com/poet/{slug}/` (with `priority=0.8`, `changefreq=weekly`)
- **Poem pages:** `https://library.library.linespedia.com/line/ap/{poet}/{poem}/` (with `priority=0.5`, `changefreq=monthly`)

While not a bug, mixing page types in a single sitemap file makes it harder to analyze crawl performance per page type in Google Search Console.

---

### M4. Trailing Slash Inconsistency

The `sitemap-index.xml.js` uses a `withTrailingSlash()` helper while `sitemap-seo.xml.js` does not, creating potential inconsistency in URL formatting across sitemaps.

---

### M5. Cache-Control Headers

All sitemaps use `Cache-Control: public, max-age=3600` (1 hour). For a pSEO site with 74k+ URLs, this is reasonable but may cause Google to see stale sitemaps if content changes frequently. Consider `max-age=86400` (24 hours) for stable sitemaps and shorter for the index.

---

## Low-Severity Issues (Severity: LOW)

### L1. Sitemap XML Size

| Sitemap | Estimated Size |
|---------|---------------|
| `sitemap-poems.xml` | ~4.5 MB |
| `sitemap-seo.xml` | ~73 KB |
| `sitemap-stories.xml` | ~11 KB |
| `sitemap-allpoetry.xml?shard=1` | ~3.2 MB |
| `sitemap-allpoetry.xml?shard=2` | ~1.1 MB |

All are well under the 50MB limit. No action needed.

---

### L2. Content-Type Headers

All sitemaps correctly return `Content-Type: application/xml; charset=utf-8`. This is proper.

---

## Recommendations (Priority Order)

1. **[CRITICAL]** Move `FALLBACK_LASTMOD` and `INDEX_LASTMOD` inside `GET()` handlers to fix the epoch date bug across all sitemaps.

2. **[CRITICAL]** Update `robots.txt` to reference `https://library.library.linespedia.com/sitemap.xml` instead of `sitemap-index.xml`.

3. **[HIGH]** Add hreflang annotations for the 11 supported languages, either in sitemaps or via `<link>` tags in page HTML.

4. **[HIGH]** Remove or dynamically calculate empty allpoetry shards (3-5).

5. **[HIGH]** Audit the 392 SEO pages for unique content. If content is thin, consolidate or noindex to avoid doorway page penalties.

6. **[MEDIUM]** Remove deprecated `<priority>` and `<changefreq>` tags from all sitemaps.

7. **[MEDIUM]** Add missing pages (`/poem-of-the-day/`, `/sponsor/`, `/posters/`, `/articles/`) to the SEO sitemap.

8. **[LOW]** Consider splitting `sitemap-poems.xml` (38,110 URLs) into multiple shards for consistency with the allpoetry approach.

---

## File References

| File | Path | Status |
|------|------|--------|
| Sitemap index | `/src/pages/sitemap-index.xml.js` | Epoch bug (line 2) |
| SEO sitemap | `/src/pages/sitemap-seo.xml.js` | Epoch bug (line 3), deprecated tags |
| Stories sitemap | `/src/pages/sitemap-stories.xml.js` | Epoch bug (line 3), deprecated tags |
| AllPoetry sitemap | `/src/pages/sitemap-allpoetry.xml.js` | Epoch bug (line 3), deprecated tags, empty shards |
| Poems sitemap | `sitemap-poems.xml` (no source found) | All identical lastmod |
| robots.txt | `/public/robots.txt` | Wrong sitemap reference (line 48) |

---

*Audit completed 2026-05-17. Findings based on live site analysis and source code review.*
