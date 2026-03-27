import { getAllCategories, getAllWriters, getCategoryPoems } from '../lib/cdn';

export type SeoIntent =
  | 'best-lines'
  | 'short-lines'
  | 'instagram-captions'
  | 'whatsapp-status'
  | 'deep-quotes'
  | 'heart-touching-lines'
  | 'romantic-captions'
  | 'one-line-status'
  | 'long-poetry'
  | 'classic-verses';

export interface SeoCombo {
  categorySlug: string;
  categoryName: string;
  writerSlug: string;
  writerName: string;
  poemCount: number;
}

const INTENTS: SeoIntent[] = [
  'best-lines',
  'short-lines',
  'instagram-captions',
  'whatsapp-status',
  'deep-quotes',
  'heart-touching-lines',
  'romantic-captions',
  'one-line-status',
  'long-poetry',
  'classic-verses',
];

let comboCache: SeoCombo[] | null = null;

function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function isSeoIntent(intent: string): intent is SeoIntent {
  return INTENTS.includes(intent as SeoIntent);
}

export function getSeoIntents(): SeoIntent[] {
  return INTENTS;
}

export function getIntentLabel(intent: SeoIntent): string {
  if (intent === 'best-lines') return 'Best Lines';
  if (intent === 'short-lines') return 'Short Lines';
  if (intent === 'instagram-captions') return 'Instagram Captions';
  if (intent === 'whatsapp-status') return 'WhatsApp Status';
  if (intent === 'deep-quotes') return 'Deep Quotes';
  if (intent === 'heart-touching-lines') return 'Heart Touching Lines';
  if (intent === 'romantic-captions') return 'Romantic Captions';
  if (intent === 'one-line-status') return 'One Line Status';
  if (intent === 'long-poetry') return 'Long Poetry';
  return 'Classic Verses';
}

export async function getSeoCombos(): Promise<SeoCombo[]> {
  if (comboCache) return comboCache;

  const [categories, writers] = await Promise.all([getAllCategories(), getAllWriters()]);
  const writerNameBySlug = new Map<string, string>();

  for (const writer of writers as any[]) {
    writerNameBySlug.set(writer.slug, writer.name);
  }

  const combos: SeoCombo[] = [];

  for (const category of categories as any[]) {
    const poems = await getCategoryPoems(category.slug);
    const writerCounts = new Map<string, number>();

    for (const poem of poems as any[]) {
      const writerSlug = String(poem.writer || '').trim();
      if (!writerSlug) continue;
      writerCounts.set(writerSlug, (writerCounts.get(writerSlug) || 0) + 1);
    }

    for (const [writerSlug, count] of writerCounts.entries()) {
      if (count < 2) continue;

      combos.push({
        categorySlug: category.slug,
        categoryName: category.name,
        writerSlug,
        writerName: writerNameBySlug.get(writerSlug) || titleCaseSlug(writerSlug),
        poemCount: count,
      });
    }
  }

  combos.sort((a, b) => b.poemCount - a.poemCount || a.categorySlug.localeCompare(b.categorySlug));
  comboCache = combos;
  return combos;
}

export async function findSeoCombo(categorySlug: string, writerSlug: string): Promise<SeoCombo | null> {
  const combos = await getSeoCombos();
  return combos.find((combo) => combo.categorySlug === categorySlug && combo.writerSlug === writerSlug) || null;
}

function firstLine(content: string): string {
  const line = String(content || '').split('\n')[0] || '';
  return line.trim();
}

export function pickIntentPoems(poems: any[], intent: SeoIntent): any[] {
  if (intent === 'short-lines') {
    return [...poems]
      .sort((a, b) => firstLine(a.content).length - firstLine(b.content).length)
      .slice(0, 60);
  }

  if (intent === 'instagram-captions') {
    return poems
      .filter((poem) => {
        const len = firstLine(poem.content).length;
        return len >= 25 && len <= 140;
      })
      .slice(0, 60);
  }

  if (intent === 'whatsapp-status') {
    return poems
      .filter((poem) => firstLine(poem.content).length <= 120)
      .slice(0, 60);
  }

  if (intent === 'deep-quotes') {
    const longer = poems.filter((poem) => firstLine(poem.content).length >= 80);
    if (longer.length > 0) return longer.slice(0, 60);
    return poems.slice(0, 60);
  }

  if (intent === 'heart-touching-lines') {
    return poems
      .filter((poem) => firstLine(poem.content).length >= 45)
      .slice(0, 60);
  }

  if (intent === 'romantic-captions') {
    return poems
      .filter((poem) => {
        const len = firstLine(poem.content).length;
        return len >= 35 && len <= 160;
      })
      .slice(0, 60);
  }

  if (intent === 'one-line-status') {
    return poems
      .filter((poem) => {
        const line = firstLine(poem.content);
        return line.length <= 90 && !line.includes('  ');
      })
      .slice(0, 60);
  }

  if (intent === 'long-poetry') {
    const longer = poems.filter((poem) => firstLine(poem.content).length >= 140);
    if (longer.length > 0) return longer.slice(0, 60);
    return poems.slice(0, 60);
  }

  if (intent === 'classic-verses') {
    return [...poems].sort((a, b) => String(a.slug).localeCompare(String(b.slug))).slice(0, 80);
  }

  return poems.slice(0, 80);
}

export async function getSeoUrls(site: string): Promise<string[]> {
  const combos = await getSeoCombos();
  const base = site.endsWith('/') ? site : `${site}/`;
  const urls: string[] = [`${base}seo/`];

  for (const combo of combos) {
    for (const intent of INTENTS) {
      urls.push(`${base}seo/${combo.categorySlug}/${combo.writerSlug}/${intent}/`);
    }
  }

  return urls;
}
