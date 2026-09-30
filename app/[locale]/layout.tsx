import "../globals.css";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import { ThemeRoot } from "@/src/components/providers/ThemeRoot";
import {
  WebVitalsReporter,
  YandexMetrika,
  ConsentAwareVercelAnalytics,
} from "@/src/components/layout/Analytics";
import { LOCALES, Locale } from "@/src/i18n/index";
import { LanguageProvider } from "@/src/i18n/LanguageContext";
import { siteConfig } from "@/src/config/site.config";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["500", "700", "800"],
});

async function loadLocaleMessages(
  locale: Locale,
): Promise<Record<string, unknown>> {
  if (locale === "en") {
    return (await import("@/messages/en.json")).default as Record<
      string,
      unknown
    >;
  }
  return (await import("@/messages/ru.json")).default as Record<
    string,
    unknown
  >;
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  verification: {
    google: "MAC5dCagquZqUeHrwagiZKVNfEExuqSaXBkTL12Tpgo",
    yandex: "d33fa0c3c4e6cdd4",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const safeLocale = (
    LOCALES.includes(locale as Locale) ? locale : "ru"
  ) as Locale;
  const messages = await loadLocaleMessages(safeLocale);

  return (
    <html
      lang={safeLocale}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={manrope.variable}
    >
      <head>
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta
          name="theme-color"
          content="#eef0f4"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#08090c"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content={siteConfig.brandShort} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="distribution" content="global" />
        <meta name="coverage" content="Worldwide" />
        <meta name="rating" content="General" />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        <a href="#main-content" className="skip-to-content">
          {safeLocale === "en" ? "Skip to content" : "Перейти к содержимому"}
        </a>
        <ErrorBoundary>
          <ThemeRoot>
            <LanguageProvider
              initialLocale={safeLocale}
              initialMessages={messages}
            >
              {children}
            </LanguageProvider>
            <ConsentAwareVercelAnalytics />
            <WebVitalsReporter />
            <YandexMetrika />
          </ThemeRoot>
        </ErrorBoundary>
      </body>
    </html>
  );
}
