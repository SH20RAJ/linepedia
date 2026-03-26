import fs from 'fs';
import path from 'path';

const KEYWORDS_FILE = './scripts/keywords.json';
const BLOG_DIR = './src/content/blog';

if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

const keywordsData = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));

function generateSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getTemplate(category, title) {
    const date = new Date().toISOString();
    let content = `---
title: "${title}"
description: "Discover the best ${title.toLowerCase()} for your social media, career, and daily life. Curated for 2026."
pubDate: "${date}"
heroImage: "/placeholder.png"
category: "${category}"
tags: ["${category}", "guide", "2026"]
---

# ${title}

Welcome to our comprehensive guide on **${title}**. In today's digital world, having the right words at your fingertips is essential for success, whether you're building a personal brand, crafting a resume, or just staying up-to-date with the latest trends.

## Why this matters in 2026?
As we move further into a digital-first era, the way we communicate has evolved. From AI-driven prompts to Gen-Z slang, staying relevant means being informed.

## Key Highlights
- **Curated Selection**: Only the highest quality content.
- **SEO Optimized**: Designed to help you rank and be found.
- **Easy to Use**: Copy-paste ready for your convenience.

`;

    // Category-specific additions
    if (category === 'instagram_bios') {
        content += `
## Top Bio Ideas
1. ✨ Living my best life in 2026.
2. 🚀 Building the future, one line at a time.
3. 🎨 Creative soul with a nomadic heart.
4. 🍵 Just another tea-drinker with big dreams.
5. 🛡️ Protecting my energy and my peace.

## Pro Tip
Keep your bio concise (under 150 characters) and use relevant emojis to express your personality!
`;
    } else if (category === 'quotes') {
        content += `
## Inspiring Quotes
> "The only way to do great work is to love what you do." — Steve Jobs
> "Innovation distinguishes between a leader and a follower."
> "Success is not final, failure is not fatal: it is the courage to continue that counts."

## Reflection
Take a moment each day to meditate on these lines. Poetic wisdom is the fuel for a creative mind.
`;
    } else if (category === 'career_templates') {
        content += `
## Sample Template
**Subject:** [Your Purpose] - [Your Name]

Dear [Name],

I am writing to you regarding... [Insert professional content here].

Sincerely,
[Your Name]

## Best Practices
Always proofread your work and ensure your tone matches the company culture you are applying to.
`;
    } else {
        content += `
## Detailed Breakdown
This section explore the nuances of ${title}. Whether you're looking for meanings, interview answers, or festival greetings, we've got you covered.

### Next Steps
Explore our [Full Collection](/) for more poetic and professional inspiration.
`;
    }

    return content;
}

async function main() {
    let count = 0;
    for (const [category, titles] of Object.entries(keywordsData)) {
        for (const title of titles) {
            const slug = generateSlug(title);
            const filePath = path.join(BLOG_DIR, `${slug}.md`);
            
            if (!fs.existsSync(filePath)) {
                const content = getTemplate(category, title);
                fs.writeFileSync(filePath, content);
                console.log(`Generated: ${slug}.md`);
                count++;
            }
        }
    }
    console.log(`✅ Success! Generated ${count} new articles.`);
}

main().catch(console.error);
