import { puter } from './puter';

export const LANGUAGES: Record<string, string> = {
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'hi': 'Hindi',
  'ar': 'Arabic',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ru': 'Russian',
  'pt': 'Portuguese',
  'it': 'Italian'
};

export async function translateContent(text: string, langCode: string) {
  const langName = LANGUAGES[langCode];
  if (!langName || langCode === 'en') return text;
  
  try {
    // Official-feeling public Google Translate endpoint (GTX)
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`);
    if (!res.ok) throw new Error(`Google API responded with ${res.status}`);
    
    const data = await res.json() as any[];
    // Google returns nested arrays: [[["translated_text", "source_text", null, null, 10], ...], ...]
    if (data && data[0]) {
      return data[0].map((part: any) => part[0]).join('') || text;
    }
    return text;
  } catch (e) {
    console.error("Google Translation Error:", e);
    return text;
  }
}
