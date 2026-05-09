import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const BLOG_DIR = path.resolve('src/content/blog');
const BLOG_TEMPLATE = path.resolve('src/pages/blog/[slug].astro');

const RAW_CODE_PATTERNS = [
  /className=/i,
  /useState\(/i,
  /export\s+default/i,
  /<>/i,
  /\{posts\.map/i,
  /<\/div>/i,
  /&lt;\/div&gt;/i,
];

const UNSUPPORTED_CLAIM_PATTERNS = [
  /increase\s+profile\s+engagement\s+by\s+up\s+to\s+\d+%/i,
  /up\s+to\s+\d+%/i,
  /\b\d+%\b/i,
  /\bguaranteed\b/i,
  /\brank\s*#?1\b/i,
  /\bproven\b/i,
];

const SOFT_CLAIM_PATTERNS = [/\bviral\b/i, /\bbest\b/i];

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) {
    return { frontmatter: '', body: raw, data: {} };
  }

  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    return { frontmatter: '', body: raw, data: {} };
  }

  const frontmatter = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).trim();
  const data = {};

  for (const line of frontmatter.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.+)$/);
    if (!match) continue;

    const [, key, value] = match;
    data[key] = value.trim().replace(/^['\"]|['\"]$/g, '');
  }

  return { frontmatter, body, data };
}

function countMatches(content, regex) {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const matcher = new RegExp(regex.source, flags);
  return (content.match(matcher) || []).length;
}

async function run() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.error('Blog directory not found:', BLOG_DIR);
    process.exit(1);
  }

  const template = fs.readFileSync(BLOG_TEMPLATE, 'utf-8');
  const hasCanonicalWiring = template.includes('canonicalURL={canonicalURL}');
  const hasAuthorAttribution = template.includes('post.data.author ||') || template.includes('post.data.author ||');

  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith('.md'));
  const titleMap = new Map();
  const descriptionMap = new Map();

  const hardIssues = [];
  const softIssues = [];

  for (const file of files) {
    const absolute = path.join(BLOG_DIR, file);
    const raw = fs.readFileSync(absolute, 'utf-8');
    const { body, data } = parseFrontmatter(raw);
    const renderedHtml = await marked.parse(body);

    const h1Count = countMatches(body, /^#\s+/gm);
    const wordCount = body
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean).length;

    if (!data.title) {
      hardIssues.push(`${file}: missing frontmatter title`);
    }

    if (!data.description) {
      hardIssues.push(`${file}: missing frontmatter description`);
    }

    if (!data.pubDate) {
      hardIssues.push(`${file}: missing frontmatter pubDate`);
    }

    if (h1Count > 1) {
      hardIssues.push(`${file}: multiple H1 headings in content body (${h1Count})`);
    }

    if (wordCount < 120) {
      hardIssues.push(`${file}: thin body content (${wordCount} words)`);
    }

    for (const pattern of RAW_CODE_PATTERNS) {
      if (pattern.test(renderedHtml)) {
        hardIssues.push(`${file}: rendered HTML contains suspicious code pattern (${pattern})`);
      }
    }

    for (const pattern of UNSUPPORTED_CLAIM_PATTERNS) {
      if (pattern.test(body)) {
        hardIssues.push(`${file}: unsupported claim detected (${pattern})`);
      }
    }

    for (const pattern of SOFT_CLAIM_PATTERNS) {
      if (pattern.test(data.title || '') || pattern.test(data.description || '')) {
        softIssues.push(`${file}: review marketing superlative in title/description (${pattern})`);
      }
    }

    const titleKey = (data.title || '').toLowerCase();
    const descriptionKey = (data.description || '').toLowerCase();

    if (titleKey) {
      const existing = titleMap.get(titleKey);
      if (existing) {
        hardIssues.push(`${file}: duplicate title (also in ${existing})`);
      } else {
        titleMap.set(titleKey, file);
      }
    }

    if (descriptionKey) {
      const existing = descriptionMap.get(descriptionKey);
      if (existing) {
        hardIssues.push(`${file}: duplicate description (also in ${existing})`);
      } else {
        descriptionMap.set(descriptionKey, file);
      }
    }
  }

  if (!hasCanonicalWiring) {
    hardIssues.push('Blog template missing canonical URL wiring');
  }

  if (!hasAuthorAttribution) {
    hardIssues.push('Blog template missing author/editor attribution fallback');
  }

  if (hardIssues.length) {
    console.error('\nBlog SEO validation failed:\n');
    for (const issue of hardIssues) {
      console.error(`- ${issue}`);
    }

    if (softIssues.length) {
      console.error('\nAdditional review warnings:\n');
      for (const issue of softIssues.slice(0, 30)) {
        console.error(`- ${issue}`);
      }
    }

    process.exit(1);
  }

  console.log('Blog SEO validation passed.');

  if (softIssues.length) {
    console.log('\nReview warnings (non-blocking):');
    for (const issue of softIssues.slice(0, 30)) {
      console.log(`- ${issue}`);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
