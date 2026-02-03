// i18n exports - client-safe (no server-only imports)
export {
  defaultLocale,
  isValidLocale,
  type Locale,
  localeFlags,
  localeNames,
  locales,
} from './config';
export { I18nProvider, useI18n, useLocale, useLocaleSwitch, useTranslation } from './context';

// Re-export Dictionary type (type-only is safe for client)
export type { Dictionary } from './dictionaries';
