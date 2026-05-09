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
];

// This flag indicates whether full translations are rendered server-side.
// If false, the site uses client-side translations and language query
// parameter pages must be treated as non-indexable (model B).
export const TRANSLATIONS_SERVER_SIDE = false;
