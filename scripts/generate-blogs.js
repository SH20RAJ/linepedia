import fs from 'fs';
import path from 'path';

const BLOG_DIR = './src/content/blog';
const writers = JSON.parse(fs.readFileSync('./src/content/writers.json', 'utf-8'));
const categories = JSON.parse(fs.readFileSync('./src/content/categories.json', 'utf-8'));

function slugify(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

async function generate() {
    console.log('📝 Generating 20+ SEO Blogs...');
    
    if (fs.existsSync(BLOG_DIR)) fs.rmSync(BLOG_DIR, { recursive: true, force: true });
    fs.mkdirSync(BLOG_DIR, { recursive: true });

    const blogs = [];

    // 1. Writer Focus Blogs (10)
    for (const writer of writers.slice(0, 10)) {
        blogs.push({
            title: `The Timeless Legacy of ${writer.name}: A Deep Dive into Their Most Moving Lines`,
            description: `Explore the life and most famous poetic works of ${writer.name}. From classic verses to hidden gems, discover why their words still resonate.`,
            content: `
# The Timeless Legacy of ${writer.name}

${writer.name} is one of the most celebrated figures in the world of literature. Their contribution to the art of poetry has left an indelible mark on generations of readers and writers alike.

## Why ${writer.name} Matters Today

In an era of fast-paced digital communication, the structured beauty of ${writer.name}'s lines provides a much-needed sanctuary of reflection. Whether you are looking for solace in sorrow or celebration in joy, their work offers a mirror to the human soul.

### Exploring the Masterpieces

Many readers are familiar with the major works, but the true depth of ${writer.name} lies in the shorter lines—the sharp, poignant observations that capture a lifetime of experience in just a few words.

At Linespedia, we have curated the most comprehensive collection of ${writer.name}'s best lines, optimized for sharing and deep reading. [Explore the collection directly here](https://linespedia.com/${writer.slug}).

## Conclusion

Understanding the context behind the words of ${writer.name} allows us to appreciate the craft in its entirety. Stay tuned for more deep dives into the masters of verse.
            `,
            category: 'writers',
            author: 'Linespedia Editorial',
            date: new Date().toISOString()
        });
    }

    // 2. Category Focus Blogs (10)
    for (const cat of categories.slice(0, 10)) {
        blogs.push({
            title: `Top ${cat.name} Lines for Your Next Social Media Post (${new Date().getFullYear()})`,
            description: `Searching for the perfect ${cat.name} caption? Look no further. Here is our curated list of the most impactful lines for Instagram and WhatsApp.`,
            content: `
# 10+ Most Impactful ${cat.name} Lines for Instagram and WhatsApp

Sometimes, a single line can say more than a thousand-word letter. When it comes to ${cat.name.toLowerCase()}, the right words can make all the difference in how we connect with others.

## The Power of ${cat.name} in Modern Life

Expression is a core part of being human. In this guide, we explore why ${cat.name} remains one of the most searched and shared categories on Linespedia.

### Why These Lines Trend

Our data shows that readers favor lines that are:
1. **Short and Punchy**: Perfect for mobile screens.
2. **Relatable**: Touching on universal truths.
3. **Visually Stunning**: Ready to be turned into posters.

[Browse the full ${cat.name} collection on Linespedia](https://linespedia.com/${cat.slug}).

## How to Share Your Favorite Lines

We recommend using our **Digital Poster** feature to turn any text into a beautiful image for Pinterest or Google Images. It's the best way to ensure your favorite ${cat.name} quotes get the reach they deserve.
            `,
            category: 'trends',
            author: 'Linespedia Editorial',
            date: new Date().toISOString()
        });
    }

    // Write to files
    blogs.forEach(blog => {
        const slug = slugify(blog.title);
        const frontmatter = `---
title: "${blog.title}"
description: "${blog.description}"
pubDate: ${blog.date}
heroImage: "/posters/blog-placeholder.png"
category: "${blog.category}"
author: "${blog.author}"
---
`;
        fs.writeFileSync(path.join(BLOG_DIR, `${slug}.md`), frontmatter + blog.content);
    });

    console.log(`✅ Successfully generated ${blogs.length} SEO blogs.`);
}

generate();
