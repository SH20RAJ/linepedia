import { getAllCategories, getCategoryPoems } from '../lib/cdn';

export type SeoModifier =
  | 'short'
  | 'deep'
  | 'attitude'
  | '2-line'
  | 'aesthetic'
  | 'romantic'
  | 'sad';

export type SeoPlatform =
  | 'for-instagram'
  | 'for-whatsapp'
  | 'copy-paste'
  | 'in-hindi'
  | 'for-her'
  | 'for-him';

export interface SeoCombo {
  categorySlug: string;
  categoryName: string;
  modifier: SeoModifier;
  platform?: SeoPlatform;
  poemCount: number;
}

const MODIFIERS: SeoModifier[] = [
  'short', 'deep', 'attitude', '2-line', 'aesthetic', 'romantic', 'sad'
];

const PLATFORMS: SeoPlatform[] = [
  'for-instagram', 'for-whatsapp', 'copy-paste', 'in-hindi', 'for-her', 'for-him'
];

let comboCache: SeoCombo[] | null = null;

export function getSeoModifiers(): SeoModifier[] {
  return MODIFIERS;
}

export function getSeoPlatforms(): SeoPlatform[] {
  return PLATFORMS;
}

export function isSeoModifier(modifier: string): modifier is SeoModifier {
  return MODIFIERS.includes(modifier as SeoModifier);
}

export function isSeoPlatform(platform: string): platform is SeoPlatform {
  return PLATFORMS.includes(platform as SeoPlatform);
}

export function getModifierLabel(modifier: SeoModifier): string {
  return modifier.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function getPlatformLabel(platform: SeoPlatform): string {
  if (platform === 'in-hindi') return 'in Hindi';
  if (platform === 'copy-paste') return '(Copy & Paste)';
  return platform.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function firstLine(content: string): string {
  const line = String(content || '').split('\n')[0] || '';
  return line.trim();
}

// Predict whether a poem fits a modifier/platform heuristically
export function pickIntentPoems(poems: any[], modifier: SeoModifier, platform?: SeoPlatform): any[] {
  let filtered = [...poems];
  
  if (modifier === 'short') {
    filtered = filtered.filter(p => firstLine(p.content).length < 50);
  } else if (modifier === '2-line') {
    filtered = filtered.filter(p => String(p.content).split('\n').filter(Boolean).length === 2);
  } else if (modifier === 'deep') {
    filtered = filtered.filter(p => firstLine(p.content).length > 60);
  } else if (modifier === 'attitude') {
     // rudimentary heuristic for attitude
     filtered = filtered.filter(p => !p.content.toLowerCase().includes('love') && p.content.length < 100);
  } else if (modifier === 'aesthetic') {
     filtered = filtered.filter(p => p.content.length < 80);
  } else if (modifier === 'romantic' || modifier === 'sad') {
      // Just slice top
      filtered = filtered.slice(0, 80);
  }

  // Fallback to avoid empty pages if heuristic overfilters
  if (filtered.length < 5) {
     filtered = [...poems].slice(0, 40);
  }

  // Platform filtering (just a thin slice)
  if (platform === 'for-instagram') {
    filtered = filtered.filter(p => p.content.length < 120);
  }

  // Fallback again
  if (filtered.length < 5) {
     filtered = [...poems].slice(0, 40);
  }

  return filtered.slice(0, 60);
}

export async function getSeoCombos(): Promise<SeoCombo[]> {
  if (comboCache) return comboCache;

  const categories = await getAllCategories();
  const combos: SeoCombo[] = [];

  for (const category of categories as any[]) {
    const poems = await getCategoryPoems(category.slug);
    
    // We only create combinations if the category has enough base poems
    if (poems.length < 15) continue;

    for (const modifier of MODIFIERS) {
      const filteredForModifier = pickIntentPoems(poems, modifier);
      if (filteredForModifier.length >= 5) {
        combos.push({
          categorySlug: category.slug,
          categoryName: category.name,
          modifier,
          poemCount: filteredForModifier.length
        });

        // Also add platform combinations randomly or fully
        for (const platform of PLATFORMS) {
            const filteredForPlatform = pickIntentPoems(poems, modifier, platform);
            if (filteredForPlatform.length >= 5) {
               combos.push({
                  categorySlug: category.slug,
                  categoryName: category.name,
                  modifier,
                  platform,
                  poemCount: filteredForPlatform.length
               });
            }
        }
      }
    }
  }

  comboCache = combos;
  return combos;
}

export async function findSeoCombo(
  categorySlug: string,
  modifierSlug: string,
  platformSlug?: string
): Promise<SeoCombo | null> {
  const combos = await getSeoCombos();
  return (
    combos.find(
      (combo) => 
         combo.categorySlug === categorySlug && 
         combo.modifier === modifierSlug && 
         (platformSlug ? combo.platform === platformSlug : !combo.platform)
    ) || null
  );
}

export async function getSeoUrls(site: string): Promise<string[]> {
  const combos = await getSeoCombos();
  const base = site.endsWith('/') ? site : `${site}/`;
  const urls: string[] = [];

  for (const combo of combos) {
    if (combo.platform) {
       urls.push(`${base}${combo.categorySlug}/${combo.modifier}/${combo.platform}/`);
    } else {
       urls.push(`${base}${combo.categorySlug}/${combo.modifier}/`);
    }
  }

  return urls;
}
