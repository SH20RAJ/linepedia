# 🏗️ Linepedia — infra-scale.md

## Handling 100k+ Pages

### 🎯 Goal

Ensure Astro site remains fast + buildable + crawlable at massive scale.

---

## Static Build Strategy

* Split content into chunks
* Use incremental builds (CI caching)
* Parallel route generation

---

## Sitemap Scaling

* chunk sitemap every 40k URLs
* create sitemap index

Example:

sitemap-1.xml
sitemap-2.xml

---

## CDN Strategy

* Deploy on Cloudflare Pages
* Enable edge caching
* set long cache TTL

---

## Data Strategy

Phase 1:

JSON files

Phase 2:

Move to:

* SQLite / Turso
* or static DB snapshots

---

## Memory Safety

* stream large datasets
* avoid loading all content in memory

---

## Search Scaling

* prebuild MiniSearch index
* shard index per category

---

## Build Time Optimization

* cache transformed datasets
* only rebuild changed routes

---

## Crawl Budget Optimization

* prioritize important pages
* reduce duplicate tag pages

---

END
