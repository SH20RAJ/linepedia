import writers from '../data/writers.json';
import categories from '../data/categories.json';
import collections from '../data/collections.json';
import featuredPoemsData from '../data/featured-poems.json';
import posterIndex from '../data/poster-index.json';

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
    return await res.json();
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
    const slugMap = await res.json();
    return slugMap[slug] || null;
  } catch (e) {
    return null;
  }
};

export const getAllWriters = async () => writers;
export const getAllCategories = async () => categories;
export const getAllCollections = async () => collections;
export const getFeaturedPoems = async () => featuredPoemsData;

export const getWriterPoems = async (writerSlug: string) => {
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/writers/${writerSlug}.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

export const getCategoryPoems = async (categorySlug: string) => {
  try {
    const res = await fetch(`${CDN_BASE}/metadata/v1/categories/${categorySlug}.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
};

export const getRelatedPoems = async (writerSlug: string, categorySlugs: string[] = []) => {
  const related: any[] = [];
  
  const fromWriter = await getWriterPoems(writerSlug);
  related.push(...fromWriter.slice(0, 4));

  if (related.length < 6 && categorySlugs.length > 0) {
    const fromCat = await getCategoryPoems(categorySlugs[0]);
    related.push(...fromCat.slice(0, 6 - related.length));
  }

  return related;
};

export const hasPoster = (slug: string) => posterIndex.includes(slug);
export const getPosterUrl = (slug: string) => hasPoster(slug) ? `${CDN_BASE}/posters/v1/${slug}.png` : null;
export const getMetadataUrl = (file: string) => `${CDN_BASE}/metadata/v1/${file}`;

// Panchatantra
export const getPanchatantraStories = async () => {
  try {
    const res = await fetch(`${CDN_BASE}/panchtantra/v1/index.json`);
    if (!res.ok) return [];
    const stories = await res.json();
    return stories.map((s: any) => ({
      ...s,
      images: (s.images || []).map((img: string) => `${CDN_BASE}/panchtantra/v1/images/${img}`),
      image: s.images && s.images.length > 0 ? `${CDN_BASE}/panchtantra/v1/images/${s.images[0]}` : null
    }));
  } catch (e) {
    return [];
  }
};
