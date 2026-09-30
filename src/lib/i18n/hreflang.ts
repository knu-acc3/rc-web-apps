import { siteConfig } from '@/src/config/site.config';

export type SupportedLocale = 'ru' | 'en';

export interface HreflangLink {
  readonly rel: 'alternate';
  readonly hreflang: SupportedLocale | 'x-default';
  readonly href: string;
}

export interface LocaleRouteMap {
  readonly ru: string;
  readonly en: string;
}

export function buildHreflangLinks(rawPath: string): HreflangLink[] {
  // Strip existing locale prefix if present
  let cleanPath = rawPath.replace(/^\/(ru|en)(\/|$)/, '/');
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  if (cleanPath === '/') {
    cleanPath = '';
  }

  const baseUrl = siteConfig.baseUrl;

  return [
    {
      rel: 'alternate',
      hreflang: 'ru',
      href: `${baseUrl}/ru${cleanPath}`,
    },
    {
      rel: 'alternate',
      hreflang: 'en',
      href: `${baseUrl}/en${cleanPath}`,
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${baseUrl}/en${cleanPath}`,
    },
  ];
}
