import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { BRAND, SITE_URL } from "@/config/brand";
import { isLocale, LOCALES, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { Footer } from "@/site/footer";
import { Header } from "@/site/header";
import { THEME_SCRIPT } from "@/site/theme";
import { Analytics } from "@/site/analytics";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = (isLocale(locale) ? locale : "ru") as Locale;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: BRAND.name, template: `%s — ${BRAND.name}` },
    description: BRAND.tagline[l],
    applicationName: BRAND.name,
    manifest: `/manifest.webmanifest`,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-touch-icon.png",
    },
    verification: {
      google: BRAND.verification.google || undefined,
      yandex: BRAND.verification.yandex || undefined,
      other: BRAND.verification.bing ? { "msvalidate.01": BRAND.verification.bing } : undefined,
    },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
  ],
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = ui(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preload" href="/fonts/onest-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {locale === "ru" && <link rel="preload" href="/fonts/onest-cyrillic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />}
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[8px] focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          {t.skipToContent}
        </a>
        <Header locale={locale} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
        <Analytics />
      </body>
    </html>
  );
}
