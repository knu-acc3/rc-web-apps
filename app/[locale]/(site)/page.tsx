import { Metadata } from "next";
import { getStats } from "@/src/data/tools";
import { type Locale, isLocale, DEFAULT_LOCALE } from "@/src/i18n/index";
import { buildKeywordSet, genericSiteKeywords } from "@/src/seo/keywords";
import { siteConfig } from "@/src/config/site.config";
import HomePage from "./HomePage";

const stats = getStats();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const base = siteConfig.baseUrl;

  const title = isEn
    ? `${siteConfig.brandName} — 3,000+ Free Online Tools, World Clocks & Digital Catalogs`
    : `${siteConfig.brandName} — более 3 000 онлайн-инструментов, мировое время и справочники`;
  const description = isEn
    ? `Over 3,000 free online tools and references: ${stats.totalTools} browser utilities, world time across 300+ cities, 1:1 actual size calibrator, 1,500+ emojis, special symbols, timers and 65 system diagnostics. Fast, private, no install.`
    : `Более 3 000 бесплатных онлайн-инструментов и сервисов: ${stats.totalTools} утилит, мировое время в 300+ городах, калибровка экранов 1:1, 1 500+ эмодзи, спецсимволы, таймеры и 65 тестов оборудования. Быстро и приватно.`;

  return {
    metadataBase: new URL(base),
    title: { absolute: title },
    description,
    keywords: buildKeywordSet(
      isEn
        ? [
            "best online tools",
            "free browser tools",
            "daily productivity tools",
            "web utilities collection",
            "converter calculator generator",
            "developer utilities online",
          ]
        : [
            "лучшие онлайн инструменты",
            "бесплатные инструменты в браузере",
            "ежедневные инструменты для работы",
            "коллекция веб утилит",
            "конвертер калькулятор генератор",
            "утилиты для разработчиков онлайн",
          ],
      genericSiteKeywords(isEn),
      15,
    ),
    openGraph: {
      title,
      description,
      url: `${base}/${locale}`,
      type: "website",
      locale: isEn ? "en_US" : "ru_RU",
      siteName: siteConfig.brandName,
      images: [
        {
          url: `${base}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: siteConfig.brandName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${base}/opengraph-image`],
    },
    alternates: {
      canonical: `${base}/${locale}`,
      languages: {
        ru: `${base}/ru`,
        en: `${base}/en`,
        "x-default": `${base}/ru`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return <HomePage locale={safeLocale} />;
}
