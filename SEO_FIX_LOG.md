# SEO Fix Log: Blog Rendering, Quality, and Trust

Date: 2026-05-09
Project: Linespedia

## Scope Completed

This fix batch addressed blog-specific SEO and content quality defects:

- Raw JSX/template artifacts rendering in a blog post.
- Duplicate H1 risk from template H1 plus in-content H1.
- Unsupported statistical/guaranteed-style claims in generated blog copy.
- Missing consistency for blog article trust metadata (author/date/canonical/schema).
- Weak internal linking from blog detail pages to archive and content hubs.
- Lack of automated QA checks for blog rendering and SEO quality rules.

## Pipeline and Template Fixes

1. Markdown pipeline hardening
- Added a remark plugin to strip the first in-content H1 from blog markdown/MDX before render.
- Result: blog page keeps a single H1 from template while preserving body hierarchy.

2. Blog content schema improvements
- Added optional updatedDate to blog frontmatter schema.
- Added author default fallback (Linespedia Editorial) in content schema.

3. Blog detail template upgrades
- Added canonical URL wiring per article.
- Added article metadata pass-through (published/updated, author, section, tags).
- Added BlogPosting JSON-LD with accurate fields only:
  - headline
  - description
  - datePublished
  - dateModified
  - author
  - publisher
  - mainEntityOfPage
- Added visible intro lead from article description.
- Added stronger internal links block to:
  - /explore/
  - /collections/
  - /categories/
  - /writers/
  - /blog/
- Added related posts section based on shared tags/category scoring.

## Content Fixes

1. Raw JSX leak fixed
- Replaced the broken post content in transitional-hooks-for-social-media.md with clean Markdown.
- Removed JSX-style mapping/template constructs and inline event-handler artifacts.
- Reworked page with practical sections, do/don’t guidance, and internal links.

2. Unsupported claim cleanup at scale
- Removed repeated unsupported numeric/statistical boilerplate across generated posts:
  - "increase profile engagement by up to 40%"
  - "can triple your reach"
  - fabricated percentage trend tables
  - generated signature filler
- Replaced with neutral non-numeric phrasing.

3. Duplicate title collisions fixed
- Resolved duplicate blog title collisions for variant holiday slug files by making titles/descriptions unique.

## Validation and QA

1. Added blog QA script
- scripts/validate-blog-seo.js
- Checks include:
  - Multiple H1 in content body
  - Missing title
  - Missing description
  - Missing article date
  - Duplicate title/description
  - Thin body content
  - Raw JSX/code leakage patterns in rendered HTML
  - Unsupported numeric/guaranteed claim patterns
  - Canonical wiring presence
  - Author/editor attribution fallback presence

2. Added npm script
- validate:blog-seo -> node scripts/validate-blog-seo.js

3. Verification results
- Blog validator: PASS
- Build: PASS

## Notes

- "best" / "viral" terms are currently emitted as non-blocking warnings in validator for editorial review, not hard failures.
- No Review schema was introduced.
- No FAQ schema was added in this fix batch.

## Recent Changes (2026-05-09)

1. Sitemap index and allpoetry fixes
- File: src/pages/sitemap.xml.js
- File: src/pages/sitemap-allpoetry.xml.js
- Purpose: Removed `?lang=` query variants from the sitemap index and excluded thin or language-parameterized entries from the large allpoetry shard. Sitemap-allpoetry now only emits canonical English poem URLs and filters entries with empty/very-short content.

2. robots.txt adjustments
- File: public/robots.txt
- Purpose: Allowed `_astro` assets to ensure render-critical resources are crawlable and kept the canonical `Sitemap:` reference.

3. Local SEO audit script
- File: scripts/seo-audit-local.js
- Purpose: Local validation script to fetch `sitemap.xml`, iterate sitemaps and pages, and assert: reachable (200), presence of `<title>`, meta `description`, canonical link without query params, presence of an `H1`, body length threshold, and that no URLs in the sitemap are marked `noindex`.

### How to run
- Start your local dev server (e.g., `npm run dev` or `bun dev`).
- Run: `node scripts/seo-audit-local.js --url http://localhost:3000/sitemap.xml`

Timestamp: 2026-05-09
