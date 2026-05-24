# SEO Fixes — Linespedia

## What was fixed

### 1. Content Quality Guards (`src/lib/seo.ts`)
- Added `isIndexableAuthor()` — requires ≥3 lines for indexing
- Added `isIndexableCategory()` — requires ≥10 lines, + shayari-content ratio check for shayari-intent slugs
- Added `isIndexableLine()` — requires ≥15 chars of real content
- Added `isTopicalBlogPost()` — checks category/title/tags/slug against poetry/shayari/literature keywords
- Added `getRobotsForPage()` — unified helper returning `{indexable, robots}` for any page type
- Added `containsSouthAsianScript()`, `containsHinglish()`, `isHindiShayariContent()` — detect Hindi/Urdu/Hinglish content
- Added `SHAYARI_INTENT_SLUGS` set — all shayari keyword slugs that need content-intent verification

### 2. AI Widget (`src/components/AIPanel.astro`)
- Entire AI panel now renders a minimal SSR placeholder
- Full UI is built client-side via inline is:inline script
- Removed "Puter Poetic Insight", "Powered by Puter AI", "AI is thinking...", "Clear Conversation" from crawlable HTML
- Kept full functionality in browser

### 3. Noindex Logic (`src/pages/[...slug].astro`)
- Changed minimumItems from 1 for all types to:
  - Author pages: minimum 3 poems
  - Category/collection pages: minimum 10 items
  - Line pages: minimum 1 (unchanged)
- Empty/low-quality author pages now get noindex,follow
- Category pages with <10 items get noindex,follow

### 4. Category Relevance
- Added content-intent filtering for shayari-intent slugs
- Hindi/Urdu/Hinglish shayari content is now sorted first, English poems pushed down
- Category pages with <15% shayari content for shayari keywords get noindex,follow

### 5. Homepage SEO (`src/pages/index.astro`)
- Added "Popular Shayari & Poetry Collections" internal linking section
- Enhanced SEO content block with inline links to key categories
- Enriched H2 text to include all relevant keywords

### 6. Footer (`src/components/Footer.astro`)
- Expanded from 4 columns to 5
- Added "Shayari" column: Sad Shayari, Love Shayari, Attitude Shayari, Best Shayari, Emotional Shayari
- Added "Quotes & Captions" column: Life Quotes, Motivational Quotes, Instagram Captions, Quotes, Friendship Shayari

### 7. Removed Generic AI-Sounding Text
- Removed fallback boilerplate under "About this line"
- Removed generic fallbacks from poem cards and sidebars
- All poem cards render poem.content || "" — no fake text

### 8. Structured Data (`src/components/StructuredData.astro`)
- Added itemCount prop support
- CollectionPage schema includes numberOfItems and mainEntity (ItemList)

### 9. Blog Noindex
- 85+ off-topic blog posts already had noindex: true
- ~89 indexable posts are topically relevant

### 10. Sitemap (`src/pages/sitemap-seo.xml.js`)
- Already filters out noindex blog posts
- Blog entries use actual pubDate/updatedDate as lastmod

## Pages now indexable vs noindexed

| Page Type | Indexable | Noindexed |
|-----------|-----------|-----------|
| Homepage | Always | Never |
| Line/Poem pages | Has >=15 chars content | Empty/thin content |
| Author pages with >=3 poems | Yes | Authors with 0-2 poems |
| Category pages with >=10 items | Yes | Categories with <10 items |
| Shayari-intent with >=15% shayari | Yes | English-only shayari pages |
| Blog (topical) | Yes | Off-topic (AI prompts, slang, career) |
| Static pages (About, Privacy) | Always | Never |
| Search/Explore pages | Yes | Search query params |
| Translation pages (non-English) | No | Already handled |
| Empty/404 redirected | No | Auto-redirects to /404/ |

## Sitemap behavior

- sitemap.xml (index) references 8 child sitemaps
- sitemap-seo.xml filters out noindex:true posts
- sitemap-poems.xml static poem URLs
- sitemap-allpoetry.xml 5 shards
- sitemap-stories.xml Panchatantra stories

## robots.txt behavior

- Allows: /, /line/, /writers/, /categories/, /collections/, /explore/, /blog/, etc.
- Disallows: /admin/, /scripts/, /likes/
- Blocks query-param crawl traps
- Points to sitemap.xml

## Content quality rules

- Author page: >=3 meaningful lines → index
- Category page: >=10 items + shayari-intent check → index
- Line page: >=15 character unique content → index
- Blog: must be about poetry/shayari/quotes/literature/writing → index
- AI panel: client-side only, no crawlable SEO content
- No generic/fallback filler text in crawlable HTML

## Remaining manual tasks for Google Search Console

1. Submit sitemap in GSC at https://search.google.com/search-console
2. Inspect important URLs (/, /sad-shayari/, /love-shayari/, etc.)
3. Check Coverage / Page Indexing report
4. Track queries and CTR
5. Build backlinks (Product Hunt, Indie Hackers, Reddit, Pinterest)
6. Monitor ranking for key terms

## Files changed

- src/lib/seo.ts — Content quality guards, Hindi/Urdu detection, getRobotsForPage()
- src/components/AIPanel.astro — Complete rewrite: client-side only
- src/components/Footer.astro — Added Shayari + Quotes footer columns
- src/components/StructuredData.astro — Added itemCount, ItemList support
- src/pages/[...slug].astro — Noindex thresholds, shayari sorting, removed generic fallback text
- src/pages/index.astro — Popular keyword page section, inline links
- src/pages/ap/[...page].astro — Removed generic fallback content text
