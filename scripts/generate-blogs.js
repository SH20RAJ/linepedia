import fs from 'fs';
import path from 'path';

const BLOG_DIR = './src/content/blog';
const WRITERS_FILE = './src/content/writers.json';
const CATEGORIES_FILE = './src/content/categories.json';

if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
}

const writers = JSON.parse(fs.readFileSync(WRITERS_FILE, 'utf-8'));
const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

function generateBlog(title, description, content, category, tags) {
    const slug = slugify(title);
    const pubDate = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0];
    const fileContent = `---
title: "${title}"
description: "${description}"
pubDate: "${pubDate}"
author: "Linespedia Editorial"
category: "${category}"
tags: ${JSON.stringify(tags)}
heroImage: "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?q=80&w=2573&auto=format&fit=crop"
---

${content}

## Related Explorations
If you enjoyed these insights, we invite you to explore more on Linespedia. We have curated thousands of lines from the world's most influential poets.

- [Browse all poets](/writers/)
- [Explore categories](/categories/)
- [Discover trending lines](/explore/)

At Linespedia, we believe every word has a story. Stay tuned for more deep dives into the world of literature and verse.
`;
    fs.writeFileSync(path.join(BLOG_DIR, `${slug}.md`), fileContent);
    console.log(`Generated blog: ${slug}`);
}

// 1. Generate Writer Spotlights (Top 15)
writers.slice(0, 15).forEach(writer => {
    const title = `The Timeless Legacy of ${writer.name}: A Deep Dive into Their Most Moving Lines`;
    const description = `Explore the profound impact of ${writer.name}'s poetry. From classic verses to hidden gems, discover the lines that defined a generation.`;
    const content = `
${writer.name} remains a titan of the literary world, a poet whose words continue to echo through the halls of history. In this spotlight, we take a closer look at the specific lines and themes that make ${writer.name}'s work so enduringly relevant.

### The Voice of an Era
Whether writing about the complexities of human emotion or the sheer beauty of the natural world, ${writer.name} had a unique ability to capture the essence of their subject. Their use of language was both revolutionary and deeply rooted in tradition, creating a style that is instantly recognizable and profoundly moving.

### Key Themes in ${writer.name}'s Work
A survey of ${writer.name}'s bibliography reveals a recurring fascination with themes of love, loss, and the search for meaning in an ever-changing world. It is this universal quality that allows their work to transcend its original context and speak directly to the hearts of modern readers.

We have curated a selection of ${writer.name}'s most impactful lines here on Linespedia. Each piece is accompanied by a modern interpretation and deep context to help you fully appreciate the genius of this legendary figures.

[Explore all lines by ${writer.name}](/${writer.slug}/)
`;
    generateBlog(title, description, content, 'Writers', [writer.slug, 'poetry', 'classic-literature']);
});

// 2. Generate Category Guides (Top 10)
categories.slice(0, 10).forEach(category => {
    const title = `Top ${category.name} Lines for Your Next Social Media Post (${new Date().getFullYear()})`;
    const description = `Looking for the perfect ${category.name} quote? Discover our curated list of the best lines and shayari for Instagram, WhatsApp, and more.`;
    const content = `
Finding the right words to express your feelings can be a challenge. That's why we've put together this comprehensive guide to the best ${category.name} lines available on Linespedia today.

### Why ${category.name} Poetry Resonates
There is something uniquely powerful about ${category.name} verse. It speaks to a part of the human experience that is often difficult to articulate, providing a bridge between our inner thoughts and the outside world.

### How to Use These Lines
Whether you're looking for a thoughtful Instagram caption, a poignant WhatsApp status, or a meaningful quote to include in a personal message, these selections are designed to make an impact. We recommend pairing these lines with a visual from our [Digital Posters](/${category.slug}/) collection for maximum engagement.

### Our Top Picks
1. **Classic Resonance**: Lines that have stood the test of time and continue to inspire.
2. **Modern Interpretations**: New perspectives on traditional themes.
3. **Hidden Gems**: Deep cuts from lesser-known works that offer a fresh take on ${category.name}.

Explore our full collection of [${category.name} lines](/${category.slug}/) to find the perfect match for your mood.
`;
    generateBlog(title, description, content, 'Categories', [category.slug, 'quotes', 'shayar']);
});

console.log('✅ Generated 25 blog posts!');
