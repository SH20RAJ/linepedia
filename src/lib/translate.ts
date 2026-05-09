import { puter } from './puter';
import { SUPPORTED_LANGUAGES, TRANSLATIONS_SERVER_SIDE } from './i18n-config';

export const LANGUAGES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
  ru: 'Russian',
  pt: 'Portuguese',
  it: 'Italian',
};

// Expose whether translations are server-side so templates can decide
// on hreflang and indexability behavior.
export const TRANSLATIONS_ARE_SERVER_SIDE = Boolean(TRANSLATIONS_SERVER_SIDE);

// Returns translated text on success, or null on failure/no-translation.
export async function translateContent(text: string, langCode: string) {
  const langName = LANGUAGES[langCode];
  if (!langName || langCode === 'en') return null;

  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!res.ok) throw new Error(`Google API responded with ${res.status}`);

    const data = (await res.json()) as any[];
    if (data && data[0]) {
      const out = data[0].map((part: any) => part[0]).join('') || null;
      return out;
    }
    return null;
  } catch (e) {
    console.error('Google Translation Error:', e);
    return null;
  }
}
