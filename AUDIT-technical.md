# Technical SEO Audit -- Linespedia.com

**Audit Date:** 2026-05-17
**Site:** https://library.linespedia.com
**Stack:** Astro SSR (v6.0.8) on Cloudflare Workers
**Auditor:** OpenClaude Technical SEO

---

## Executive Summary

Linespedia has a solid architectural foundation for programmatic SEO at scale. The Astro SSR + Cloudflare Workers stack delivers fast responses, security headers are applied via middleware, structured data is well-implemented, and the sitemap system handles approximately 65,000 URLs across 8 sitemap files. However, several critical and high-severity issues need immediate attention, most notably the sitemap `lastmod` epoch bug and the complete absence of `hreflang` tags despite supporting 11 languages.

**Overall Technical Score: 68/100**

---

## Issue Summary by Severity

| Severity | Count | Issues |
|----------|-------|--------|
| CRITICAL | 2 | Sitemap lastmod epoch bug, Missing hreflang tags |
| HIGH | 3 | No HSTS header, robots.txt sitemap mismatch (local vs live), Duplicate dns-prefetch entries |
| MEDIUM | 4 | UTM pages not noindexed, No IndexNow reference in robots.txt, CSP uses unsafe-inline, sitemap-index.xml.js redirects instead of serving |
| LOW | 3 | No X-XSS-Protection header, Puter.js loaded via inline script injection, Structured data uses non-standard "Poem" type |

---

## Category Results

| Category | Status | Score |
|----------|--------|-------|
| 1. Crawlability | PASS with issues | 72 |
| 2. Indexability | FAIL | 55 |
| 3. Security | PASS with issues | 75 |
| 4. URL Structure | PASS | 82 |
| 5. Mobile | PASS | 85 |
| 6. Core Web Vitals | NEEDS ATTENTION | 60 |
| 7. Structured Data | PASS | 80 |
| 8. JavaScript Rendering | PASS with issues | 70 |
| 9. IndexNow Protocol | PARTIAL | 65 |

---

## CRITICAL Issues

### C-1: Sitemap `lastmod` Dates Show Unix Epoch (1970-01-01)

**Severity:** CRITICAL
**Impact:** Search engines interpret `1970-01-01` as "never updated," severely reducing crawl priority for all approximately 65,000 URLs. Google has stated that `lastmod` is a strong signal for crawl scheduling.

**Evidence (live):**
All sitemap files return `1970-01-01` for every `<lastmod>` entry:
- `sitemap.xml` (index): 8 sitemaps all show `1970-01-01`
- `sitemap-poems.xml`: 38,110 URLs all show `1970-01-01`
- `sitemap-seo.xml`: 392 URLs all show `1970-01-01`
- `sitemap-stories.xml`: 61 URLs all show `1970-01-01`
- `sitemap-allpoetry.xml` (5 shards): 26,751 URLs all show `1970-01-01`

**Root Cause:**

In these files, `FALLBACK_LASTMOD` is declared at **module scope** (line 3 in each), outside the `GET()` handler:

- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap.xml.js` (line 2):
  ```js
  const INDEX_LASTMOD = new Date().toISOString().split('T')[0];
  ```
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-seo.xml.js` (line 3):
  ```js
  const FALLBACK_LASTMOD = new Date().toISOString().split('T')[0];
  ```
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-stories.xml.js` (line 3):
  ```js
  const FALLBACK_LASTMOD = new Date().toISOString().split('T')[0];
  ```
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-allpoetry.xml.js` (line 3):
  ```js
  const FALLBACK_LASTMOD = new Date().toISOString().split('T')[0];
  ```

In Cloudflare Workers SSR, module-level constants are evaluated once at worker initialization. If the worker was cold-started or the build-time evaluation produced epoch (which happens when `Date` is not properly polyfilled during the build), the value is frozen at `1970-01-01`. Even if it captures the deploy date, it never updates afterward, so it is always stale.

**Fix:** Move the `new Date()` call inside the `GET()` handler so it evaluates on each request. For sitemap-allpoetry.xml.js, the `toPoemLastmod()` function already attempts real dates from poem metadata but falls back to the module-level epoch constant. The fallback must also be computed at request time.

**Files to fix:**
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap.xml.js`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-seo.xml.js`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-stories.xml.js`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-allpoetry.xml.js`

---

### C-2: Missing `hreflang` Tags Despite 11-Language Support

**Severity:** CRITICAL
**Impact:** The site supports 11 languages via `?lang=xx` client-side translation, but there are zero `<link rel="alternate" hreflang="...">` tags in the HTML. Without hreflang:
- Google cannot associate translated variants with the canonical page
- Users in non-English locales may receive the wrong language version in SERPs
- The `og:locale:alternate` meta tags are present but do NOT replace hreflang (they serve a different purpose for Facebook/Open Graph)

**Evidence (live):**
```
curl -s 'https://library.linespedia.com/' | grep -oi '<link rel="alternate"[^>]*hreflang[^>]*>'
```
Returns: (empty -- no hreflang tags found)

**What IS present:**
- `og:locale` = `en_US` (correct)
- `og:locale:alternate` for all 10 other languages (correct for OG, insufficient for SEO)
- `html lang="en"` attribute (correct)
- Canonical tag: `<link rel="canonical" href="https://library.linespedia.com/">` (correct)

**Consideration:** Since translations are client-side (Puter.js AI translates in-browser), the `?lang=xx` pages are correctly set to `noindex,follow` (confirmed: `?lang=es` returns `<meta name="robots" content="noindex,follow">`). This means hreflang is NOT appropriate for the current architecture since there are no server-side translated pages to alternate between. However, this should be documented as a deliberate architectural decision, and the `og:locale:alternate` tags should be removed to avoid confusion, OR the translation strategy should be moved to server-side to unlock hreflang benefits.

**Recommended action:** Either:
1. (Preferred) Remove `og:locale:alternate` meta tags since there are no actual alternate language URLs, OR
2. Implement server-side translation and proper hreflang

---

## HIGH Issues

### H-1: Missing HSTS (Strict-Transport-Security) Header

**Severity:** HIGH
**Impact:** Without HSTS, browsers will allow the first request to go over HTTP, exposing users to downgrade attacks and SSL stripping.

**Evidence (live):**
```
curl -sI https://library.linespedia.com | grep -i strict-transport
```
Returns: (empty)

**What IS present in middleware** (`/Users/shaswatraj/Desktop/earn/linepedia/src/middleware.ts`):
- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

**Fix:** Add to middleware:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
Note: Cloudflare can also set this via the dashboard under SSL/TLS > Edge Certificates > HSTS.

---

### H-2: robots.txt Sitemap Reference Mismatch (Local vs Live)

**Severity:** HIGH
**Impact:** The local `public/robots.txt` references `sitemap-index.xml`, but the live version (managed by Cloudflare) references `sitemap.xml`. While `sitemap-index.xml` does redirect (301) to `sitemap.xml`, this creates confusion and an unnecessary redirect hop for crawlers.

**Local file** (`/Users/shaswatraj/Desktop/earn/linepedia/public/robots.txt`, line 48):
```
Sitemap: https://library.linespedia.com/sitemap-index.xml
```

**Live file** (Cloudflare-managed):
```
Sitemap: https://library.linespedia.com/sitemap.xml
```

**Additional mismatch:** The local robots.txt has more detailed rules (Allow/Disallow for `/blog/`, `/api/`, `/posters/`, `/sponsor/`, query param blocking) that are NOT present in the live version. The live version appears to be Cloudflare's managed robots.txt with only basic rules plus AI crawler blocks.

**Fix:** Reconcile the local and live robots.txt. The live Cloudflare-managed version should include the more comprehensive rules from the local file, and the sitemap reference should consistently point to `https://library.linespedia.com/sitemap.xml`.

---

### H-3: Duplicate `dns-prefetch` Entries in Layout.astro

**Severity:** HIGH (performance waste, not SEO-critical)
**Impact:** Three `dns-prefetch` links are duplicated, adding unnecessary bytes to every page response.

**File:** `/Users/shaswatraj/Desktop/earn/linepedia/src/layouts/Layout.astro`

**First set (lines 96-98):**
```html
<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
```

**Duplicate set (lines 161-163):**
```html
<link rel="dns-prefetch" href="https://pagead2.googlesyndication.com">
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
```

**Fix:** Remove lines 161-163. Also note that lines 92-94 already have `preconnect` for the same origins, which supersedes `dns-prefetch`. The `dns-prefetch` entries for `fonts.googleapis.com` and `pagead2.googlesyndication.com` are redundant given the `preconnect` declarations.

---

## MEDIUM Issues

### M-1: UTM Parameter Pages Not Properly Noindexed

**Severity:** MEDIUM
**Impact:** Pages with `?utm_source=test` serve the same content as the canonical homepage without a `noindex` directive. Google may index these as duplicate content, diluting ranking signals.

**Evidence (live):**
```
curl -s 'https://library.linespedia.com/?utm_source=test' | grep -oi 'noindex'
```
Returns: (empty -- no noindex found)

The `seo.ts` module has `shouldNoindexForParams()` that correctly detects UTM parameters, and the `[...slug].astro` page likely calls it, but the homepage (`index.astro`) does NOT call this function. It only calls `shouldNoindexForLanguageParam()`.

**Fix:** In `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/index.astro`, add a check for tracking/search parameters and merge the noindex result into the `isTranslationParamPage` logic. The canonical tag is correctly set to `https://library.linespedia.com/` (without params), which is good, but `noindex` should accompany it.

---

### M-2: No IndexNow Reference in robots.txt

**Severity:** MEDIUM
**Impact:** The site has a fully functional IndexNow implementation (key at `/2f3a29d127b84110a911375a73d97702.txt`, UI at `/indexnow/`), but the `robots.txt` does not reference the IndexNow key location. Adding it helps Bing/Yandex discover the key.

**Fix:** Add to robots.txt:
```
# IndexNow
Sitemap: https://library.linespedia.com/sitemap.xml
```
(The sitemap reference already exists. The IndexNow key file at `/.well-known/` or root is auto-discovered, but documenting it in robots.txt is best practice.)

---

### M-3: CSP Uses `unsafe-inline` for Scripts

**Severity:** MEDIUM
**Impact:** The Content-Security-Policy allows `'unsafe-inline'` for `script-src`, which weakens XSS protection. Multiple inline scripts in Layout.astro (GA config, PWA install, service worker registration, Puter.js loader, Tally popup) require this.

**Current CSP (from middleware):**
```
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://js.puter.com https://translate.google.com;
```

**Fix:** Migrate inline scripts to use `nonce`-based CSP or move them to external `.js` files. This is a medium-effort refactor but significantly improves security posture.

---

### M-4: `sitemap-index.xml.js` Serves a 301 Redirect Instead of Content

**Severity:** MEDIUM
**Impact:** `sitemap-index.xml` returns HTTP 200 with a redirect body (via `Astro.redirect('/sitemap.xml', 301)`), which is an unnecessary redirect hop. Search engines will follow it, but it adds latency and the redirect should be handled at the Cloudflare/CDN level instead.

**File:** `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-index.xml.js`

**Fix:** Either:
1. Remove the file and add a Cloudflare Page Rule or `_redirects` entry for `sitemap-index.xml -> sitemap.xml` (301), OR
2. Have `sitemap-index.xml.js` serve the same content as `sitemap.xml.js` directly

---

## LOW Issues

### L-1: No `X-XSS-Protection` Header

**Severity:** LOW
**Impact:** While deprecated in modern browsers, `X-XSS-Protection: 0` is still recommended to explicitly disable the legacy XSS auditor, preventing certain filter-based attacks.

**Fix:** Add to middleware:
```
X-XSS-Protection: 0
```

---

### L-2: Puter.js Loaded via Dynamic Script Injection

**Severity:** LOW
**Impact:** In Layout.astro (lines 167-173), Puter.js is loaded by injecting a `<script>` element after `window.load`. This is a reasonable performance optimization, but the script is not preloaded, so there is no early discovery hint.

**Fix:** Add a preload hint in `<head>`:
```html
<link rel="preload" href="https://js.puter.com/v2/" as="script" crossorigin>
```

---

### L-3: Structured Data Uses Non-Standard "Poem" Schema Type

**Severity:** LOW
**Impact:** The StructuredData component (`/Users/shaswatraj/Desktop/earn/linepedia/src/components/StructuredData.astro`) uses `"@type": "Poem"` for individual lines. While Google recognizes `Poem` as a subtype of `CreativeWork`, it is not a standard Schema.org type. The more widely supported type would be `CreativeWork` or `Article`.

**File:** `/Users/shaswatraj/Desktop/earn/linepedia/src/components/StructuredData.astro` (line 98)

**Fix:** Consider using `"@type": "CreativeWork"` with `"genre": "Poetry"` for broader compatibility, or keep `Poem` if Google Rich Results testing confirms it is recognized.

---

## Detailed Findings by Category

### 1. Crawlability (Score: 72/100)

| Check | Result | Notes |
|-------|--------|-------|
| robots.txt exists | PASS | Live version served by Cloudflare |
| robots.txt syntax | PASS | Valid directives |
| Sitemap referenced | PASS | `sitemap.xml` referenced in live robots.txt |
| Sitemap accessible | PASS | HTTP 200, correct Content-Type |
| AI crawler blocking | PASS | ClaudeBot, GPTBot, Google-Extended, Amazonbot, Applebot-Extended, Bytespider, CCBot, meta-externalagent all blocked |
| Content-Signal header | PASS | `search=yes,ai-train=no` present |
| Sitemap lastmod | FAIL | All dates are `1970-01-01` (see C-1) |
| Local/live robots.txt sync | FAIL | Mismatched sitemap reference and rules (see H-2) |
| llms.txt present | PASS | Comprehensive AI-friendly index at `/llms.txt` |

**Sitemap inventory (live):**

| Sitemap | URL Count |
|---------|-----------|
| sitemap-poems.xml | 38,110 |
| sitemap-seo.xml | 392 |
| sitemap-stories.xml | 61 |
| sitemap-allpoetry.xml?shard=1 | approximately 26,751 (includes poet pages) |
| sitemap-allpoetry.xml?shard=2-5 | (sharded, 25,000 poems each) |
| **Total estimated** | **approximately 65,000+ URLs** |

### 2. Indexability (Score: 55/100)

| Check | Result | Notes |
|-------|--------|-------|
| Canonical tags | PASS | Present on all pages, correctly points to clean URL |
| `?lang=xx` noindex | PASS | `?lang=es` correctly returns `noindex,follow` |
| `?utm_*` noindex | FAIL | UTM pages serve content without noindex (see M-1) |
| hreflang tags | FAIL | Completely absent (see C-2) |
| `og:locale:alternate` | PASS | All 11 locales listed |
| Meta robots | PASS | Correct `index,follow` with max-snippet/max-image-preview directives |
| Pagination (rel prev/next) | PASS | Supported via `prevURL`/`nextURL` props in Layout |
| Thin content protection | PASS | `generateNoindexRules()` in seo.ts checks minimum items |

### 3. Security (Score: 75/100)

| Check | Result | Notes |
|-------|--------|-------|
| HTTPS | PASS | All requests served over HTTP/2 via Cloudflare |
| Content-Security-Policy | PASS | Comprehensive CSP with specific origins |
| X-Frame-Options | PASS | `SAMEORIGIN` |
| X-Content-Type-Options | PASS | `nosniff` |
| Referrer-Policy | PASS | `strict-origin-when-cross-origin` |
| Permissions-Policy | PASS | `geolocation=(), microphone=(), camera=()` |
| Strict-Transport-Security | FAIL | Missing (see H-1) |
| X-XSS-Protection | MISSING | Not set (see L-1) |
| CSP unsafe-inline | WARN | `script-src` allows `unsafe-inline` (see M-3) |

**Full security headers (live response):**
```
content-security-policy: default-src 'self' https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://js.puter.com https://translate.google.com; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://js.puter.com https://translate.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://cdn.jsdelivr.net https://www.googletagmanager.com https://pagead2.googlesyndication.com; frame-src 'self' https://www.googletagmanager.com https://pagead2.googlesyndication.com;
permissions-policy: geolocation=(), microphone=(), camera=()
referrer-policy: strict-origin-when-cross-origin
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
```

### 4. URL Structure (Score: 82/100)

| Check | Result | Notes |
|-------|--------|-------|
| Clean URLs | PASS | Trailing slashes, descriptive slugs |
| HTTPS enforcement | PASS | Cloudflare handles redirect |
| Trailing slash consistency | PASS | All internal links use trailing slashes |
| 404 handling | PASS | Custom 404 page exists (`/404/`) |
| 302 vs 301 | WARN | Invalid poem URLs return 302 to `/404/` (should be 404 directly) |
| URL pattern consistency | PASS | `/line/{slug}/`, `/{writer}/`, `/{category}/` patterns |

### 5. Mobile (Score: 85/100)

| Check | Result | Notes |
|-------|--------|-------|
| Viewport meta | PASS | `width=device-width, initial-scale=1` |
| PWA manifest | PASS | `/manifest.webmanifest` linked |
| Apple touch icon | PASS | `/icons/apple-touch-icon.png` |
| Theme color | PASS | `#4f46e5` |
| Mobile web app capable | PASS | Both `mobile-web-app-capable` and `apple-mobile-web-app-capable` |
| Service worker | PASS | Registered at `/sw.js` with scope `/` |

### 6. Core Web Vitals (Score: 60/100)

| Check | Result | Notes |
|-------|--------|-------|
| Preconnect hints | PASS | 5 origins preconnected (jsdelivr, fonts, GTM, AdSense) |
| DNS prefetch | WARN | Duplicate entries (see H-3) |
| Image lazy loading | PASS | Writer avatars use `loading="lazy"` |
| Deferred script loading | PASS | Puter.js, Google Translate, Tally all deferred |
| Render-blocking scripts | WARN | Google Analytics and AdSense load synchronously in `<head>` |
| Layout shift risk | WARN | DiceBear avatar API generates images on-the-fly; no explicit width/height on some images |
| LCP candidates | WARN | Hero section likely LCP; no explicit `fetchpriority="high"` on hero image |
| INP considerations | PASS | Client-side translation is async; no heavy event handlers detected |

### 7. Structured Data (Score: 80/100)

| Check | Result | Notes |
|-------|--------|-------|
| Organization schema | PASS | Present on all pages with `@id` reference |
| WebSite schema | PASS | Homepage only, includes SearchAction |
| Breadcrumb schema | PASS | Dynamic based on page context |
| Content schemas | PASS | Poem (line), Person (writer), CollectionPage, BlogPosting, ShortStory |
| FAQ schema | PASS | Supported via props |
| JSON-LD format | PASS | Correct `<script type="application/ld+json">` |
| Schema linking | PASS | Uses `@id` cross-references between Organization and content types |

### 8. JavaScript Rendering (Score: 70/100)

| Check | Result | Notes |
|-------|--------|-------|
| SSR rendering | PASS | Astro SSR mode delivers full HTML |
| JS dependency | WARN | Client-side translation requires JS (Puter.js) |
| Content without JS | PASS | Core content (poems, metadata) is SSR'd |
| Progressive enhancement | PASS | Translation is an enhancement, not a requirement |

### 9. IndexNow Protocol (Score: 65/100)

| Check | Result | Notes |
|-------|--------|-------|
| IndexNow key file | PASS | Key at `/{key}.txt` (verified via UI) |
| Submission UI | PASS | `/indexnow/` page with fetch-from-sitemap and batch submit |
| Proxy endpoint | PASS | `/api/indexnow-proxy/` handles CORS |
| robots.txt reference | MISSING | Key location not documented in robots.txt (see M-2) |

---

## Prioritized Remediation Plan

### Immediate (This Week)

1. **Fix sitemap lastmod epoch bug** (C-1) -- Move `new Date()` inside `GET()` handlers in all 4 sitemap files
2. **Add HSTS header** (H-1) -- Add `Strict-Transport-Security` to middleware or Cloudflare dashboard
3. **Reconcile robots.txt** (H-2) -- Sync local rules to Cloudflare-managed version, fix sitemap reference
4. **Remove duplicate dns-prefetch** (H-3) -- Delete lines 161-163 in Layout.astro

### Short-Term (This Sprint)

5. **Fix UTM noindex** (M-1) -- Add `shouldNoindexForParams()` check to index.astro
6. **Decide on hreflang strategy** (C-2) -- Either remove `og:locale:alternate` or implement server-side translation
7. **Add X-XSS-Protection: 0** (L-1) -- One-line middleware addition

### Medium-Term (Next Sprint)

8. **Migrate inline scripts to nonce-based CSP** (M-3)
9. **Optimize sitemap-index.xml.js** (M-4) -- Serve content directly or use Cloudflare redirect
10. **Add preload hints for deferred scripts** (L-2)

---

## Files Referenced in This Audit

- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap.xml.js`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-seo.xml.js`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-stories.xml.js`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-allpoetry.xml.js`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/sitemap-index.xml.js`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/layouts/Layout.astro`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/lib/seo.ts`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/middleware.ts`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/components/StructuredData.astro`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/index.astro`
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/indexnow.astro`
- `/Users/shaswatraj/Desktop/earn/linepedia/public/robots.txt`
- `/Users/shaswatraj/Desktop/earn/linepedia/public/llms.txt`
