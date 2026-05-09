# Full Website SEO Audit Report

**Website:** https://linespedia.com
**Audit Date:** 2026-05-09
**Business Type:** Publisher (Literary/Content Website)

---

## Executive Summary

| Metric | Score |
|--------|-------|
| **Overall SEO Health Score** | **68/100** |
| Technical SEO | 75/100 |
| Content Quality | 72/100 |
| On-Page SEO | 78/100 |
| Schema/Structured Data | 65/100 |
| Performance | 70/100* |
| AI Search Readiness | 25/100 |
| Images | 90/100 |

*Performance score is estimated - requires Lighthouse for exact CWV metrics.

### Top 5 Critical Issues

1. **AI Bot Blocking** - ClaudeBot, GPTBot, Google-Extended blocked in robots.txt - severely limits AI search visibility
2. **Missing llms.txt** - No AI crawler manifest file exists
3. **Invalid Sitemap Dates** - All sub-sitemaps have lastmod = 1970-01-01 (epoch)
4. **Repetitive Homepage Title** - "Linespedia | Linespedia | Linespedia" needs improvement
5. **Missing Article Schema** - Blog posts lack Article/BlogPosting structured data

### Top 5 Quick Wins

1. Add Author schema to content pages
2. Fix sitemap lastmod dates
3. Improve homepage title tag
4. Create llms.txt for AI crawler access
5. Add FAQ schema if applicable

---

## Technical SEO (75/100)

### Crawlability ✅

- **robots.txt:** Exists and is accessible
- **Sitemap:** Main sitemap-index.xml exists with 20+ sub-sitemaps
- **HTTP Status:** Homepage returns 200 OK
- **Cloudflare:** Proper security headers present

### Issues Found

| Issue | Priority | Description |
|-------|----------|-------------|
| AI Bots Blocked | **Critical** | ClaudeBot, GPTBot, Google-Extended, Applebot-Extended blocked |
| Sitemap lastmod | **High** | All sub-sitemaps show lastmod = 1970-01-01 (should be actual dates) |
| Restricted paths | Medium | /admin/, /scripts/, /_astro/ properly blocked |

### Security Headers ✅

- Content-Security-Policy: ✅ Present
- X-Frame-Options: ✅ SAMEORIGIN
- X-Content-Type-Options: ✅ nosniff
- Referrer-Policy: ✅ strict-origin-when-cross-origin
- Permissions-Policy: ✅ Geolocation, microphone, camera disabled

---

## Content Quality (72/100)

### E-E-A-T Signals

- **Experience:** ✅ Site showcases poetry from various authors
- **Expertise:** ✅ Author pages exist (/writers/)
- **Authoritativeness:** ✅ Established site with substantial content
- **Trustworthiness:** ✅ Proper contact page, privacy policy, terms

### Content Assessment

| Factor | Status | Notes |
|--------|--------|-------|
| Readability | ✅ Good | Clean typography, readable fonts |
| Content Depth | ✅ Good | Substantial poems and literary content |
| Author Signals | ⚠️ Partial | Author pages exist but schema missing |
| Thin Content | ✅ Minimal | Content pages have meaningful text |

### AI Citation Readiness

- ⚠️ AI bots blocked - content cannot be used for AI training
- ⚠️ llms.txt missing - no manifest for AI crawlers

---

## On-Page SEO (78/100)

### Meta Tags Analysis

| Page | Title | Description | Status |
|------|-------|-------------|--------|
| Homepage | "Linespedia \| Linespedia \| Linespedia" | "Linespedia is a curated archive..." | ⚠️ Repetitive |
| About | "About Linespedia \| Poetry Library..." | Good | ✅ |
| Blog | "Poetry & Shayari Blog \| Linespedia" | Good | ✅ |
| Panchatantra | "Panchatantra Stories for Kids..." | Good | ✅ |

### Open Graph ✅

- og:type: website
- og:site_name: Linespedia
- og:locale: en_US
- og:locale:alternate: Multiple (es_ES, fr_FR, de_DE, hi_IN, ar_SA, zh_CN, ja_JP, ru_RU, pt_BR, it_IT)
- og:image: Present
- Twitter cards: ✅ Configured

### Canonical Tags ✅

All sampled pages have proper canonical URLs.

---

## Schema/Structured Data (65/100)

### Current Implementation

✅ **Homepage:**
- WebSite schema with SearchAction
- CollectionPage schema with Organization publisher

### Missing Opportunities

| Schema Type | Priority | Pages |
|-------------|----------|-------|
| BlogPosting/Article | **High** | Blog posts |
| Person/Author | **High** | Content pages with author info |
| BreadcrumbList | Medium | All pages |
| FAQPage | Low | If applicable |

### Validation

No obvious JSON-LD errors detected. Schema is properly formatted.

---

## Performance (70/100*)

*Note: Exact Core Web Vitals require Lighthouse run*

### Observed Optimizations

- ✅ DNS prefetch hints for external resources
- ✅ Preconnect to Google Fonts, CDN
- ✅ Astro prefetch enabled
- ✅ Lazy loading on images
- ✅ Cloudflare CDN caching

### Needs Investigation

- Third-party scripts (Google Analytics, AdSense)
- Font loading strategy
- CSS/JS bundle sizes

---

## Images (90/100)

- ✅ All images have alt text (author names)
- ✅ Lazy loading implemented
- ✅ Using external avatar service (DiceBear)

---

## AI Search Readiness (25/100)

### Critical Issues

| Issue | Priority | Impact |
|-------|----------|--------|
| No llms.txt | **Critical** | AI crawlers have no manifest |
| AI bots blocked | **Critical** | ClaudeBot, GPTBot, Google-Extended blocked |
| Content-Signal | **High** | ai-train=no in robots.txt |

### Current State

```
robots.txt Content-Signal: search=yes,ai-train=no

Blocked AI bots:
- ClaudeBot ❌
- GPTBot ❌
- Google-Extended ❌
- Applebot-Extended ❌
- Bytespider ❌
```

### Recommendations

1. **Create llms.txt** at /llms.txt with content listing
2. **Review Content-Signal** - consider allowing ai-input for AI search visibility
3. **Remove specific bot blocks** if you want visibility in ChatGPT, Claude, Perplexity

---

## Sitemap Analysis

### Structure

- Main: /sitemap-index.xml (20+ sub-sitemaps)
- Sitemaps for: poems, stories, SEO pages, AllPoetry (sharded)

### Issues

| Issue | Priority | Description |
|-------|----------|-------------|
| lastmod dates | **High** | All show 1970-01-01 - should be actual dates |
| Priority/ChangeFreq | Low | Present but could be optimized |

---

## Priority Action Plan

### Critical (Fix Immediately)

1. **Create llms.txt** - AI crawler manifest for AI search visibility
2. **Unblock AI bots** - Remove ClaudeBot, GPTBot, Google-Extended from robots.txt
3. **Fix sitemap dates** - Update lastmod to actual timestamps

### High (Fix Within 1 Week)

4. **Fix homepage title** - Remove repetitive "Linespedia | Linespedia | Linespedia"
5. **Add Article schema** - Implement BlogPosting schema on blog posts
6. **Add Author schema** - Add Person/Author schema to content pages

### Medium (Fix Within 1 Month)

7. **Add BreadcrumbList schema** - Improve navigation schema
8. **Review Content-Signal** - Consider allowing ai-input for AI search
9. **Optimize third-party scripts** - Audit Google AdSense impact

### Low (Backlog)

10. Add FAQ schema if applicable
11. Implement VideoObject schema for video content
12. Add spoken word audio schema if applicable

---

## Scoring Breakdown

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 22% | 75 | 16.5 |
| Content Quality | 23% | 72 | 16.6 |
| On-Page SEO | 20% | 78 | 15.6 |
| Schema/Structured Data | 10% | 65 | 6.5 |
| Performance (CWV) | 10% | 70* | 7.0 |
| AI Search Readiness | 10% | 25 | 2.5 |
| Images | 5% | 90 | 4.5 |

**Total: 68.7 → 68/100**

---

*Report generated via SEO Audit skill. Performance metrics marked with asterisk (*) require Lighthouse verification.*