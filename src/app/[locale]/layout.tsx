import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';

import { isValidLocale, type Locale } from '@/lib/i18n/config';
import { I18nProvider } from '@/lib/i18n/context';
import { getDictionary } from '@/lib/i18n/dictionaries';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'fr' },
    { locale: 'de' },
    { locale: 'ja' },
    { locale: 'zh' },
    { locale: 'pt' },
    { locale: 'ko' },
  ];
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale - return 404 for invalid locales
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load dictionary for this locale
  const dictionary = await getDictionary(locale as Locale);

  // Note: html/body are in root layout - we just provide the content wrapper
  return (
    <div className={`${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}>
      <I18nProvider locale={locale as Locale} dictionary={dictionary}>
        {children}
      </I18nProvider>
    </div>
  );
}
