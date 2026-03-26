import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Quote, Loader2 } from 'lucide-react';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/BluredCodes/linespedia-data@main';

export default function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [slugMap, setSlugMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    
    useEffect(() => {
        async function loadIndex() {
            try {
                const res = await fetch(`${CDN_BASE}/metadata/v1/slug-map.json`);
                if (res.ok) {
                    setSlugMap(await res.json());
                }
            } catch (e) {
                console.error('Failed to load search index', e);
            } finally {
                setLoading(false);
            }
        }
        loadIndex();
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setSearching(true);
        const timer = setTimeout(() => {
            const searchTerms = query.toLowerCase().split(' ');
            const matchedSlugs = Object.keys(slugMap)
                .filter(slug => searchTerms.every(term => slug.replace(/-/g, ' ').includes(term)))
                .slice(0, 8);
            
            setResults(matchedSlugs.map(slug => ({
                slug,
                id: slugMap[slug],
                title: slug.replace(/-/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())))
            })));
            setSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, slugMap]);

    return (
        <div class="relative w-full group">
            <div class="absolute inset-y-0 left-6 flex items-center pointer-events-none text-primary/30 group-focus-within:text-accent transition-colors">
                {searching ? <Loader2 class="animate-spin" size={20} /> : <SearchIcon size={20} />}
            </div>
            
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={loading ? "Loading verse index..." : "Search for keywords, authors, or themes..."}
                disabled={loading}
                class="w-full bg-white/80 backdrop-blur-xl border-2 border-indigo-50/50 rounded-full py-5 pl-16 pr-8 shadow-xl focus:outline-none focus:border-accent/30 focus:shadow-accent/5 transition-all text-lg"
            />

            {results.length > 0 && (
                <div class="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-2xl border border-indigo-50 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    {results.map((res) => (
                        <a 
                            key={res.slug}
                            href={`/p/${res.slug}/`}
                            class="flex items-center space-x-4 p-5 hover:bg-accent/5 border-b border-indigo-50/50 last:border-0 group/item"
                        >
                            <div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover/item:bg-accent group-hover/item:text-white transition-all">
                                <Quote size={18} />
                            </div>
                            <div>
                                <h4 class="font-bold text-primary group-hover/item:text-accent transition-colors line-clamp-1">{res.title}</h4>
                                <span class="text-[10px] uppercase tracking-widest text-primary/30 font-bold">Poem Discovery</span>
                            </div>
                        </a>
                    ))}
                    <div class="p-4 bg-indigo-50/30 text-center">
                        <a href={`/explore?q=${query}`} class="text-[10px] uppercase tracking-widest font-black text-accent hover:underline">
                            View All Search Results
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
