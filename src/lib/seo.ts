export const SUPPORTED_LANGUAGES = [
  'en',
  'es',
  'fr',
  'de',
  'hi',
  'ar',
  'zh',
  'ja',
  'ru',
  'pt',
  'it',
 ] as const;

export function getNormalizedLang(value: string | null | undefined): string {
  const lang = String(value || 'en').toLowerCase();
	return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang) ? lang : 'en';
}

export function getSiteOrigin(site: URL | string | undefined, fallbackOrigin: string): string {
  return (site?.toString() || fallbackOrigin).replace(/\/$/, '');
}

export function buildCanonicalUrl(pathname: string, siteOrigin: string): string {
  return new URL(pathname, siteOrigin).toString();
}

export function hasSearchLikeParams(searchParams: URLSearchParams): boolean {
  const blocked = ['q', 'search', 'query', 'sort', 'filter', 'tag'];
  return blocked.some((key) => searchParams.has(key));
}

export function hasTrackingParams(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    const normalized = key.toLowerCase();
    if (normalized.startsWith('utm_')) return true;
    if (normalized === 'gclid' || normalized === 'fbclid') return true;
  }
  return false;
}

export function shouldNoindexForParams(searchParams: URLSearchParams): boolean {
  return hasSearchLikeParams(searchParams) || hasTrackingParams(searchParams);
}

export function shouldNoindexForLanguageParam(searchParams: URLSearchParams, translationsServerSide = false): boolean {
	const lang = getNormalizedLang(searchParams.get('lang'));
	return searchParams.has('lang') && lang !== 'en' && !translationsServerSide;
}

export const SITE_NAME = 'Linespedia';
export const SITE_DESCRIPTION = 'A curated archive of shayari, poems, and poetic lines.';

export const LOCALE_MAP: Record<string, string> = {
	en: 'en_US',
	es: 'es_ES',
	fr: 'fr_FR',
	de: 'de_DE',
	hi: 'hi_IN',
	ar: 'ar_SA',
	zh: 'zh_CN',
	ja: 'ja_JP',
	ru: 'ru_RU',
	pt: 'pt_BR',
	it: 'it_IT',
};

export type PageType = 'home' | 'line' | 'author' | 'category' | 'collection' | 'programmatic' | 'archive' | 'blog';

export interface PageMetadataInput {
	pageType: PageType;
	data?: Record<string, any>;
	siteOrigin?: string;
	pathname?: string;
	lang?: string;
	translationsServerSide?: boolean;
	isTranslationParamPage?: boolean;
	pageNumber?: number;
	itemCount?: number;
	minimumItems?: number;
	maxIndexablePage?: number;
	image?: string;
	fallbackTitle?: string;
	fallbackDescription?: string;
}

export interface PageMetadataOutput {
	title: string;
	description: string;
	canonicalURL: string;
	ogTitle: string;
	ogDescription: string;
	ogUrl: string;
	robots: string;
	twitterCard: 'summary' | 'summary_large_image';
	noindex: boolean;
	h1: string;
}

// ── Content Quality Guards ──────────────────────────────────────

/** Categories expected to contain Hindi/Urdu/Hinglish shayari content */
export const SHAYARI_INTENT_SLUGS = new Set([
  'sad-shayari',
  'love-shayari',
  'shayari',
  'attitude-shayari',
  'shayari-in-hindi',
  'sad-shayari-in-hindi',
  'love-shayari-in-hindi',
  '2-line-sad-shayari',
  'heart-touching-shayari',
  'breakup-shayari',
  'hindi-shayari',
  'urdu-shayari',
  'romantic-shayari',
  'best-shayari',
  'emotional-shayari',
  'friendship-shayari',
  'shayari-in-english',
  'poetry',
  'motivational-quotes',
  'life-quotes',
  'instagram-captions',
  'quotes',
]);

/** Check if text contains Devanagari (Hindi) or Urdu script characters */
export function containsSouthAsianScript(text: string): boolean {
  return /[\u0900-\u097F\u0600-\u06FF\u0750-\u077F]/.test(text);
}

/** Check if text looks like Hinglish (Romanized Hindi with common words) */
export function containsHinglish(text: string): boolean {
  const hinglishWords = /\b(dil|ishq|pyaar|mohabbat|yaad|dard|sad|aashiqui|khwab|dilbar|sanam|jaan|tum|tere|meri|tera|hai|hain|kaun|kya|nahi|hoon|hum|aap|zindagi|rooh|chain|sukoon|aankh|nazar|dhadkan|saans|tanha|bewafa|intezaar|fir|bhi|kyun|bas|dil|baar)\b/i;
  return hinglishWords.test(text);
}

/** Check if content is predominantly Hindi/Urdu shayari (not English classic poetry) */
export function isHindiShayariContent(content: string): boolean {
  if (!content) return false;
  return containsSouthAsianScript(content) || containsHinglish(content);
}

/** Author is indexable: must have at least 3 meaningful lines */
export function isIndexableAuthor(poemCount: number): boolean {
  return poemCount >= 3;
}

/** Category is indexable: must have at least 10 lines, and for shayari-intent slugs the content should match intent */
export function isIndexableCategory(
  categorySlug: string,
  poemCount: number,
  poems?: { content: string }[],
): boolean {
  if (poemCount < 10) return false;

  // For shayari-intent slugs, verify at least some poems are actual shayari (Hindi/Urdu/Hinglish)
  if (SHAYARI_INTENT_SLUGS.has(categorySlug)) {
    if (!poems || poems.length === 0) return poemCount >= 10; // can't verify, index anyway
    const shayariCount = poems.filter(p => isHindiShayariContent(p.content)).length;
    // At least 20% of visible poems should be shayari
    const sample = poems.slice(0, 40);
    const shayariRatio = shayariCount / Math.max(sample.length, 1);
    return shayariRatio >= 0.15 && poemCount >= 10;
  }

  return poemCount >= 10;
}

/** Line page is indexable: must have meaningful unique textual content */
export function isIndexableLine(poem: { content?: string; title?: string; meaning?: string } | null): boolean {
  if (!poem) return false;
  const content = (poem.content || '').trim();
  if (!content) return false;
  // Must have at least a meaningful phrase (> 15 chars of real content)
  if (content.length < 15) return false;
  // Must not just be a number or timestamp
  if (/^[\d\s.,!?]+$/.test(content)) return false;
  return true;
}

/** Blog post topics that are on-topic for Linespedia (poetry/shayari/quotes/literature) */
const TOPICAL_CATEGORIES = new Set([
  'poetry',
  'shayari',
  'poem',
  'quotes',
  'captions',
  'poets',
  'literature',
  'writing',
  'instagram_captions',
  'emotional_expression',
  'meaning',
  'language',
  'translation',
  'creative_writing',
  'poem_explanation',
]);

const TOPICAL_KEYWORDS = [
  'poem', 'poetry', 'poet', 'shayari', 'shayar', 'quote', 'quotes',
  'caption', 'captions', 'instagram', 'writer', 'writing', 'literature',
  'meaning', 'explanation', 'translation', 'emotional', 'love', 'sad',
  'romantic', 'attitude', 'motivational', 'inspirational', 'life',
  'relationship', 'breakup', 'heart', 'feelings', 'express',
];

export function isTopicalBlogPost(post: {
  data?: { category?: string; tags?: string[]; title?: string; description?: string };
  slug?: string;
}): boolean {
  const cat = (post.data?.category || '').toLowerCase().replace(/\s+/g, '_');
  if (TOPICAL_CATEGORIES.has(cat)) return true;

  const title = (post.data?.title || '').toLowerCase();
  const desc = (post.data?.description || '').toLowerCase();
  const tags = (post.data?.tags || []).map(t => t.toLowerCase());
  const slug = (post.slug || '').toLowerCase();

  const allText = `${title} ${desc} ${tags.join(' ')} ${slug}`;
  return TOPICAL_KEYWORDS.some(kw => allText.includes(kw));
}

/** Get the appropriate robots meta for a page type */
export function getRobotsForPage(params: {
  type: 'author' | 'category' | 'line' | 'blog' | 'archive';
  poemCount?: number;
  poems?: { content: string }[];
  categorySlug?: string;
  poem?: { content?: string; title?: string; meaning?: string } | null;
  blogPost?: { data?: { category?: string; tags?: string[]; title?: string; description?: string }; slug?: string };
}): { indexable: boolean; robots: string } {
  const { type, poemCount = 0, poems, categorySlug, poem, blogPost } = params;

  if (type === 'author') {
    return {
      indexable: isIndexableAuthor(poemCount),
      robots: isIndexableAuthor(poemCount)
        ? 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
        : 'noindex,follow',
    };
  }

  if (type === 'category' && categorySlug) {
    const indexable = isIndexableCategory(categorySlug, poemCount, poems);
    return {
      indexable,
      robots: indexable
        ? 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
        : 'noindex,follow',
    };
  }

  if (type === 'line') {
    const indexable = isIndexableLine(poem);
    return {
      indexable,
      robots: indexable
        ? 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
        : 'noindex,follow',
    };
  }

  if (type === 'blog' && blogPost) {
    const topical = isTopicalBlogPost(blogPost);
    return {
      indexable: topical,
      robots: topical
        ? 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
        : 'noindex,follow',
    };
  }

  return {
    indexable: true,
    robots: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
  };
}

function cleanText(value: unknown): string {
	return String(value ?? '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function stripTrailingPunctuation(value: string): string {
	return value.replace(/[\s\-–—,.;:!?]+$/g, '').trim();
}

function truncate(value: string, maxLength: number): string {
	if (value.length <= maxLength) return value;
	return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function quoteSnippet(value: string, maxLength = 140): string {
	const cleaned = stripTrailingPunctuation(cleanText(value));
	if (!cleaned) return '';
	return truncate(cleaned, maxLength);
}

export function generateCanonical(
	pathname: string,
	siteOrigin: string,
	params: Record<string, string | number | boolean | null | undefined> = {},
): string {
	const baseOrigin = siteOrigin.replace(/\/$/, '');
	const url = new URL(pathname.startsWith('http') ? pathname : pathname.startsWith('/') ? pathname : `/${pathname}`, baseOrigin);

	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null || value === false || value === '') return;
		url.searchParams.set(key, String(value));
	});

	return url.toString();
}

export function generateNoindexRules({
	indexable = true,
	hasContent = true,
	itemCount = 1,
	minimumItems = 1,
	pageNumber = 1,
	maxIndexablePage = Number.POSITIVE_INFINITY,
}: {
	indexable?: boolean;
	hasContent?: boolean;
	itemCount?: number;
	minimumItems?: number;
	pageNumber?: number;
	maxIndexablePage?: number;
}): { indexable: boolean; robots: string } {
	const shouldIndex = Boolean(indexable && hasContent && itemCount >= minimumItems && pageNumber <= maxIndexablePage);
	return {
		indexable: shouldIndex,
		robots: shouldIndex
			? 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
			: 'noindex,follow',
	};
}

function buildLineDescription(data: Record<string, any>): string {
	const title = cleanText(data.title || data.name || 'Untitled line');
	const authorName = cleanText(data.writerName || data.authorName || data.writer);
	const content = quoteSnippet(data.content || data.poem || '', 150);
	const meaning = quoteSnippet(data.meaning || data.description || '', 120);

	const fragments: string[] = [];
	if (content) fragments.push(`"${content}"`);
	if (authorName) fragments.push(`by ${authorName}`);
	if (!content && title) fragments.push(title);
	if (meaning) fragments.push(meaning);

	return truncate(stripTrailingPunctuation(fragments.join('. ')) || `${title} by ${authorName}`.trim(), 160);
}

function buildIndexDescription(data: Record<string, any>, pageType: PageType, itemCount: number): string {
	const name = cleanText(data.name || data.title || data.categoryName || data.collectionName || 'Linespedia');
	const intro = cleanText(data.seoIntro || data.description || data.bio || '');
	const countLabel = itemCount > 0 ? `${itemCount} published line${itemCount === 1 ? '' : 's'}` : '';

	if (intro) {
		return truncate(
			countLabel && pageType !== 'blog' ? `${intro} Browse ${countLabel.toLowerCase()} in this archive.` : intro,
			170,
		);
	}

	if (pageType === 'author') {
		return truncate(`${name} archive of published lines and poems on Linespedia.`, 160);
	}

	if (pageType === 'category' || pageType === 'collection') {
		return truncate(`Browse ${countLabel || 'published lines'} for ${name} on Linespedia.`, 160);
	}

	if (pageType === 'archive') {
		return truncate(`Browse ${countLabel || 'curated lines'} from the Linespedia archive.`, 160);
	}

	if (pageType === 'programmatic') {
		const modifier = cleanText(data.modifierLabel || data.modifier || 'curated');
		const category = cleanText(data.categoryName || data.name || 'lines');
		const platform = cleanText(data.platformLabel || data.platform || 'sharing');
		return truncate(`Explore ${countLabel || 'curated lines'} for ${modifier.toLowerCase()} ${category.toLowerCase()} and ${platform.toLowerCase()}.`, 160);
	}

	return truncate(data.description || SITE_DESCRIPTION, 160);
}

export function generatePageMetadata(input: PageMetadataInput): PageMetadataOutput {
	const {
		pageType,
		data = {},
		siteOrigin = 'https://linespedia.com',
		pathname = '/',
		lang = 'en',
		translationsServerSide = false,
		isTranslationParamPage = false,
		pageNumber = 1,
		itemCount = 0,
		minimumItems = 1,
		maxIndexablePage = Number.POSITIVE_INFINITY,
		fallbackTitle = SITE_NAME,
		fallbackDescription = SITE_DESCRIPTION,
	} = input;

	const titleBase = cleanText(data.title || data.name || data.categoryName || data.collectionName || fallbackTitle);
	const authorName = cleanText(data.writerName || data.authorName || data.writer);
	const isLine = pageType === 'line';
	const isIndexPage = pageType === 'archive' || pageType === 'author' || pageType === 'category' || pageType === 'collection' || pageType === 'programmatic';
	const hasContent = isLine ? Boolean(cleanText(data.content)) : Boolean(cleanText(data.description || data.bio || data.seoIntro || data.content) || itemCount > 0);
	const { indexable, robots } = generateNoindexRules({
		indexable: true,
		hasContent,
		itemCount: isIndexPage ? itemCount : Math.max(itemCount, hasContent ? 1 : 0),
		minimumItems,
		pageNumber,
		maxIndexablePage,
	});

	let title = fallbackTitle;
	let h1 = titleBase;
	let description = fallbackDescription;

	switch (pageType) {
		case 'line': {
			const base = authorName ? `${titleBase} by ${authorName}` : titleBase;
			title = base.includes(SITE_NAME) ? base : `${base} | ${SITE_NAME}`;
			h1 = titleBase;
			description = buildLineDescription(data) || fallbackDescription;
			break;
		}
		case 'author': {
			title = titleBase.includes(SITE_NAME) ? titleBase : `${titleBase} | ${SITE_NAME}`;
			h1 = titleBase;
			description = buildIndexDescription(data, pageType, itemCount);
			break;
		}
		case 'category':
		case 'collection': {
			title = titleBase.includes(SITE_NAME) ? titleBase : `${titleBase} | ${SITE_NAME}`;
			h1 = titleBase;
			description = buildIndexDescription(data, pageType, itemCount);
			break;
		}
		case 'programmatic': {
			const modifier = cleanText(data.modifierLabel || data.modifier || 'Curated');
			const category = cleanText(data.categoryName || data.name || 'Lines');
			const platform = cleanText(data.platformLabel || data.platform || 'sharing');
			const base = stripTrailingPunctuation(`${modifier} ${category} ${platform}`);
			title = base.includes(SITE_NAME) ? base : `${base} | ${SITE_NAME}`;
			h1 = base || titleBase;
			description = buildIndexDescription(data, pageType, itemCount);
			break;
		}
		case 'archive': {
			const base = pageNumber > 1 ? `${titleBase} - Page ${pageNumber}` : titleBase;
			title = base.includes(SITE_NAME) ? base : `${base} | ${SITE_NAME}`;
			h1 = titleBase;
			description = pageNumber > 1
				? truncate(`${fallbackDescription} Page ${pageNumber} contains a unique slice of the archive.`, 160)
				: fallbackDescription;
			break;
		}
		case 'blog': {
			title = titleBase.includes(SITE_NAME) ? titleBase : `${titleBase} | ${SITE_NAME}`;
			h1 = titleBase;
			description = cleanText(data.description || fallbackDescription);
			break;
		}
		case 'home':
		default: {
			title = titleBase === SITE_NAME ? titleBase : `${titleBase} | ${SITE_NAME}`;
			h1 = titleBase;
			description = cleanText(data.description || fallbackDescription);
		}
	}

	const canonicalURL = generateCanonical(pathname, siteOrigin, {
		lang: lang !== 'en' && translationsServerSide && !isTranslationParamPage ? lang : undefined,
		page: pageNumber > 1 ? pageNumber : undefined,
	});

	const ogTitle = title.replace(` | ${SITE_NAME}`, '');
	const ogDescription = description;

	return {
		title,
		description,
		canonicalURL,
		ogTitle,
		ogDescription,
		ogUrl: canonicalURL,
		robots: isTranslationParamPage && !translationsServerSide ? 'noindex,follow' : robots,
		twitterCard: 'summary_large_image',
		noindex: !indexable || (isTranslationParamPage && !translationsServerSide),
		h1,
	};
}