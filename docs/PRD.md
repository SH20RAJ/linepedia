# 📄 Linepedia — Product Requirements Document (PRD)

## 🧭 Product Overview

**Product Name:** Linepedia
**Domain:** linespedia.com
**Category:** Programmatic SEO Content Platform
**Primary Goal:**
Build a massive-scale poetry / quotes / shayari / captions discovery website that ranks on Google and generates passive income via search traffic + ads.

**Core Philosophy:**

- Content scale > manual writing
- Ultra fast static pages
- Structured topical authority
- Infinite internal discovery loop
- Automation driven growth

---

## 🎯 Business Objectives

1. Rank for long-tail search queries in poetry / quotes niche
2. Achieve 100K+ monthly organic traffic within 6–9 months
3. Monetize via AdSense + affiliate + sponsorship
4. Build long-term SEO asset (10K–100K indexed pages)

---

## 👥 Target Users

- Students / young users searching emotional lines
- Instagram caption seekers
- Shayari lovers
- Literature readers
- WhatsApp / status content sharers

---

## 🔍 Search Intent Strategy

Target queries like:

- sad shayari copy paste
- 2 line deep quotes
- love captions short
- jaun elia sad poetry
- urdu lines for bio

Traffic strategy:

**Capture millions of long-tail keywords instead of competing for few head terms.**

---

## 🏗️ System Architecture

```
User → Google Search → Static Astro Pages → CDN → Ads + Internal Links → More Browsing
```

### Key Decisions

- Static Site Generation (SSG)
- Edge CDN hosting
- Programmatic route generation
- JSON / CSV based content database

---

## 🧰 Tech Stack

### Frontend / SEO Engine

- Astro (latest)
- TailwindCSS
- Minimal JS hydration
- Content Collections / JSON loader

### Infrastructure

- Cloudflare Pages / Vercel
- Custom Root Domain

### Data Layer

- JSON files initially
- CSV import pipeline
- Future: Headless CMS / DB

---

## 🗂️ Folder Architecture

```
/src
  /components
  /layouts
  /pages
  /data
  /utils
  /styles

/content
  poems.json
  writers.json
  categories.json
```

---

## 🧩 Database Schema

### poems.json

```
{
  id: string
  slug: string
  title: string
  content: string
  writer: string
  category: string[]
  mood: string[]
  language: string
  meaning: string
  createdAt: string
}
```

---

## 📄 Page Types

### 1. Homepage

**Goal:** Discovery + Search + Engagement

Sections:

- Hero search bar (centered)
- Trending categories grid
- Featured writers carousel
- Latest lines masonry grid
- Popular collections
- Infinite browse feed

**Visual Style:**

- Soft poetic gradient (cream → lavender)
- Large breathable whitespace
- Editorial minimal layout

---

### 2. Category Pages

Examples:

```
/sad-shayari
/love-quotes
/deep-lines
```

Features:

- SEO intro paragraph
- Filter chips (language / mood / length)
- Grid content listing
- Pagination / infinite scroll

---

### 3. Writer Pages

Examples:

```
/jaun-elia
/mirza-ghalib
```

Sections:

- Writer photo
- Biography
- Stats (number of lines)
- Tabs:
  - All
  - Sad
  - Love
  - Deep

Purpose: Build topical authority.

---

### 4. Individual Line Page (Core Ranking Unit)

Example:

```
/jaun-elia-sad-line-23
```

Design:

- Centered poetic typography
- Copy button
- Share buttons
- Meaning / explanation
- Writer mini profile
- Related lines grid
- Auto internal link clusters

Desktop:

- Sticky explore panel

Mobile:

- Scroll-focused reading experience

---

### 5. Collection Pages

Examples:

```
/2-line-sad-shayari
/instagram-deep-captions
```

Long SEO intro + curated grid.

These pages target **high-intent keywords.**

---

## 🧭 Navigation System

Top Navbar:

- Logo (Linepedia)
- Explore
- Writers
- Categories
- Collections
- Submit Line (future)

Mobile:

- Bottom tab navigation

---

## 🎨 Design Language

Theme:

**Modern Poetic Minimalism**

Colors:

- Primary → Deep Indigo
- Secondary → Soft Lavender
- Accent → Warm Gold

Typography:

- Headings → Elegant Serif
- Body → Clean Sans

Cards:

- Rounded XL
- Soft shadows
- Hover elevation

---

## ⚙️ Programmatic SEO Engine

Utility: `generateRoutes()`

Reads dataset and auto generates:

- Individual content pages
- Writer pages
- Category pages
- Mood pages
- Language pages
- Collection pages

---

## 🔗 Internal Linking System

Each page shows:

- Same writer lines
- Same category lines
- Trending lines
- Random discovery

Goal:

- Increase crawl depth
- Improve engagement
- Spread ranking power

---

## ⚡ Performance Rules

- Zero JS by default
- Hydrate only search
- Lazy load images
- CDN edge caching

Target:

**< 1s load time**

---

## 📊 SEO Infrastructure

- Dynamic sitemap generation
- Sitemap chunking after 50K URLs
- Robots.txt optimization
- Canonical tags
- Structured Data:
  - Article Schema
  - Breadcrumb Schema
  - WebSite Search Schema

---

## 📈 Content Scaling Strategy

### Phase 1 (0–30 days)

- Launch site
- Publish 300 pages
- Focus indexing

### Phase 2 (30–90 days)

- Reach 1000 pages
- Category dominance
- Early traffic (5K–20K)

### Phase 3 (3–6 months)

- 3000+ pages
- Backlinks
- Social distribution

### Phase 4 (6–12 months)

- 10K+ pages
- UGC system
- Automation pipeline

---

## 🧠 Content Production System

Pipeline:

1. Collect dataset (public domain + curated excerpts)
2. AI generates:
   - intro
   - explanation
   - metadata

3. CSV → JSON script
4. Static build → deploy

Target velocity:

**100–300 pages per deploy**

---

## 🌐 Off-Page Growth

- Pinterest quote cards automation
- Reddit emotional content seeding
- Blogger outreach backlinks
- Social sharing loops

---

## 💰 Monetization Plan

- Display ads (AdSense)
- Sticky footer ads
- Related content loops → pageview depth
- Affiliate poetry books (later)

Income milestones:

- 50K traffic → ₹8K–₹20K
- 200K traffic → ₹40K+

---

## 🚀 Long Term Vision

Linepedia becomes:

> **Search Traffic Infrastructure for Emotional Content**

Expansion:

- Lyrics
- Status captions
- Multi-language poetry
- User submissions
- API for quote apps

---

## 🏁 Success Metrics

- Indexed pages count
- Monthly organic sessions
- Pages per session
- Average ranking keywords
- Ad revenue

---

## 🧠 Core Ranking Formula

```
Content Scale × Internal Linking × Speed × Time × Backlinks
```

---

END OF PRD
