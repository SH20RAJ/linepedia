import writers from '../data/writers.json';
import categories from '../data/categories.json';
import collections from '../data/collections.json';
import featuredPoemsData from '../data/featured-poems.json';

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
  
  // 1. Try to get 3 more from the same writer
  const fromWriter = await getWriterPoems(writerSlug);
  related.push(...fromWriter.slice(0, 4));

  // 2. Try to get some from categories if needed
  if (related.length < 6 && categorySlugs.length > 0) {
    const fromCat = await getCategoryPoems(categorySlugs[0]);
    related.push(...fromCat.slice(0, 6 - related.length));
  }

  return related;
};

export const getPosterUrl = (slug: string) => `${CDN_BASE}/posters/v1/${slug}.png`;
export const getMetadataUrl = (file: string) => `${CDN_BASE}/metadata/v1/${file}`;
