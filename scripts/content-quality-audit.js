#!/usr/bin/env node
/**
 * Content Quality Audit Script
 * Scans blog posts and reports thin, duplicate, or off-topic content.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BLOG_DIR = 'src/content/blog';

const OFF_TOPIC_CATEGORIES = [
  'ai_prompts', 'instagram_bios', 'slang', 'career_templates',
  'social_media_tips', 'interview_questions'
];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  match[1].split('\n').forEach(line => {
    const [key, ...val] = line.split(':');
    if (key && val.length) {
      fm[key.trim()] = val.join(':').trim().replace(/^['"]|['"]$/g, '');
    }
  });
  return fm;
}

const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

let stats = {
  total: files.length,
  noindex: 0,
  offTopic: 0,
  thin: 0,
  missingAuthor: 0,
  duplicate: 0,
};

const titles = [];
const issues = [];

for (const file of files) {
  const content = readFileSync(join(BLOG_DIR, file), 'utf-8');
  const fm = parseFrontmatter(content);
  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();

  if (fm.noindex === 'true') stats.noindex++;

  if (OFF_TOPIC_CATEGORIES.includes(fm.category)) {
    stats.offTopic++;
    issues.push(`[OFF-TOPIC] ${file} — category: ${fm.category}`);
  }

  if (body.length < 500) {
    stats.thin++;
    issues.push(`[THIN] ${file} — ${body.length} chars`);
  }

  if (!fm.author || fm.author === '') {
    stats.missingAuthor++;
    issues.push(`[NO-AUTHOR] ${file}`);
  }

  if (titles.includes(fm.title)) {
    stats.duplicate++;
    issues.push(`[DUPLICATE-TITLE] ${file}`);
  }
  titles.push(fm.title);
}

console.log('\n=== Content Quality Audit ===');
console.log(`Total posts: ${stats.total}`);
console.log(`Noindex: ${stats.noindex}`);
console.log(`Off-topic: ${stats.offTopic}`);
console.log(`Thin (<500 chars): ${stats.thin}`);
console.log(`Missing author: ${stats.missingAuthor}`);
console.log(`Duplicate titles: ${stats.duplicate}`);

if (issues.length) {
  console.log('\n=== Issues ===');
  issues.forEach(i => console.log(i));
}

process.exit(issues.length > 0 ? 1 : 0);
