# 📝 Linespedia — Blog SEO Strategy & Implementation Plan

To dominate search results, Linespedia needs a blog that targets high-intent, long-tail keywords. This document outlines the SEO priority and implementation plan.

## 🚀 SEO Priorities

### 1. High-Intent Keyword Targeting
Focus on templates like:
- "Best [Category] [Language] [Platform]"
- Example: "Best Sad Hindi Shayari for Instagram Captions"
- Example: "Top 10 Romantic Urdu Lines for WhatsApp Status"

### 2. Content Pillars
1.  **Cultural Deep Dives**: History of Ghazals, origin of Shayari, famous poets' biographies.
2.  **Usage Guides**: How to choose the right line for a post, how to write your first couplet.
3.  **Top Lists**: "10 Best Sad Lines by Mirza Ghalib", "Top 5 Love Quotes from Shakespeare".

### 3. Technical SEO Implementation
- **Auto-Linking**: Blog posts should automatically link to relevant poems using the `slug`.
- **Structured Data**: `BlogPosting` and `FAQ` schema on every article.
- **Reading Time**: Explicitly shown for better engagement.
- **Table of Contents**: To win featured snippets for "listicle" queries.

---

## 🏗️ Implementation Phases

### Phase 1: Infrastructure (Wait for User Request)
- **[NEW]** `src/pages/blog/index.astro`: Grid of articles.
- **[NEW]** `src/pages/blog/[slug].astro`: Dynamic article page.
- **[NEW]** `src/content/blog/`: Directory for Markdown/MDX articles.

### Phase 2: Content Foundation
- **[CREATE]** 5 initial pillar posts (e.g., "The Power of Poetry: Why We Write").
- **[AUTOMATE]** RSS feed update to include blog posts.
- **[LINK]** Add "Blog" to the Footer and Navbar.

---

## 📅 Proposed Initial Topics
1.  **"2026 Best Shayari Trends: What's Hot on Instagram"**
2.  **"Mirza Ghalib vs. Allama Iqbal: A Poetic Comparison"**
3.  **"How to Use Linespedia to Grow Your Social Media Following"**
4.  **"English Classics 101: Why Poe Still Resonates Today"**

> [!IMPORTANT]
> The primary goal is internal linking—every blog post should lead back to the `line/[slug]` pages to boost their authority.
