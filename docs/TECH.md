# ⚙️ Linepedia — Technical Implementation Specification (tech.md)

## 🎯 Purpose

This document defines how to technically build the Linepedia platform using Astro with programmatic SEO architecture.

AI should use this as the **single source of truth for engineering decisions.**

---

# 🧱 Core Architecture

Platform Type:

* Static Site Generation (SSG)
* Programmatic SEO website
* CDN deployed

Primary Principle:

Content is data → Pages are generated from data → No manual page creation.

---

# 🧰 Tech Stack

* Astro latest
* TailwindCSS
* TypeScript
* JSON content store
* Node scripts for preprocessing
* Cloudflare Pages / Vercel deployment

Optional future:

* SQLite / Turso / Supabase

---

# 📁 Project Structure

```
/src
  /components
    LineCard.tsx
    WriterCard.tsx
    CategoryChip.tsx
    SearchBar.tsx
    RelatedGrid.tsx

  /layouts
    MainLayout.astro
    ContentLayout.astro

  /pages
    index.astro
    /writers/[writer].astro
    /category/[category].astro
    /line/[slug].astro
    /collection/[collection].astro

  /lib
    contentLoader.ts
    seo.ts
    relatedEngine.ts

/content
  poems.json
  writers.json
  collections.json

/scripts
  csv-to-json.ts
  generate-slugs.ts
```

---

# 🧩 Data Loading Layer

Create utility:

```
loadPoems()
loadWriters()
loadCollections()
```

Must:

* cache dataset
* support filtering
* support search indexing

---

# 🏗️ Route Generation Logic

Use `getStaticPaths()`.

### Individual Line Pages

Loop poems dataset:

```
return poems.map(p => ({
 params: { slug: p.slug },
 props: { poem: p }
}))
```

---

### Writer Pages

Group poems by writer.

Generate one page per writer.

---

### Category Pages

Flatten categories list.

Generate unique pages.

---

### Collection Pages

Collections defined manually OR via keyword engine.

---

# 🧠 Related Content Engine

Create utility:

```
getRelated(poem)
```

Logic priority:

1. same writer
2. same category
3. same mood
4. random fallback

Return 12 items.

---

# 🔎 Search System

Client side lightweight search.

Options:

* MiniSearch
* Fuse.js

Search index built at build time.

Hydrate only search component.

---

# 🎨 UI Rendering Rules

### Line Card

* max 3 lines preview
* subtle gradient hover
* copy icon

### Typography

* poem text large centered
* meaning smaller muted text

### Grid

Responsive:

* mobile → 1 column
* tablet → 2
* desktop → 4

---

# ⚡ Performance Constraints

* zero JS by default
* partial hydration only
* avoid heavy libraries
* preload critical fonts

Lighthouse targets:

* Performance > 95
* SEO > 95

---

# 📊 SEO Meta Engine

Create:

```
buildMeta(poem)
```

Must generate:

* title
* description
* canonical
* OG tags

Also:

Add JSON-LD structured data.

---

# 🗺️ Sitemap Generator

Node script:

```
generateSitemap()
```

Features:

* chunk after 40k URLs
* index sitemap.xml

---

# 🤖 Robots.txt

Allow:

```
/line/
/writer/
/category/
/collection/
```

Disallow:

```
/admin/
/scripts/
```

---

# 🔁 CSV Import Pipeline

Script:

```
csv-to-json.ts
```

Steps:

1. parse CSV
2. normalize text
3. slugify
4. tag categories
5. output poems.json

---

# 🚀 Deployment Flow

1. push repo
2. CI build Astro
3. deploy static bundle to CDN
4. ping sitemap to Google

---

# 📈 Scaling Strategy

### Phase 1

Dataset:

300 poems

### Phase 2

1000 poems

### Phase 3

5000 poems

### Phase 4

UGC + DB migration

---

# 🧠 Future Enhancements

* edge search API
* personalization
* trending engine
* language auto routing
* quote image generator

---

# 🏁 Engineering Success Metrics

* build time
* total generated pages
* bundle size
* TTFB
* crawl errors

---

END
