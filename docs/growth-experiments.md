# Growth Experiments & Playbook

## Search Console Monitoring

### Weekly Checks
1. **Performance > Queries**: Identify rising/falling keywords
2. **Performance > Pages**: Find pages with high impressions but low CTR (optimize titles/descriptions)
3. **Coverage > Indexed pages**: Monitor indexation rate, watch for excluded pages
4. **Core Web Vitals**: Check LCP, FID/INP, CLS trends

### Key Metrics to Track
- Total clicks and impressions trend
- Average CTR by page type (poem, blog, category, writer)
- Top 20 queries driving traffic
- Pages with >100 impressions but <1% CTR (title/description optimization targets)

## Weekly Keyword Expansion Workflow

1. Go to Search Console > Performance > Queries
2. Filter for queries with impressions > 10 but clicks < 5
3. These are "opportunity keywords" — content exists but isn't ranking well
4. For each opportunity:
   - Check if existing content covers the topic
   - If yes: improve the page (add content, better title, internal links)
   - If no: create new content targeting that keyword
5. Track improvements weekly

## Pinterest Posting Workflow

1. **Create posters** for top-performing poems using the poster generator
2. **Pin format**: 1000x1500px (2:3 ratio) performs best on Pinterest
3. **Board strategy**:
   - "Sad Shayari & Poetry"
   - "Love Quotes & Captions"
   - "Deep Lines & Wisdom"
   - "Urdu Poetry"
   - "Instagram Captions"
4. **Pin description**: Include the poem text + "Source: Linespedia" + relevant hashtags
5. **Frequency**: 3-5 pins per day, staggered across boards
6. **Link**: Each pin links back to the specific poem page on Linespedia

## Backlink Outreach Targets

### Poetry & Literature Sites
- Poetry Foundation (poetryfoundation.org)
- Poets.org (Academy of American Poets)
- Poetry Society (poetrysociety.org.uk)
- AllPoetry (allpoetry.com)
- Hello Poetry (hellopoetry.com)

### Education & Reference
- Poem Analysis (poemanalysis.com)
- Litcharts (litcharts.com)
- GradeSaver (gradesaver.com)

### Indian/South Asian Poetry
- Rekhta (rekhta.org) — partnership/mention
- Kavita (kavita.co.in)
- Hindi Poetry platforms

### Outreach Template
```
Subject: Poetry Resource Addition — Linespedia

Hi [Name],

I run Linespedia, a curated poetry archive focused on shayari, quotes, and poetic lines with meanings and context.

I noticed your [resource/page about X] and thought our [specific collection/page] would be a valuable addition for your readers.

[Link to relevant Linespedia page]

Would you consider adding it as a reference? Happy to discuss any collaboration opportunities.

Best,
[Name]
```

## Content Pruning Process

### Monthly Review
1. Run `node scripts/content-quality-audit.js`
2. Review pages flagged as:
   - **Thin** (<500 chars body): Either expand with meaningful content or noindex
   - **Duplicate titles**: Merge or differentiate
   - **Missing author**: Add attribution
   - **Off-topic**: Noindex or redirect to relevant content
3. Check Search Console for pages with 0 impressions in 6 months:
   - If the page has unique value: improve and resubmit
   - If the page is redundant: noindex or redirect
4. Run `node scripts/seo-qa.js` after changes

## Revenue Growth Roadmap

### Phase 1: Foundation (Current)
- [x] API endpoints for developers
- [x] Poster gallery and download flow
- [x] Sponsor/advertise page
- [x] Blog content cleanup (noindex spam)

### Phase 2: Traffic Growth
- [ ] Submit key pages to Google Search Console for indexing
- [ ] Pinterest poster posting workflow (manual → semi-automated)
- [ ] Backlink outreach to 20 poetry/education sites
- [ ] Publish 3-5 pillar blog posts monthly

### Phase 3: Monetization
- [ ] AdSense optimization (after 10k monthly sessions)
- [ ] API access with key management
- [ ] Newsletter sponsorship outreach
- [ ] Affiliate partnerships (poetry books, writing tools)

### Phase 4: Scale
- [ ] UGC submission flow with moderation
- [ ] Embeddable "Quote of the Day" widget
- [ ] Premium API tier with rate limiting
- [ ] Poetry translation expansion (server-side)
