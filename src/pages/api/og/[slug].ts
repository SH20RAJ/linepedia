interface Poem {
  id: string;
  slug: string;
  title: string;
  content: string;
  writer: string;
  category?: string[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Fetch poem data from CDN
  const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BluredCodes/linespedia-data@main';
  let poem: Poem | null = null;

  try {
    if (slug.startsWith('ap-')) {
      const parts = slug.split('-');
      if (parts.length >= 4) {
        const writerSlug = parts.slice(1, -1).join('-');
        const poemSlug = parts[parts.length - 1];
        const res = await fetch(`${CDN_BASE}/allpoetry/${writerSlug}/${poemSlug}.md`);
        if (res.ok) {
          const text = await res.text();
          const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
          if (fmMatch) {
            const fmContent = fmMatch[1];
            const content = fmMatch[2].trim();
            const fm: Record<string, string> = {};
            fmContent.split('\n').forEach((line) => {
              const [key, ...val] = line.split(':');
              if (key && val)
                fm[key.trim()] = val
                  .join(':')
                  .trim()
                  .replace(/^"(.*)"$/, '$1');
            });
            poem = {
              id: slug,
              slug: poemSlug,
              title: fm.title || 'Untitled',
              content,
              writer: fm.writer || writerSlug,
              category: fm.category ? fm.category.split(',').map((c) => c.trim()) : ['Poetry'],
            };
          }
        }
      }
    } else {
      const res = await fetch(`${CDN_BASE}/poems/v1/${slug}.json`);
      if (res.ok) {
        poem = await res.json();
      }
    }
  } catch (e) {
    return new Response('Poem not found', { status: 404 });
  }

  if (!poem) {
    return new Response('Poem not found', { status: 404 });
  }

  const writerName = poem.writer;

  // Prepare text
  const lines = poem.content.split('\n').filter((line) => line.trim());
  const maxLines = 8;
  const displayedLines = lines.slice(0, maxLines);
  const textContent = displayedLines.join('&#10;');
  const moreText = lines.length > maxLines ? '...' : '';

  const escapeSvg = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const contentEscaped = escapeSvg(textContent) + moreText;
  const writerEscaped = escapeSvg(writerName);

  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fdfcf7;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f3f4ff;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <circle cx="1000" cy="100" r="200" fill="#6366f1" opacity="0.05"/>
      <circle cx="200" cy="530" r="150" fill="#f59e0b" opacity="0.05"/>
      
      <text x="60" y="80" font-family="'Playfair Display', serif" font-size="48" font-weight="900" fill="#1e1b4b">
        Linespedia
      </text>
      <text x="60" y="120" font-family="'Inter', sans-serif" font-size="18" fill="#1e1b4b60">
        Poetry for the Soul
      </text>
      
      <clipPath id="textClip">
        <rect x="80" y="180" width="1040" height="350"/>
      </clipPath>
      
      <g clip-path="url(#textClip)">
        <text x="80" y="280" font-family="'Playfair Display', serif" font-size="42" font-weight="700" fill="#1e1b4b" line-height="1.4">
          ${contentEscaped}
        </text>
      </g>
      
      <text x="60" y="580" font-family="'Inter', sans-serif" font-size="24" fill="#1e1b4b70">
        — ${writerEscaped}
      </text>
      
      <text x="1140" y="600" font-family="'Inter', sans-serif" font-size="18" fill="#1e1b4b40" text-anchor="end">
        linespedia.com
      </text>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
