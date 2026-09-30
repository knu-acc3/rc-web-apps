import type { Metadata } from 'next';
import { type Locale, isLocale, DEFAULT_LOCALE } from '@/src/i18n/index';
import { siteConfig } from '@/src/config/site.config';

const BASE_URL = siteConfig.baseUrl;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const isEn = safeLocale === 'en';

  return {
    metadataBase: new URL(BASE_URL),
    title: isEn ? 'Favorites' : 'Избранное',
    description: isEn
      ? `Your locally saved ${siteConfig.brandName} favorites.`
      : `Сохранённые в браузере избранные инструменты ${siteConfig.brandName}.`,
    alternates: {
      canonical: `${BASE_URL}/${safeLocale}/favorites`,
    },
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
