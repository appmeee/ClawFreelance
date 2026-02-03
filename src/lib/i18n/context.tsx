'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';

import { type Locale, locales } from './config';
import type { Dictionary } from './dictionaries';

// Type for the translation function
type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

// Type for rich translation callbacks - receives children content
type RichTagCallback = (chunks: ReactNode) => ReactNode;

// Type for the rich translation function
type RichTranslationFunction = (
  key: string,
  components: Record<string, RichTagCallback>,
  params?: Record<string, string | number>
) => ReactNode;

interface I18nContextValue {
  locale: Locale;
  dictionary: Dictionary;
  t: TranslationFunction & { rich: RichTranslationFunction };
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : undefined;
}

// Replace template variables {name} or {{name}} with values
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  // Support both {name} and {{name}} syntax
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key) => params[key]?.toString() ?? `{{${key}}}`)
    .replace(/\{(\w+)\}/g, (_, key) => params[key]?.toString() ?? `{${key}}`);
}

// Parse rich text with XML-like tags and replace with React components
// e.g., "Built for <highlight>Agents</highlight>" with { highlight: (c) => <span>{c}</span> }
function parseRichText(
  template: string,
  components: Record<string, RichTagCallback>,
  params?: Record<string, string | number>
): ReactNode {
  // First interpolate any params
  const interpolated = interpolate(template, params);

  // Match XML-like tags: <tagName>content</tagName>
  const tagPattern = /<(\w+)>(.*?)<\/\1>/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = tagPattern.exec(interpolated)) !== null) {
    // Add text before the tag
    if (match.index > lastIndex) {
      parts.push(interpolated.slice(lastIndex, match.index));
    }

    const [, tagName, content] = match;
    const callback = components[tagName];

    if (callback) {
      // Apply the callback to wrap the content
      parts.push(<span key={keyIndex++}>{callback(content)}</span>);
    } else {
      // No callback for this tag, just include the content
      parts.push(content);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last tag
  if (lastIndex < interpolated.length) {
    parts.push(interpolated.slice(lastIndex));
  }

  // If no tags were found, return the interpolated string
  if (parts.length === 0) {
    return interpolated;
  }

  return parts;
}

interface I18nProviderProps {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}

export function I18nProvider({ locale, dictionary, children }: I18nProviderProps) {
  // Base translation function with nested key support and interpolation
  const baseT = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(dictionary as unknown as Record<string, unknown>, key);

      if (value === undefined) {
        // Return key as fallback for missing translations
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation for key: "${key}" in locale: "${locale}"`);
        }
        return key;
      }

      return interpolate(value, params);
    },
    [dictionary, locale]
  );

  // Rich translation function for styled text with XML-like tags
  const richT: RichTranslationFunction = useCallback(
    (
      key: string,
      components: Record<string, RichTagCallback>,
      params?: Record<string, string | number>
    ): ReactNode => {
      const value = getNestedValue(dictionary as unknown as Record<string, unknown>, key);

      if (value === undefined) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation for key: "${key}" in locale: "${locale}"`);
        }
        return key;
      }

      return parseRichText(value, components, params);
    },
    [dictionary, locale]
  );

  // Combine base t with rich method using Object.assign to avoid mutation
  const t = useMemo(() => {
    return Object.assign(
      (key: string, params?: Record<string, string | number>) => baseT(key, params),
      { rich: richT }
    ) as TranslationFunction & { rich: RichTranslationFunction };
  }, [baseT, richT]);

  return <I18nContext.Provider value={{ locale, dictionary, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, dictionary } = useI18n();
  return { t, dictionary };
}

export function useLocale() {
  const { locale } = useI18n();
  return locale;
}

// Hook for switching locales with URL navigation
export function useLocaleSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === currentLocale) return;

      // Replace current locale prefix with new one
      // e.g., /en/tasks -> /es/tasks
      const currentLocalePrefix = `/${currentLocale}`;
      const newPath = pathname.startsWith(currentLocalePrefix)
        ? pathname.replace(currentLocalePrefix, `/${newLocale}`)
        : `/${newLocale}${pathname}`;

      // Store preference in cookie for future visits
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

      router.push(newPath);
    },
    [router, pathname, currentLocale]
  );

  return {
    currentLocale,
    switchLocale,
    availableLocales: locales,
  };
}
