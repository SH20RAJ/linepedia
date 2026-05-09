import writers from '../data/writers.json';
import categories from '../data/categories.json';
import collections from '../data/collections.json';
import featuredPoemsData from '../data/featured-poems.json';
import posterIndex from '../data/poster-index.json';

// Define types for imported JSON data
interface Writer {
  name: string;
  slug: string;
  photo: string;
  bio: string;
  stats?: { poems: number };
}

interface Category {
  name: string;
  slug: string;
  description: string;
  seoIntro?: string;
  icon?: string;
}

interface Collection {
  name: string;
  slug: string;
  description: string;
  seoIntro?: string;
  tags?: string[];
}

interface FeaturedPoem {
  id: string;
  slug: string;
  content: string;
  writer: string;
}

// Type the imported data
const typedWriters = writers as Writer[];
const typedCategories = categories as Category[];
const typedCollections = collections as Collection[];
const typedFeaturedPoems = featuredPoemsData as FeaturedPoem[];
const typedPosterIndex = posterIndex as string[];

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BluredCodes/linespedia-data@main';

export interface Poem {
  id: string;
  slug: string;
  title: string;
  content: string;
  writer: string;
  category?: string[];
  meaning?: string;
  meta?: any;
}

export const getPoem = async (id: string): Promise<Poem | null> => {
  try {
    const res = await fetch(`${CDN_BASE}/poems/v1/${id}.json`);
    if (!res.ok) return null;
    return (await res.json()) as Poem;
  } catch (e) {
    console.error(`Failed to fetch poem ${id}`, e);
    return null;
  }
};

export const getPoemById = getPoem;

export const getPoemIdBySlug = async (slug: string): Promise<string | null> => {
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/slug-map.json`);
    if (!res.ok) return null;
    const slugMap = (await res.json()) as Record<string, string>;
    return slugMap[slug.toLowerCase()] || null;
  } catch (e) {
    return null;
  }
};

export const getAllWriters = async () => typedWriters;
export const getAllCategories = async () => typedCategories;
export const getAllCollections = async () => typedCollections;
export const getFeaturedPoems = async () => typedFeaturedPoems;

export const getWriterPoems = async (writerSlug: string): Promise<Poem[]> => {
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/writers/${writerSlug}.json`);
    if (!res.ok) return [];
    return (await res.json()) as Poem[];
  } catch (e) {
    return [];
  }
};

export const getCategoryPoems = async (categorySlug: string): Promise<Poem[]> => {
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/categories/${categorySlug}.json`);
    if (!res.ok) return [];
    return (await res.json()) as Poem[];
  } catch (e) {
    return [];
  }
};

export const getRelatedPoems = async (
  writerSlug: string,
  categorySlugs: string[] = []
): Promise<Poem[]> => {
  const related: Poem[] = [];

  const fromWriter = await getWriterPoems(writerSlug);
  related.push(...fromWriter.slice(0, 4));

  if (related.length < 6 && categorySlugs.length > 0) {
    const fromCat = await getCategoryPoems(categorySlugs[0]);
    related.push(...fromCat.slice(0, 6 - related.length));
  }

  return related;
};

export const hasPoster = (slug: string) => typedPosterIndex.includes(slug);
export const getPosterUrl = (slug: string) =>
  hasPoster(slug) ? `${CDN_BASE}/posters/v1/${slug}.png` : null;
export const getMetadataUrl = (file: string) => `${CDN_BASE}/metadata/v1/${file}`;

// Panchatantra
interface PanchatantraStory {
  title: string;
  slug: string;
  content: string;
  images?: string[];
  image?: string;
}

export const getPanchatantraStories = async (): Promise<
  (PanchatantraStory & { images: string[]; image: string | null })[]
> => {
  try {
    const res = await fetch(`${CDN_BASE}/panchtantra/v1/index.json`);
    if (!res.ok) return [];
    const stories = (await res.json()) as PanchatantraStory[];
    return stories.map((s) => ({
      ...s,
      images: (s.images || []).map((img: string) => `${CDN_BASE}/panchtantra/v1/images/${img}`),
      image:
        s.images && s.images.length > 0 ? `${CDN_BASE}/panchtantra/v1/images/${s.images[0]}` : null,
    })) as (PanchatantraStory & { images: string[]; image: string | null })[];
  } catch (e) {
    return [];
  }
};
// AllPoetry Resolver
export const getAllPoetryPoem = async (
  writerSlug: string,
  poemSlug: string
): Promise<Poem | null> => {
  try {
    const res = await fetch(`${CDN_BASE}/allpoetry/${writerSlug}/${poemSlug}.md`);
    if (!res.ok) return null;
    const text = await res.text();

    // Simple frontmatter parser
    const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) return null;

    const fmContent = fmMatch[1];
    const content = fmMatch[2].trim();

    const fm: any = {};
    fmContent.split('\n').forEach((line) => {
      const [key, ...val] = line.split(':');
      if (key && val)
        fm[key.trim()] = val
          .join(':')
          .trim()
          .replace(/^"(.*)"$/, '$1');
    });

    return {
      id: `ap-${writerSlug}-${poemSlug}`,
      slug: poemSlug,
      title: fm.title || 'Untitled',
      writer: fm.writer || writerSlug,
      content: content,
      category: fm.category ? fm.category.split(',').map((c: string) => c.trim()) : ['Poetry'],
      meaning: fm.meaning || '',
      meta: { source: 'AllPoetry', url: fm.url },
    };
  } catch (e) {
    return null;
  }
};

// AllPoetry pSEO Resolvers
export const getAllPoetryWriters = async () => {
  try {
    const res = await fetch(`${CDN_BASE}/automation/all-poems-metadata.json`);
    if (!res.ok) return [];
    const metadata = (await res.json()) as any[];
    const writersMap: Record<string, string> = {};
    metadata.forEach((m: any) => {
      const slug = m.writerSlug || m.writer?.toLowerCase().replace(/\s+/g, '-');
      if (slug) writersMap[slug] = m.writer;
    });
    return Object.entries(writersMap).map(([slug, name]) => ({
      slug,
      name,
      photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=128`,
    }));
  } catch (e) {
    return [];
  }
};

export const getPoetryWriterPoems = async (writerSlug: string): Promise<Poem[]> => {
  try {
    const res = await fetch(`${CDN_BASE}/automation/all-poems-metadata.json`);
    if (!res.ok) return [];
    const metadata = (await res.json()) as any[];
    return metadata
      .filter(
        (m: any) => (m.writerSlug || m.writer?.toLowerCase().replace(/\s+/g, '-')) === writerSlug
      )
      .map((m: any) => ({
        ...m,
        id: `ap-${writerSlug}-${m.slug}`,
        writerSlug: writerSlug,
        url: `/line/ap/${writerSlug}/${m.slug}/`,
      })) as Poem[];
  } catch (e) {
    return [];
  }
};
