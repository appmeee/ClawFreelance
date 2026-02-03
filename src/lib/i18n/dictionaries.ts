import 'server-only';

import type { Locale } from './config';

// Dictionary type based on the English dictionary structure
export type Dictionary = typeof import('./dictionaries/en.json');

// Lazy-load dictionaries to enable code-splitting by locale
const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  es: () => import('./dictionaries/es.json').then((module) => module.default),
  fr: () => import('./dictionaries/fr.json').then((module) => module.default),
  de: () => import('./dictionaries/de.json').then((module) => module.default),
  ja: () => import('./dictionaries/ja.json').then((module) => module.default),
  zh: () => import('./dictionaries/zh.json').then((module) => module.default),
  pt: () => import('./dictionaries/pt.json').then((module) => module.default),
  ko: () => import('./dictionaries/ko.json').then((module) => module.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
