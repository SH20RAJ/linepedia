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
  if (!langName) return text;
  
  if (typeof puter === 'undefined') return text;

  try {
    const response = await puter.ai.chat(`Translate the following poem content into ${langName}. Maintain the poetic feel and rhythm. Only return the translated text:\n\n${text}`);
    return response?.text || text;
  } catch (e) {
    console.error("Translation Error:", e);
    return text;
  }
}
