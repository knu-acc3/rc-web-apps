import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tools, getToolBySlug, toolGroups } from '@/src/data/tools';
import { LOCALES, type Locale, isLocale, DEFAULT_LOCALE } from '@/src/i18n/index';
import { buildKeywordSet, genericSiteKeywords } from '@/src/seo/keywords';
import { siteConfig } from '@/src/config/site.config';
import {
  getToolSeoTitle,
  getToolSeoDescription,
  getToolName,
  getToolDescription,
  getGroupName,
} from '@/src/data/toolLocalization';
import ToolPage from './ToolPage';

export const dynamicParams = false;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const t of tools.filter(tool => tool.implemented && !tool.hidden)) {
      params.push({ locale, slug: t.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.implemented !== true || tool.hidden === true || tool.slug !== slug) notFound();
  const group = toolGroups.find(g => g.id === tool.groupId);
  const isEn = locale === 'en';
  const BASE = siteConfig.baseUrl;

  const title = getToolSeoTitle(tool, locale);
  const description = getToolSeoDescription(tool, locale);
  const canonicalSlug = tool.slug;

  return {
    metadataBase: new URL(BASE),
    title,
    description,
    keywords: buildKeywordSet(
      [
        ...(tool.keywords || []),
        getToolName(tool, locale),
        `${getToolName(tool, locale)} ${isEn ? 'online' : 'онлайн'}`,
        `${canonicalSlug} ${isEn ? 'tool' : 'инструмент'}`,
        isEn ? 'online tool' : 'онлайн инструмент',
        isEn ? 'free web app' : 'бесплатный веб инструмент',
        getToolDescription(tool, locale),
        group ? getGroupName(group, locale) : '',
        siteConfig.brandName,
      ],
      genericSiteKeywords(isEn),
      15
    ),
    openGraph: {
      title: `${title} | ${siteConfig.brandName}`,
      description,
      images: [{ url: `${BASE}/${locale}/tools/${canonicalSlug}/opengraph-image`, width: 1200, height: 630 }],
      url: `${BASE}/${locale}/tools/${canonicalSlug}`,
      type: 'website',
      locale: isEn ? 'en_US' : 'ru_RU',
      siteName: siteConfig.brandName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.brandName}`,
      description,
      images: [`${BASE}/${locale}/tools/${canonicalSlug}/opengraph-image`],
    },
    alternates: {
      canonical: `${BASE}/${locale}/tools/${canonicalSlug}`,
      languages: {
        ru: `${BASE}/ru/tools/${canonicalSlug}`,
        en: `${BASE}/en/tools/${canonicalSlug}`,
        'x-default': `${BASE}/ru/tools/${canonicalSlug}`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    other: { 'og:locale:alternate': isEn ? 'ru_RU' : 'en_US' },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.implemented !== true || tool.hidden === true || tool.slug !== slug) notFound();
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return <ToolPage slug={slug} locale={safeLocale} />;
}
