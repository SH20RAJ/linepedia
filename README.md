# 🖋️ Linespedia.com — Programmatic SEO Poetry Engine

Linespedia is a high-performance, production-ready programmatic SEO website built with **Astro 6** and **Tailwind CSS**. It is designed to capture massive search traffic across thousands of poetic long-tail keywords (shayari, poems, quotes) through automated content ingestion and keyword multiplication.

## 🚀 Key Features

- **600+ Poetic Entries**: Automated ingestion from PoetryDB (129 authors) and IqbalAPI (Urdu Shayari).
- **Keyword Multiplier Strategy**: Dynamically generates collection pages for specific search intents (e.g., `sad-shayari-copy-paste`, `2-line-deep-lines`).
- **B&W Digital Posters**: Interactive feature allowing users to download beautified, Pinterest-optimized poem posters as high-DPI PNGs.
- **Advanced SEO Infrastructure**:
  - **JSON-LD Structured Data**: Automated FAQPage, CreativeWork, and Breadcrumb schema.
  - **Dynamic Sitemap & RSS**: Fully automated generation via Astro Integration.
  - **Internal Linking Engine**: "Poem of the Day" and "Trending Now" sections for maximum crawl depth.
- **Client-Side Magic**: Interactive Copy, Like, and Native Web Share functionality.

## 🛠️ Tech Stack

- **Framework**: [Astro 6](https://astro.build/) (Static Site Generation)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide Astro](https://lucide.dev/)
- **Data**: JSON-based content layer in `src/content/`
- **Deployment**: Optimized for [Cloudflare Pages](https://pages.cloudflare.com/)

## 📂 Project Structure

```text
├── src/
│   ├── components/       # Premium UI components (Poster, Cards, SEO)
│   ├── layouts/          # Base HTML layouts with SEO meta tags
│   ├── pages/            # Dynamic routing ([...slug].astro) for 600+ pages
│   └── content/          # JSON data store (Poetry, Writers, Categories)
├── scripts/              # Content ingestion & cleanup scripts
├── public/               # Static assets & SEO files (robots.txt, etc.)
└── astro.config.mjs      # Astro configuration & SEO integrations
```

## 🚥 Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Run Development Server
```bash
bun run dev
```

### 3. Fetch/Update Content
To append new poems from the API sources:
```bash
node scripts/fetch-poems.js
```

### 4. Build for Production
```bash
bun run build
```

## 📈 SEO Strategy

Linespedia uses a **Programmatic SEO** approach:
1. **Core Entities**: Writers, Categories, and Individual Lines.
2. **Intent Pairs**: Category + Use-case (e.g., "Love Shayari" + "Instagram Captions").
3. **Internal Linking**: Every page is within 3 clicks of the homepage to ensure 100% crawl coverage.
4. **Visual SEO**: B&W posters are designed to be indexed by Google Images and shared on Pinterest.

---

Built for speed, scale, and search dominance. 🚀
