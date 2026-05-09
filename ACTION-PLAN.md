# SEO Action Plan - Linespedia.com

## Critical (Fix Immediately)

### 1. Create llms.txt for AI Crawlers
**Priority:** Critical | **Effort:** Low | **Impact:** High

AI search (ChatGPT, Claude, Perplexity) cannot discover your content without llms.txt.

**Action:** Create `/public/llms.txt` with:
```
# Linespedia - AI Crawler Manifest

Linespedia is a curated archive of shayari, poems, and poetic lines.
https://linespedia.com

Content sections:
- Poetry: /deep-lines/, /writers/
- Stories: /panchtantra/, /stories/
- Blog: /blog/
- Explore: /explore/
```

---

### 2. Unblock AI Bots in robots.txt
**Priority:** Critical | **Effort:** Low | **Impact:** High

**Current:** ClaudeBot, GPTBot, Google-Extended blocked

**Action:** Remove or comment out these lines in robots.txt:
```
# User-agent: ClaudeBot
# Disallow: /

# User-agent: GPTBot
# Disallow: /
```

Also consider changing Content-Signal to include ai-input:
```
Content-Signal: search=yes,ai-input=yes,ai-train=no
```

---

### 3. Fix Sitemap lastmod Dates
**Priority:** High | **Effort:** Medium | **Impact:** Medium

All sub-sitemaps show lastmod = 1970-01-01 (epoch).

**Action:** Update sitemap generation to use actual modification dates. In your sitemap generation code, use:
```javascript
lastmod: new Date().toISOString()
```
Or better, use the actual content modification dates from your data source.

---

## High Priority (Fix Within 1 Week)

### 4. Fix Homepage Title Tag
**Priority:** High | **Effort:** Low | **Impact:** Medium

**Current:** "Linespedia | Linespedia | Linespedia"
**Recommended:** "Linespedia - Best Shayari, Poems & Quotes Collection"

**Action:** Update meta title in `/src/pages/index.astro`

---

### 5. Add BlogPosting Schema to Blog Posts
**Priority:** High | **Effort:** Medium | **Impact:** High

Blog posts lack Article schema for rich snippets.

**Action:** Add JSON-LD to blog post template:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2024-01-01",
  "publisher": {
    "@type": "Organization",
    "name": "Linespedia",
    "logo": {
      "@type": "ImageObject",
      "url": "https://linespedia.com/logo.png"
    }
  }
}
```

---

### 6. Add Author Schema to Content Pages
**Priority:** High | **Effort:** Medium | **Impact:** Medium

**Action:** Add Person/Author schema on pages that display author content.

---

## Medium Priority (Fix Within 1 Month)

### 7. Add BreadcrumbList Schema
**Priority:** Medium | **Effort:** Low | **Impact:** Medium

**Action:** Add breadcrumb schema to page templates.

---

### 8. Review Content-Signal Policy
**Priority:** Medium | **Effort:** Low | **Impact:** High

Consider allowing AI input for better AI search visibility.

---

### 9. Audit Third-Party Scripts
**Priority:** Medium | **Effort:** Medium | **Impact:** Medium

Google AdSense and Analytics may impact Core Web Vitals.

---

## Low Priority (Backlog)

### 10. Add FAQ Schema
If applicable to your content type.

### 11. Add VideoObject Schema
For any video content.

### 12. Implement Speakable Schema
For audio/poetry recitation content.

---

## Quick Wins Summary

| Action | Priority | Est. Time |
|--------|----------|-----------|
| Create llms.txt | Critical | 30 min |
| Unblock AI bots | Critical | 10 min |
| Fix sitemap dates | High | 2 hrs |
| Fix homepage title | High | 10 min |
| Add Article schema | High | 1 hr |

---

*Generated from SEO Audit - 2026-05-09*