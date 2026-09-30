import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { toolGroups, getToolsByGroup, getGroupBySlug } from '@/src/data/tools';
import { LOCALES, type Locale, isLocale, DEFAULT_LOCALE } from '@/src/i18n/index';
import { buildKeywordSet, genericSiteKeywords } from '@/src/seo/keywords';
import { getGroupName, getToolName } from '@/src/data/toolLocalization';
import { groupSeoContentEn } from '@/src/data/groupSeoContent';
import { siteConfig } from '@/src/config/site.config';
import GroupPage from './GroupPage';

export const dynamicParams = false;

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const g of toolGroups) {
      params.push({ locale, slug: g.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const group = getGroupBySlug(slug);
  if (!group) notFound();
  const groupTools = getToolsByGroup(group.id);
  const isEn = locale === 'en';
  const BASE = siteConfig.baseUrl;

  const groupName = getGroupName(group, locale);
  const seoContentEn = groupSeoContentEn[group.id];
  const toolNames = groupTools.slice(0, 5).map(t => getToolName(t, locale)).join(', ');

  const title = isEn
    ? (seoContentEn?.h1 || `${groupName} Online — ${groupTools.length} Free Tools`)
    : `${group.name} онлайн — ${groupTools.length} бесплатных инструментов`;

  const description = isEn
    ? (seoContentEn?.intro?.slice(0, 160) || `${groupTools.length} free online tools: ${toolNames} and more. Works in your browser.`)
    : `${groupTools.length} бесплатных онлайн-инструментов: ${toolNames} и другие. Работают в браузере.`;

  return {
    metadataBase: new URL(BASE),
    title,
    description,
    keywords: buildKeywordSet(
      [
        groupName,
        `${groupName} ${isEn ? 'online' : 'онлайн'}`,
        ...groupTools.slice(0, 6).flatMap(t => {
          const n = getToolName(t, locale);
          return [n, `${n} ${isEn ? 'online' : 'онлайн'}`];
        }),
      ],
      genericSiteKeywords(isEn),
      15
    ),
    openGraph: {
      title: `${title} | ${siteConfig.brandName}`,
      description,
      images: [{ url: `${BASE}/opengraph-image`, width: 1200, height: 630 }],
      siteName: siteConfig.brandName,
      locale: isEn ? 'en_US' : 'ru_RU',
      type: 'website',
      url: `${BASE}/${locale}/group/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.brandName}`,
      description,
      images: [`${BASE}/opengraph-image`],
    },
    alternates: {
      canonical: `${BASE}/${locale}/group/${slug}`,
      languages: {
        ru: `${BASE}/ru/group/${slug}`,
        en: `${BASE}/en/group/${slug}`,
        'x-default': `${BASE}/ru/group/${slug}`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!getGroupBySlug(slug)) notFound();
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return <GroupPage slug={slug} locale={safeLocale} />;
}
