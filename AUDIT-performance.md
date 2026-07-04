# Performance & Core Web Vitals Audit -- library.linespedia.com

**Date**: 2026-05-17
**Framework**: Astro SSR (Cloudflare Workers, `advanced` mode)
**Styling**: Tailwind CSS v4
**Testing**: Server-side analysis (curl) + source code review

---

## Executive Summary

| Category | Status | Severity |
|----------|--------|----------|
| LCP (Largest Contentful Paint) | AT RISK | HIGH |
| INP (Interaction to Next Paint) | LIKELY PASS | LOW |
| CLS (Cumulative Layout Shift) | AT RISK | MEDIUM |
| TTFB (Time to First Byte) | FAIL | CRITICAL |
| Page Weight | NEEDS WORK | MEDIUM |
| Third-Party Impact | NEEDS WORK | MEDIUM |

**Overall Assessment**: The site has a solid architectural foundation (deferred third-party scripts, lazy loading on most images, preconnects configured). However, the extremely high and inconsistent TTFB (0.9s -- 4.0s) from the Cloudflare Worker SSR is the dominant bottleneck and will cause LCP failure on most connections. Several image and font issues compound the problem.

---

## 1. TTFB (Time to First Byte) -- CRITICAL

**Measured Values** (from Singapore edge, near Cloudflare POP):

| Page | TTFB | Total | HTML Size |
|------|------|-------|-----------|
| `/` (home) | 0.88s -- 4.0s | 5.6s -- 8.1s | 82.5 KB |
| `/explore/` | 2.1s | 5.1s | 72.8 KB |
| `/blog/` | 2.7s | 4.8s | 44.6 KB |

**Threshold**: Good is <200ms. Every measured response is 4x to 20x over budget.

**Root Cause**: The Astro SSR worker on every request:
1. Fetches JSON data from `cdn.jsdelivr.net` (slug-map.json, writers.json, categories.json, collections.json, featured-poems.json) -- 5 separate CDN fetches on the homepage alone.
2. Renders the full page HTML on the server.
3. Returns the uncacheable HTML response (no `Cache-Control` header on the HTML).

The HTML response has **no cache-control header**, meaning Cloudflare does not cache the HTML. Every visitor triggers a full SSR render.

**Impact on CWV**: TTFB directly inflates LCP. If TTFB is 2s, LCP cannot be better than ~2.5s even with perfect optimization of everything else.

### Recommendations (Priority 1)

| Action | Expected Impact | Effort |
|--------|----------------|--------|
| **Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`** to HTML responses via middleware. Cloudflare will cache the SSR output at the edge for 60s. | Reduces TTFB to <50ms for cache hits (vast majority of traffic). **Single highest-impact change.** | Low |
| **Cache CDN data in-memory** within the worker using `caches.default` or a simple Map with TTL. The writers/categories/collections JSON changes rarely. | Eliminates redundant fetches on every request, reducing worker CPU time. | Low |
| **Consider prerendering the homepage** (`export const prerender = true` in index.astro). The homepage content is the same for all visitors. | Eliminates SSR cost entirely for the most visited page. | Low |
| **Use `stale-while-revalidate`** pattern: serve stale HTML while revalidating in the background. | Eliminates cold-start latency for all pages. | Medium |

---

## 2. LCP (Largest Contentful Paint) -- HIGH RISK

**Estimated LCP Element**: The hero `<h1>` text ("Linespedia archives / shayari, poems, and lines") or the first blog post hero image.

**Blocking Chain**:
```
TTFB (0.9-4.0s)
  -> HTML parse
    -> CSS load: /_astro/Footer.D_rJ6bkG.css (render-blocking stylesheet)
    -> Google Fonts load: Inter + Playfair Display (loaded via @import in CSS, not preloaded)
    -> Hero content render
```

### Identified LCP Issues

#### 2a. Google Fonts Loaded via CSS @import (MEDIUM)
In `/src/styles/global.css` line 3:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
```

This creates a **waterfall**: the browser must first download the main CSS, parse it, discover the `@import`, then fetch the font CSS, then fetch the font files. The Playfair Display font (used in the hero h1) is on the critical path.

**Fix**: Move the Google Fonts `<link>` into the `<head>` of Layout.astro and add `preload` for the most critical font files:
```html
<link rel="preload" href="[playfair-display-woff2-url]" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap">
```

#### 2b. Blog Hero Images Not Prioritized (MEDIUM)
The 3 blog post hero images on the homepage have:
- No `loading="lazy"` (they load eagerly -- correct if above-fold, but they are below-fold)
- No `width` or `height` attributes (CLS risk)
- No `fetchpriority` attribute
- No `decoding="async"`
- Served as JPEG from Unsplash (not WebP/AVIF)

These images are below the fold but load eagerly, competing for bandwidth with LCP resources.

**Fix**: Add `loading="lazy"`, explicit `width`/`height`, and `decoding="async"` to all blog hero images. Consider using the Unsplash `fm=webp` parameter.

#### 2c. Hero Section Has No Image LCP Candidate (LOW)
The hero section (`/src/components/Hero.astro`) uses only CSS gradients and text -- no hero image. This is actually good for LCP if the text renders quickly, but the font dependency (Playfair Display) means the LCP element won't render until the font loads.

---

## 3. CLS (Cumulative Layout Shift) -- MEDIUM RISK

### Identified CLS Issues

#### 3a. Blog Hero Images Missing Dimensions (HIGH CLS Risk)
In `index.astro` lines 239-243, the blog post hero images have no `width` or `height`:
```html
<img src={post.data.heroImage} alt={post.data.title}
  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
```

The parent `<a>` has `aspect-video` class which helps, but without explicit dimensions the browser cannot reserve space until the image loads.

**Fix**: Add `width="1000" height="563"` (matching the Unsplash w=1000 parameter with 16:9 aspect ratio) to all blog hero images.

#### 3b. DiceBear Avatar Images Missing Dimensions (MEDIUM CLS Risk)
All 10 DiceBear avatar images on the homepage have no explicit `width`/`height`. They are SVGs returned from an external API with ~1s latency.

```html
<img src="https://api.dicebear.com/7.x/avataaars/svg?seed=..." alt="...">
```

The parent containers use Tailwind width classes (`w-20 h-20`, `w-28 h-28`, `w-8 h-8`, `w-10 h-10`), but the images themselves have no intrinsic dimensions.

**Fix**: Add explicit `width` and `height` attributes matching the container sizes.

#### 3c. Writer Photos from CDN Missing Dimensions (MEDIUM CLS Risk)
The `writer.photo` images in the "Featured Poets" section have `loading="lazy"` but no explicit dimensions. Their container sizes are set via CSS, but explicit attributes improve CLS.

#### 3d. Google Translate Widget Injection (LOW CLS Risk)
The Google Translate widget is injected after `window.onload`. If a container element exists in the DOM, it could cause a layout shift when the widget renders.

**Fix**: Wrap the translate element in a container with fixed height, or only inject it on user interaction.

#### 3e. Placeholder Image is 404 (HIGH)
`/placeholder.png` returns HTTP 404. This affects at least 2 blog posts and causes a broken image (no fallback), contributing to layout shift and poor UX.

**Fix**: Either create the `/placeholder.png` file or update blog posts to use a valid fallback image.

---

## 4. Image Optimization -- MEDIUM

### Current State

| Image Type | Count | Format | Lazy | Dimensions | fetchpriority |
|------------|-------|--------|------|------------|---------------|
| DiceBear avatars | 10 | SVG | Yes (9/10) | Missing | Missing |
| Unsplash blog images | 2 | JPEG | No | Missing | Missing |
| Local placeholder | 1 | PNG (404!) | No | Missing | Missing |
| Lucide icons (inline SVG) | ~19 | SVG | N/A | Yes (14-28px) | N/A |

### Recommendations

1. **Convert Unsplash images to WebP/AVIF**: Add `&fm=webp` or `&fm=avif` to Unsplash URLs. The current JPEG response is 23KB; WebP would be ~60% smaller.

2. **Add explicit `width`/`height` to all `<img>` tags** to prevent CLS.

3. **Use `fetchpriority="high"` on the LCP image** (if a hero image is added). Currently no images use `fetchpriority`.

4. **Consider self-hosting DiceBear avatars**: Each DiceBear API call takes ~1s. For 10 avatars, that is 10 external API calls. Generate the SVGs at build time and serve them as static assets, or use a single sprite sheet.

5. **Fix the broken `/placeholder.png`** (returns 404).

---

## 5. Font Loading Strategy -- MEDIUM

### Current State
- Fonts loaded via `@import` inside `global.css` (waterfall problem)
- `font-display: swap` is set (good -- prevents FOIT)
- Preconnects configured for `fonts.googleapis.com` and `fonts.gstatic.com` (good)
- Two font families: **Inter** (4 weights) and **Playfair Display** (3 weights, italic)

### Issues
1. The `@import` in CSS creates a render-blocking waterfall (see LCP section 2a).
2. No `<link rel="preload">` for critical font files.
3. Both fonts are loaded on every page, even if only Inter is needed.

### Recommendations
1. Move font `<link>` from CSS `@import` to `<head>` in Layout.astro.
2. Preload the most critical font file (Playfair Display 700, used in hero).
3. Consider using `font-display: optional` for non-critical font weights to eliminate layout shift entirely.

---

## 6. Third-Party Script Impact -- MEDIUM

### Script Inventory

| Script | Load Strategy | Size (est.) | Impact |
|--------|--------------|-------------|--------|
| Google Analytics (gtag.js) | `async` in `<head>` | ~45 KB | Low -- does not block render |
| Google AdSense | `async` in `<head>` | ~60 KB | Medium -- may inject ads causing CLS |
| Puter.js (v2) | Injected after `window.onload` | ~100 KB+ | Low -- deferred correctly |
| Google Translate | Injected after `window.onload` | ~40 KB | Low -- deferred correctly |
| Tally popup | `requestIdleCallback` (10s timeout) | ~20 KB | Low -- deferred correctly |
| Service Worker | After `window.onload` | ~4.6 KB | Low -- deferred correctly |
| Astro page JS (`page.*.js`) | `type="module"` | Small | Low |

### What is Done Well
- GA and AdSense are `async` (non-blocking).
- Puter.js, Google Translate, and Tally are all deferred until after page load.
- Preconnects are configured for all major third-party origins.
- Duplicate `dns-prefetch` entries exist for AdSense and GTM (harmless but redundant).

### Recommendations
1. **AdSense CLS risk**: When AdSense injects ads, it can cause layout shifts. Reserve space for ad slots with explicit containers.
2. **Remove duplicate `dns-prefetch`** entries (lines 96-98 and 161-163 in Layout.astro are identical).
3. **Consider loading AdSense lazily**: Instead of in `<head>`, inject it after user interaction or on scroll, similar to the Tally pattern.

---

## 7. CSS & Rendering Performance -- LOW

### Current State
- One external stylesheet: `/_astro/Footer.D_rJ6bkG.css` (render-blocking)
- Tailwind CSS v4 (tree-shakes unused classes)
- 9 `backdrop-blur` usages (GPU-intensive)
- 63 `shadow-*` class usages
- 8 `animate-*` class usages
- ~63 `transition-*` class usages

### Observations
1. The external CSS file has proper Cloudflare caching (`cf-cache-status: HIT`, content-hashed filename).
2. `backdrop-blur` with large radius values (`blur-[120px]`, `blur-[100px]`) in the Hero component are GPU-intensive but only applied to decorative background elements.
3. No critical CSS is inlined -- the full stylesheet must download before any content renders.

### Recommendations
1. **Inline critical CSS** for above-the-fold content (hero section, navbar) in a `<style>` tag in the `<head>`, and defer the full stylesheet.
2. **Reduce `backdrop-blur` radius values** from 120px to 40-60px. The visual difference is negligible but the GPU cost is significantly lower.
3. **Use `will-change: transform`** sparingly on elements with frequent hover animations.

---

## 8. Service Worker & Caching -- LOW

### Current State
- Service worker (`/sw.js`) is well-implemented with proper versioning.
- Uses `stale-while-revalidate` for CSS/JS/fonts, `cache-first` for images, `network-first` for navigation.
- Cloudflare caches static assets (`cf-cache-status: HIT`), with `cache-control: public, max-age=0, must-revalidate` (revalidation on every request).

### Issue
The `cache-control: public, max-age=0, must-revalidate` on static assets means the browser must revalidate every resource on every page load (304 round-trips). Since the filenames are content-hashed by Astro, they are immutable and can be cached indefinitely.

### Recommendation
Set `cache-control: public, max-age=31536000, immutable` on content-hashed assets (`/_astro/*`) via Cloudflare cache rules or middleware. This eliminates revalidation requests entirely.

---

## 9. HTML Document Size

| Page | Size | Lines | DOM Elements (est.) |
|------|------|-------|---------------------|
| `/` | 82.5 KB | 223 | ~400+ |
| `/explore/` | 72.8 KB | -- | -- |
| `/blog/` | 44.6 KB | -- | -- |

The homepage at 82.5 KB is reasonable but contains substantial inline content (poem text, writer names, descriptions). The DOM element count is likely within acceptable limits (<1,500).

---

## 10. Prioritized Action Plan

### Tier 1 -- Critical (Do First, Highest Impact)

| # | Action | Metric Affected | Expected Improvement |
|---|--------|----------------|---------------------|
| 1 | **Add `Cache-Control` to SSR HTML responses** via middleware | TTFB, LCP | TTFB: 4s -> <50ms (cached). LCP: -2s improvement. |
| 2 | **Cache CDN JSON data** in worker memory with TTL | TTFB | Eliminates 5 external fetches per request. |
| 3 | **Fix broken `/placeholder.png`** (404) | CLS, UX | Eliminates broken images on 2+ blog posts. |

### Tier 2 -- High Impact (Do Next)

| # | Action | Metric Affected | Expected Improvement |
|---|--------|----------------|---------------------|
| 4 | **Move Google Fonts from CSS `@import` to `<head>` `<link>`** | LCP | Eliminates font waterfall. -0.5-1s LCP. |
| 5 | **Preload Playfair Display font file** | LCP | Hero text renders immediately. |
| 6 | **Add `width`/`height` to all `<img>` tags** | CLS | Prevents layout shift on image load. |
| 7 | **Set immutable cache headers on `/_astro/*` assets** | Page load | Eliminates revalidation round-trips. |

### Tier 3 -- Medium Impact (Nice to Have)

| # | Action | Metric Affected | Expected Improvement |
|---|--------|----------------|---------------------|
| 8 | **Convert Unsplash images to WebP** (`fm=webp` param) | Page weight | ~60% image size reduction. |
| 9 | **Self-host or build-time-generate DiceBear avatars** | TTFB, LCP | Eliminates 10 external API calls (~1s each). |
| 10 | **Inline critical CSS** for above-fold content | LCP | Eliminates render-blocking CSS. |
| 11 | **Remove duplicate `dns-prefetch` entries** in Layout.astro | Cleanliness | Minor HTML size reduction. |
| 12 | **Add `loading="lazy"` to below-fold blog images** | Bandwidth | Reduces initial page load weight. |
| 13 | **Defer AdSense loading** to after user interaction | INP, CLS | Reduces main thread contention. |

---

## 11. Source Files Referenced

- `/Users/shaswatraj/Desktop/earn/linepedia/src/layouts/Layout.astro` -- Script loading, preconnects, font strategy
- `/Users/shaswatraj/Desktop/earn/linepedia/src/pages/index.astro` -- Homepage structure, image usage
- `/Users/shaswatraj/Desktop/earn/linepedia/src/styles/global.css` -- Font import, Tailwind config
- `/Users/shaswatraj/Desktop/earn/linepedia/src/components/Hero.astro` -- Hero section (no images, CSS-only)
- `/Users/shaswatraj/Desktop/earn/linepedia/src/components/PoemCard.astro` -- Poem cards with DiceBear avatars
- `/Users/shaswatraj/Desktop/earn/linepedia/src/components/Navbar.astro` -- Sticky navbar, bottom nav
- `/Users/shaswatraj/Desktop/earn/linepedia/src/components/Footer.astro` -- Footer component
- `/Users/shaswatraj/Desktop/earn/linepedia/src/components/Newsletter.astro` -- Newsletter form
- `/Users/shaswatraj/Desktop/earn/linepedia/src/lib/cdn.ts` -- CDN data fetching (5 separate fetches)
- `/Users/shaswatraj/Desktop/earn/linepedia/astro.config.mjs` -- Astro config, Cloudflare adapter
- `/Users/shaswatraj/Desktop/earn/linepedia/public/sw.js` -- Service worker implementation

---

## 12. Estimated CWV Impact After Fixes

| Metric | Current (Est.) | After Tier 1 | After Tier 1+2 | Threshold |
|--------|---------------|--------------|-----------------|-----------|
| TTFB | 900ms -- 4000ms | <50ms (cached) | <50ms | Good: <200ms |
| LCP | 3.0s -- 6.0s | 1.5s -- 2.5s | 1.0s -- 1.8s | Good: <2.5s |
| CLS | 0.1 -- 0.25 | 0.05 -- 0.15 | <0.05 | Good: <0.1 |
| INP | Likely <200ms | <200ms | <200ms | Good: <200ms |

The single most impactful change is adding `Cache-Control` to SSR HTML responses. This alone is expected to bring LCP from "Poor" to "Needs Improvement" or "Good" territory.

---

*Audit performed via source code analysis and live server response measurement. For field data validation, check [CrUX Vis](https://cruxvis.withgoogle.com) or the PageSpeed Insights API.*
