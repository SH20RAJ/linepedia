/**
 * Linepedia Expanded Content Import Script
 * 
 * Sources:
 * 1. PoetryDB (all 129 authors) — classic English poetry
 * 2. IqbalAPI — Urdu poetry of Allama Iqbal
 * 
 * Usage: node scripts/fetch-poems.js
 */

const POETRYDB_BASE = 'https://poetrydb.org';
const IQBAL_API_BASE = 'https://iqbal-api.up.railway.app';

// Mood/category classification keywords
const MOOD_KEYWORDS = {
  sad: ['death', 'weep', 'sorrow', 'grief', 'tears', 'mourn', 'pain', 'lost', 'grave', 'farewell', 'bitter', 'woe', 'despair', 'misery', 'melancholy', 'decay', 'dark', 'cold', 'alone', 'lonely', 'broken', 'bleed', 'wound', 'cry', 'dying'],
  love: ['love', 'heart', 'kiss', 'beloved', 'beauty', 'desire', 'passion', 'sweet', 'darling', 'dear', 'embrace', 'tender', 'gentle', 'adore', 'charm', 'blush', 'romance', 'affection', 'lover', 'devotion', 'yearning'],
  deep: ['soul', 'truth', 'wisdom', 'time', 'silence', 'dream', 'mind', 'thought', 'spirit', 'infinite', 'eternity', 'purpose', 'meaning', 'mystery', 'shadow', 'light', 'knowledge', 'philosophy', 'conscience', 'existence'],
  nature: ['flower', 'sea', 'sky', 'moon', 'sun', 'star', 'wind', 'rain', 'tree', 'river', 'mountain', 'garden', 'bird', 'spring', 'summer', 'autumn', 'winter', 'rose', 'leaf', 'ocean', 'brook', 'meadow', 'bloom'],
  inspirational: ['hope', 'strength', 'courage', 'rise', 'glory', 'brave', 'triumph', 'victory', 'free', 'freedom', 'power', 'great', 'noble', 'dream', 'aspire', 'achieve', 'faith', 'persevere', 'destiny', 'conquer'],
  spiritual: ['god', 'divine', 'heaven', 'prayer', 'holy', 'sacred', 'worship', 'angel', 'eternal', 'grace', 'blessed', 'salvation', 'mercy', 'praise', 'psalm'],
  romantic: ['kiss', 'lips', 'rose', 'moonlight', 'wine', 'dance', 'whisper', 'caress', 'longing', 'gaze', 'enchant', 'serenade']
};

const CATEGORY_MAP = {
  sad: 'sad-shayari',
  love: 'love-shayari',
  deep: 'deep-lines',
  nature: 'nature-poetry',
  inspirational: 'motivational-lines',
  spiritual: 'spiritual-poetry',
  romantic: 'romantic-poetry'
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

function classifyPoem(text) {
  const lower = text.toLowerCase();
  const moods = [];
  const categories = [];

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const matchCount = keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount >= 2) {
      moods.push(mood);
      if (CATEGORY_MAP[mood]) categories.push(CATEGORY_MAP[mood]);
    }
  }

  if (moods.length === 0) moods.push('deep');
  if (categories.length === 0) categories.push('deep-lines');

  return { moods, categories };
}

function generateMeaning(title, author, lines, moods, language = 'English') {
  const moodStr = moods.join(' and ');
  const lineCount = Array.isArray(lines) ? lines.length : lines.split('\n').length;
  const preview = (Array.isArray(lines) ? lines.slice(0, 2).join(' ') : lines.split('\n').slice(0, 2).join(' ')).slice(0, 100);
  
  const langContext = language === 'Urdu' 
    ? `This Urdu verse by ${author} showcases the rich tradition of South Asian poetry. The poet masterfully employs Urdu literary conventions to convey profound emotional depth.`
    : `This English poem by ${author} demonstrates the timeless power of verse to capture complex human emotions.`;
  
  return `"${title}" by ${author} is a ${moodStr} ${language.toLowerCase()} poem consisting of ${lineCount} lines. ${langContext} Beginning with "${preview}...", this piece explores themes of ${moodStr} through vivid imagery and emotional resonance. The work invites contemplation on the deeper currents of life, love, and the human condition. ${author}'s celebrated body of poetry continues to inspire readers across generations and cultures, and this particular work stands as a powerful example of their artistic vision.`;
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      if (res.status === 429) {
        process.stdout.write(`Rate limited, waiting ${delay * 2}ms... `);
        await new Promise(r => setTimeout(r, delay * 2));
        continue;
      }
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await new Promise(r => setTimeout(r, delay));
  }
  return null;
}

// =========================================
// SOURCE 1: PoetryDB — all authors
// =========================================
async function fetchPoetryDB() {
  console.log('\n📚 SOURCE 1: PoetryDB');
  console.log('═'.repeat(50));
  
  const authorsData = await fetchWithRetry(`${POETRYDB_BASE}/author`);
  if (!authorsData?.authors) { console.error('Failed to fetch authors'); return { poems: [], writers: new Map() }; }
  
  const allAuthors = authorsData.authors;
  console.log(`Found ${allAuthors.length} authors. Fetching all...`);
  
  const poems = [];
  const writers = new Map();
  let idCounter = Date.now();

  for (const author of allAuthors) {
    process.stdout.write(`📥 ${author}... `);
    const data = await fetchWithRetry(`${POETRYDB_BASE}/author/${encodeURIComponent(author)}`);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('skipped');
      continue;
    }
    
    const writerSlug = slugify(author);
    if (!writers.has(writerSlug)) {
      writers.set(writerSlug, {
        slug: writerSlug,
        name: author,
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${writerSlug}`,
        bio: `${author} is a distinguished poet whose works have shaped the landscape of English literature. Their poetry explores the depths of human emotion, nature, love, and philosophical thought through powerful and evocative verse. Readers continue to find solace, inspiration, and beauty in their timeless words.`,
        stats: { poems: data.length }
      });
    }

    const selected = data.slice(0, 5); // Fetch fewer per author to be faster and stay under limits
    for (const poem of selected) {
      idCounter++;
      const fullText = poem.lines.join('\n');
      const { moods, categories } = classifyPoem(fullText);
      const content = poem.lines.length > 12 ? poem.lines.slice(0, 12).join('\n') : fullText;

      poems.push({
        id: String(idCounter),
        slug: `${writerSlug}-${slugify(poem.title)}-${idCounter}`,
        title: `${poem.title} by ${author}`,
        content,
        writer: writerSlug,
        category: categories,
        mood: moods,
        language: 'English',
        meaning: generateMeaning(poem.title, author, poem.lines, moods, 'English'),
        createdAt: new Date().toISOString()
      });
    }
    console.log(`${selected.length} poems`);
    await new Promise(r => setTimeout(r, 100)); // Minor throttle
  }

  return { poems, writers };
}

// =========================================
// SOURCE 2: IqbalAPI — Urdu shayari
// =========================================
async function fetchIqbalAPI() {
  console.log('\n📚 SOURCE 2: IqbalAPI (Allama Iqbal — Urdu Poetry)');
  console.log('═'.repeat(50));

  const poems = [];
  const writers = new Map();
  let idCounter = 5000 + Date.now() % 10000;

  const writerSlug = 'allama-iqbal';
  writers.set(writerSlug, {
    slug: writerSlug,
    name: 'Allama Muhammad Iqbal',
    photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${writerSlug}`,
    bio: 'Sir Muhammad Iqbal (1877–1938), widely known as Allama Iqbal, was a South Asian Muslim poet, philosopher, and politician. He is considered one of the most important figures in Urdu literature, with literary work in both Urdu and Persian. His poetry is renowned for its depth, spiritual passion, and its call to self-awakening.',
    stats: { poems: 0 }
  });

  console.log('Fetching random verses...');
  for (let i = 0; i < 30; i++) {
    const data = await fetchWithRetry(`${IQBAL_API_BASE}/verses/random`);
    if (!data || !Array.isArray(data)) continue;

    const items = data;
    const urduLines = items.map(v => v.urdu).join('\n');
    const englishLines = items.map(v => v.english).join('\n');
    const poemId = items[0].poem_id;
    const title = `Iqbal Verse #${poemId}`;

    idCounter++;
    const content = `${urduLines}\n\n— Translation —\n${englishLines}`;
    const { moods, categories } = classifyPoem(englishLines);
    
    poems.push({
      id: String(idCounter),
      slug: `allama-iqbal-verse-${poemId}-${idCounter}`,
      title: `${title} — Allama Iqbal Urdu Shayari`,
      content,
      writer: writerSlug,
      category: [...new Set([...categories, 'urdu-shayari', 'deep-lines'])],
      mood: [...new Set([...moods, 'spiritual'])],
      language: 'Urdu',
      meaning: generateMeaning(title, 'Allama Iqbal', content, moods, 'Urdu'),
      createdAt: new Date().toISOString()
    });
    
    if (i % 10 === 0) process.stdout.write(`${i}... `);
  }

  const writerData = writers.get(writerSlug);
  writerData.stats.poems = poems.length;
  console.log(`\nFetched ${poems.length} Iqbal verses`);

  return { poems, writers };
}

// =========================================
// MAIN
// =========================================
async function main() {
  console.log('🚀 Linepedia Content Import — Appending Mode');
  console.log('═'.repeat(60));

  const fs = await import('fs');
  const path = await import('path');
  const contentDir = path.default.join(process.cwd(), 'src/content');
  
  // Load existing data
  let existingPoems = [];
  let existingWriters = [];
  let existingCategories = [];
  
  if (fs.default.existsSync(path.default.join(contentDir, 'poems.json'))) {
    existingPoems = JSON.parse(fs.default.readFileSync(path.default.join(contentDir, 'poems.json'), 'utf8'));
  }
  if (fs.default.existsSync(path.default.join(contentDir, 'writers.json'))) {
    existingWriters = JSON.parse(fs.default.readFileSync(path.default.join(contentDir, 'writers.json'), 'utf8'));
  }
  if (fs.default.existsSync(path.default.join(contentDir, 'categories.json'))) {
    existingCategories = JSON.parse(fs.default.readFileSync(path.default.join(contentDir, 'categories.json'), 'utf8'));
  }

  console.log(`Loaded ${existingPoems.length} existing poems.`);

  // Fetch new data
  const poetryDB = await fetchPoetryDB();
  const iqbal = await fetchIqbalAPI();

  // Merge poems (avoid duplicates by content snippet)
  const newPoems = [...poetryDB.poems, ...iqbal.poems];
  const allPoems = [...existingPoems];
  const contentSet = new Set(existingPoems.map(p => p.content.slice(0, 100)));

  let addedCount = 0;
  for (const p of newPoems) {
    const preview = p.content.slice(0, 100);
    if (!contentSet.has(preview)) {
      allPoems.push(p);
      contentSet.add(preview);
      addedCount++;
    }
  }

  // Merge writers
  const writerMap = new Map(existingWriters.map(w => [w.slug, w]));
  [...poetryDB.writers, ...iqbal.writers].forEach(([slug, data]) => {
    if (!writerMap.has(slug)) {
      writerMap.set(slug, data);
    } else {
      // Update stats if needed
      writerMap.get(slug).stats.poems = (writerMap.get(slug).stats.poems || 0) + (data.stats.poems || 0);
    }
  });

  // Re-build categories
  const categoryMap = new Map(existingCategories.map(c => [c.slug, c]));
  for (const poem of allPoems) {
    for (const cat of poem.category) {
      if (!categoryMap.has(cat)) {
        const catName = cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        categoryMap.set(cat, {
          slug: cat,
          name: catName,
          description: `Explore our curated collection of ${catName.toLowerCase()} — the finest lines for every mood and occasion.`,
          seoIntro: `Discover the most beautiful ${catName.toLowerCase()} from legendary poets and contemporary writers...`
        });
      }
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ TOTAL: ${allPoems.length} poems (${addedCount} new added)`);

  // Generate keyword-multiplied collections
  const collections = [];
  const useCases = ['copy-paste', 'instagram-captions', 'whatsapp-status', 'bio-lines'];
  const lengths = ['2-line', '4-line', 'short'];

  for (const cat of categoryMap.values()) {
    for (const useCase of useCases) {
      collections.push({
        slug: `${cat.slug}-${useCase}`,
        name: `${cat.name} ${useCase.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        description: `Best ${cat.name.toLowerCase()} ${useCase.replace(/-/g, ' ')} — ready to share and use.`,
        seoIntro: `Looking for the best ${cat.name.toLowerCase()}...`,
        filter: { category: cat.slug }
      });
    }
    for (const length of lengths) {
      collections.push({
        slug: `${length}-${cat.slug}`,
        name: `${length.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${cat.name}`,
        description: `Short and powerful ${length.replace(/-/g, ' ')} ${cat.name.toLowerCase()}.`,
        seoIntro: `Sometimes the most powerful words come in the shortest form...`,
        filter: { category: cat.slug }
      });
    }
  }

  // Write files
  if (!fs.default.existsSync(contentDir)) fs.default.mkdirSync(contentDir, { recursive: true });

  fs.default.writeFileSync(path.default.join(contentDir, 'poems.json'), JSON.stringify(allPoems, null, 2));
  fs.default.writeFileSync(path.default.join(contentDir, 'writers.json'), JSON.stringify(Array.from(writerMap.values()), null, 2));
  fs.default.writeFileSync(path.default.join(contentDir, 'categories.json'), JSON.stringify(Array.from(categoryMap.values()), null, 2));
  fs.default.writeFileSync(path.default.join(contentDir, 'collections.json'), JSON.stringify(collections, null, 2));

  console.log(`\n🎉 Content import complete! ${addedCount} new lines added.`);
}

main().catch(console.error);
