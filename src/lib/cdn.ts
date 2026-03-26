export const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BluredCodes/linespedia-data@main';

export async function fetchMetadata(file: string) {
    try {
        const res = await fetch(`${CDN_BASE}/metadata/v1/${file}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error(`Error fetching metadata ${file}:`, e);
        return [];
    }
}

export async function getPoemById(id: string) {
    try {
        const res = await fetch(`${CDN_BASE}/poems/v1/${id}.json`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(`Error fetching poem ${id}:`, e);
        return null;
    }
}

export async function getSlugMap() {
    return await fetchMetadata('slug-map.json');
}

export async function getFeaturedPoems() {
    return await fetchMetadata('featured-poems.json');
}

export async function getAllWriters() {
    return await fetchMetadata('writers.json');
}

export async function getAllCategories() {
    return await fetchMetadata('categories.json');
}

export async function getAllCollections() {
    return await fetchMetadata('collections.json');
}

export function getPosterUrl(slug: string) {
    return `${CDN_BASE}/posters/v1/${slug}.png`;
}
