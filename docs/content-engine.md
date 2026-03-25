# ⚙️ Linepedia — content-engine.md

## Daily Automation Workflow

### 🎯 Goal

Publish **100–500 SEO pages/day** with minimal manual effort.

---

## Daily Workflow

### Step 1 — Source Intake

Add sources list:

* public domain poetry sites
* quotes APIs
* curated CSV datasets

---

### Step 2 — Run Ingestion

Command:

pnpm ingest

Pipeline:

* scrape / fetch
* normalize
* deduplicate
* tag mood / language

---

### Step 3 — SEO Enrichment

Auto generate:

* intro paragraph
* SEO title
* description
* keyword variants

---

### Step 4 — Slug Creation

Format:

writer-mood-uniqueid

Example:

jaun-elia-deep-line-221

---

### Step 5 — Dataset Update

Append to poems.json
Update collections.json

---

### Step 6 — Build + Deploy

pnpm build
Auto deploy to CDN

---

### Step 7 — Notify Google

Ping sitemap endpoint

---

## Weekly Tasks

* add new writers
* add new categories
* expand trending keywords

---

## Monthly Tasks

* prune low quality content
* refresh intro content
* improve internal linking rules

---

END
