import type { SiteConfig } from '@/src/types/config';

export * from '@/src/types/config';

export const siteConfig: SiteConfig = {
  brandName: 'RC Web App',
  brandShort: 'RC',
  brandTagline: {
    ru: 'Универсальный портал онлайн-инструментов, мирового времени и цифровых справочников',
    en: 'Universal web portal for online tools, world time and digital catalogs',
  },
  domain: 'rcwebapp.com',
  baseUrl: 'https://rcwebapp.com',
  supportEmail: 'support@rcwebapp.com',
  author: {
    name: 'RC Web App Engineering Team',
    url: 'https://rcwebapp.com/about',
    email: 'team@rcwebapp.com',
    github: 'https://github.com/rcwebapp/rc-web-app',
  },
  defaultLocale: 'ru',
  locales: ['ru', 'en'] as const,
  theme: {
    defaultTheme: 'system',
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    borderRadius: '0.5rem',
  },
  social: {
    githubRepo: 'https://github.com/rcwebapp/rc-web-app',
  },
  features: {
    enablePwa: true,
    enableAnalytics: false,
    enableWasmTools: true,
    maxUploadSizeMb: 100,
  },
} as const;

if (!siteConfig.baseUrl.startsWith('http://') && !siteConfig.baseUrl.startsWith('https://')) {
  throw new Error('Invalid baseUrl in siteConfig: must start with http:// or https://');
}

export default siteConfig;
