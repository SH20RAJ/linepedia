/**
 * Linepedia Content Import Script
 * Fetches poems from PoetryDB and transforms to Linepedia schema.
 * Usage: node scripts/fetch-poems.js
 */

const POETRYDB_BASE = 'https://poetrydb.org';

// Mood/category classification keywords
const MOOD_KEYWORDS = {
  sad: ['death', 'weep', 'sorrow', 'grief', 'tears', 'mourn', 'pain', 'lost', 'grave', 'farewell', 'bitter', 'woe', 'despair', 'misery', 'melancholy', 'decay', 'dark', 'cold', 'alone', 'lonely'],
  love: ['love', 'heart', 'kiss', 'beloved', 'beauty', 'desire', 'passion', 'sweet', 'darling', 'dear', 'embrace', 'tender', 'gentle', 'adore', 'charm', 'blush', 'romance', 'affection'],
  deep: ['soul', 'truth', 'wisdom', 'time', 'silence', 'dream', 'mind', 'thought', 'spirit', 'infinite', 'eternity', 'purpose', 'meaning', 'mystery', 'shadow', 'light', 'knowledge'],
  nature: ['flower', 'sea', 'sky', 'moon', 'sun', 'star', 'wind', 'rain', 'tree', 'river', 'mountain', 'garden', 'bird', 'spring', 'summer', 'autumn', 'winter', 'rose', 'leaf', 'ocean'],
  inspirational: ['hope', 'strength', 'courage', 'rise', 'glory', 'brave', 'triumph', 'victory', 'free', 'freedom', 'power', 'great', 'noble', 'dream', 'aspire', 'achieve']
};

const CATEGORY_MAP = {
  sad: 'sad-shayari',
  love: 'love-shayari',
  deep: 'deep-lines',
  nature: 'nature-poetry',
  inspirational: 'motivational-lines'
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
}

function classifyPoem(lines) {
  const text = lines.join(' ').toLowerCase();
  const moods = [];
  const categories = [];

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    if (matchCount >= 2) {
      moods.push(mood);
      if (CATEGORY_MAP[mood]) categories.push(CATEGORY_MAP[mood]);
    }
  }

  // Default fallback
  if (moods.length === 0) moods.push('deep');
  if (categories.length === 0) categories.push('deep-lines');

  return { moods, categories };
}

function generateMeaning(title, author, lines, moods) {
  const moodStr = moods.join(' and ');
  const lineCount = lines.length;
  const preview = lines.slice(0, 2).join(' ').slice(0, 100);
  return `"${title}" by ${author} is a ${moodStr} poem consisting of ${lineCount} lines. The poet explores themes of ${moodStr} through vivid imagery and emotional depth. Beginning with "${preview}...", this piece captures the essence of human experience and invites reflection on the deeper currents of life and feeling. This work is part of ${author}'s celebrated body of poetry that continues to resonate with readers worldwide.`;
}

function generateSEOTitle(title, author, moods) {
  const mood = moods[0] || 'deep';
  const moodCap = mood.charAt(0).toUpperCase() + mood.slice(1);
  return `${title} by ${author} — ${moodCap} Poetry Lines`;
}

async function fetchAllAuthors() {
  const res = await fetch(`${POETRYDB_BASE}/author`);
  const data = await res.json();
  return data.authors || [];
}

async function fetchPoemsByAuthor(author) {
  try {
    const res = await fetch(`${POETRYDB_BASE}/author/${encodeURIComponent(author)}`);
    const data = await res.json();
    if (data.status === 404 || !Array.isArray(data)) return [];
    return data;
  } catch (e) {
    console.error(`Failed to fetch poems for ${author}:`, e.message);
    return [];
  }
}

async function main() {
  console.log('🔍 Fetching authors from PoetryDB...');
  const allAuthors = await fetchAllAuthors();
  console.log(`Found ${allAuthors.length} authors.`);

  // Pick top authors — classics with rich content
  const targetAuthors = allAuthors.slice(0, 40); // First 40 authors for good coverage

  const allPoems = [];
  const writerMap = new Map();
  const categorySet = new Map();
  let id = 100;

  for (const author of targetAuthors) {
    console.log(`📥 Fetching poems by ${author}...`);
    const poems = await fetchPoemsByAuthor(author);
    
    if (poems.length === 0) continue;

    const writerSlug = slugify(author);
    
    if (!writerMap.has(writerSlug)) {
      writerMap.set(writerSlug, {
        slug: writerSlug,
        name: author,
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${writerSlug}`,
        bio: `${author} is a celebrated poet whose works explore the depths of human emotion through powerful verse. Their poetry continues to inspire readers across generations and cultures.`,
        stats: { poems: poems.length }
      });
    }

    // Take up to 15 poems per author to keep it manageable
    const selected = poems.slice(0, 15);

    for (const poem of selected) {
      id++;
      const { moods, categories } = classifyPoem(poem.lines);
      const poemSlug = `${writerSlug}-${slugify(poem.title)}-${id}`;
      const content = poem.lines.slice(0, 8).join('\n'); // Keep first 8 lines for card display
      const fullContent = poem.lines.join('\n');

      allPoems.push({
        id: String(id),
        slug: poemSlug,
        title: generateSEOTitle(poem.title, author, moods),
        content: fullContent.length > 500 ? content : fullContent,
        writer: writerSlug,
        category: categories,
        mood: moods,
        language: 'English',
        meaning: generateMeaning(poem.title, author, poem.lines, moods),
        createdAt: new Date().toISOString()
      });

      // Track categories
      for (const cat of categories) {
        if (!categorySet.has(cat)) {
          const catName = cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          categorySet.set(cat, {
            slug: cat,
            name: catName,
            description: `Explore our curated collection of ${catName.toLowerCase()} — the best lines for every mood and occasion.`,
            seoIntro: `Discover the most beautiful ${catName.toLowerCase()} from legendary poets and contemporary writers. Our collection features carefully selected lines that capture the essence of ${catName.toLowerCase()}, perfect for sharing on social media, using as captions, or simply reading for personal reflection. Browse through hundreds of handpicked lines organized by writer, mood, and theme.`
          });
        }
      }
    }
  }

  console.log(`\n✅ Imported ${allPoems.length} poems from ${writerMap.size} writers across ${categorySet.size} categories.`);

  // Write poems.json
  const fs = await import('fs');
  const path = await import('path');

  const contentDir = path.default.join(process.cwd(), 'src/content');
  
  fs.default.writeFileSync(
    path.default.join(contentDir, 'poems.json'),
    JSON.stringify(allPoems, null, 2)
  );
  console.log(`📝 Written ${allPoems.length} poems to src/content/poems.json`);

  // Write writers.json
  const writers = Array.from(writerMap.values());
  fs.default.writeFileSync(
    path.default.join(contentDir, 'writers.json'),
    JSON.stringify(writers, null, 2)
  );
  console.log(`📝 Written ${writers.length} writers to src/content/writers.json`);

  // Write categories.json
  const categories = Array.from(categorySet.values());
  fs.default.writeFileSync(
    path.default.join(contentDir, 'categories.json'),
    JSON.stringify(categories, null, 2)
  );
  console.log(`📝 Written ${categories.length} categories to src/content/categories.json`);

  // Generate additional collection pages from keyword multiplier
  const collections = [];
  const useCases = ['copy-paste', 'instagram-captions', 'whatsapp-status', 'bio-lines', 'facebook-status'];
  const lengths = ['2-line', '4-line', 'short'];
  
  for (const cat of categorySet.values()) {
    for (const useCase of useCases.slice(0, 2)) {
      collections.push({
        slug: `${cat.slug}-${useCase}`,
        name: `${cat.name} ${useCase.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        description: `Best ${cat.name.toLowerCase()} ${useCase.replace(/-/g, ' ')} — ready to share and use.`,
        seoIntro: `Looking for the best ${cat.name.toLowerCase()} to ${useCase.replace(/-/g, ' ')}? Browse our hand-picked collection of emotional and impactful lines perfect for sharing. Each line has been curated for maximum impact and relatability. Whether you need a quick caption or a deeply moving verse, you'll find exactly what you're looking for here.`,
        filter: { category: cat.slug }
      });
    }
    for (const length of lengths.slice(0, 1)) {
      collections.push({
        slug: `${length}-${cat.slug}`,
        name: `${length.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${cat.name}`,
        description: `Short and powerful ${length.replace(/-/g, ' ')} ${cat.name.toLowerCase()}.`,
        seoIntro: `Sometimes the most powerful words come in the shortest form. Explore our collection of ${length.replace(/-/g, ' ')} ${cat.name.toLowerCase()} that pack an emotional punch in just a few lines. Perfect for sharing as status updates, captions, or simply reflecting upon.`,
        filter: { category: cat.slug }
      });
    }
  }

  fs.default.writeFileSync(
    path.default.join(contentDir, 'collections.json'),
    JSON.stringify(collections, null, 2)
  );
  console.log(`📝 Written ${collections.length} collections to src/content/collections.json`);

  console.log('\n🎉 Content import complete!');
}

main().catch(console.error);
