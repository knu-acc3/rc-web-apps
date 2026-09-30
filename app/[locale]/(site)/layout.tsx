import type { Metadata } from "next";
import { Header } from "@/src/components/layout/Header";
import { Footer } from "@/src/components/layout/Footer";
import { BottomTabBar } from "@/src/components/layout/BottomTabBar";
import { CookieConsent } from "@/src/components/layout/CookieConsent";
import { DeferredClientProviders } from "@/src/components/layout/DeferredClientProviders";
import { getStats } from "@/src/data/tools";
import { genericSiteKeywords } from "@/src/seo/keywords";
import { siteConfig } from "@/src/config/site.config";

const stats = getStats();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  const BASE = siteConfig.baseUrl;
  const localePath = `${BASE}/${locale}`;

  return {
    metadataBase: new URL(BASE),
    title: {
      default: isEn
        ? `${siteConfig.brandName} — ${stats.totalTools} Free Online Tools`
        : `${siteConfig.brandName} — ${stats.totalTools} бесплатных онлайн-инструмента`,
      template: `%s | ${siteConfig.brandName}`,
    },
    description: isEn
      ? `${stats.totalTools} free online tools: unit converters, calculators, password generator, JSON formatter, word counter, QR codes and more. Work right in your browser.`
      : `${stats.totalTools} бесплатных онлайн-инструмента: конвертеры единиц, калькуляторы, генератор паролей, JSON formatter, счётчик слов, QR-коды и многое другое. Работают прямо в браузере.`,
    keywords: genericSiteKeywords(isEn),
    applicationName: siteConfig.brandName,
    authors: [{ name: siteConfig.brandName, url: BASE }],
    creator: siteConfig.brandName,
    publisher: siteConfig.brandName,
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "ru_RU",
      siteName: siteConfig.brandName,
      url: localePath,
      title: isEn
        ? `${siteConfig.brandName} — ${stats.totalTools} Free Online Tools`
        : `${siteConfig.brandName} — ${stats.totalTools} бесплатных онлайн-инструмента`,
      description: isEn
        ? `Converters, calculators, generators, developer tools and more. ${stats.totalTools} utilities — all free and browser-based.`
        : `Конвертеры, калькуляторы, генераторы, инструменты для разработчиков и многое другое. ${stats.totalTools} утилиты — бесплатно и в браузере.`,
      images: [
        {
          url: `${BASE}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: siteConfig.brandName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isEn
        ? `${siteConfig.brandName} — ${stats.totalTools} Free Online Tools`
        : `${siteConfig.brandName} — ${stats.totalTools} бесплатных онлайн-инструмента`,
      description: isEn
        ? `${stats.totalTools} free online utilities in one place.`
        : `${stats.totalTools} бесплатные онлайн-утилиты в одном месте.`,
      images: [`${BASE}/opengraph-image`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: localePath,
      languages: {
        ru: `${BASE}/ru`,
        en: `${BASE}/en`,
        "x-default": `${BASE}/ru`,
      },
    },
    category: isEn ? "Utilities & Productivity" : "Утилиты и продуктивность",
    other: { "og:locale:alternate": isEn ? "ru_RU" : "en_US" },
  };
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main
        id="main-content"
        className="flex-1 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      >
        {children}
      </main>
      <Footer />
      <BottomTabBar />
      <CookieConsent />
      <DeferredClientProviders />
    </div>
  );
}
