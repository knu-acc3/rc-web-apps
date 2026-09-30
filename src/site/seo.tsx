import type { Metadata } from "next";
import { BRAND, SITE_URL } from "@/config/brand";
import { href, LOCALES, OG_LOCALE, X_DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { PageModel } from "@/registry/types";

export function absoluteUrl(locale: Locale, path: string[]): string {
  return SITE_URL + href(locale, path);
}

export function alternates(path: string[], locale: Locale): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = absoluteUrl(l, path);
  languages["x-default"] = absoluteUrl(X_DEFAULT_LOCALE, path);
  return { canonical: absoluteUrl(locale, path), languages };
}

/** Clamp a meta description to ~160 chars on a word boundary. */
export function clampDescription(text: string, max = 160): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\-–—]+$/, "") + "…";
}

/** Static OG image generated per section (app/og/[locale]/[id]). */
export function ogImage(locale: Locale, id: string) {
  return { url: `${SITE_URL}/og/${locale}/${id}`, width: 1200, height: 630, type: "image/png" };
}

export function pageMetadata(page: PageModel, locale: Locale): Metadata {
  const url = absoluteUrl(locale, page.path);
  const description = clampDescription(page.description);
  const image = ogImage(locale, page.sectionId);
  return {
    title: page.title,
    description,
    alternates: alternates(page.path, locale),
    robots: page.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url,
      title: page.title,
      description,
      siteName: BRAND.name,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: page.title, description, images: [image.url] },
  };
}

export function breadcrumbJsonLd(page: PageModel, locale: Locale) {
  const items = [...page.breadcrumbs, { name: page.h1, path: page.path }];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(locale, c.path),
    })),
  };
}

export function pageJsonLd(page: PageModel, locale: Locale): Record<string, unknown>[] {
  const url = absoluteUrl(locale, page.path);
  const out: Record<string, unknown>[] = [breadcrumbJsonLd(page, locale)];
  const type = page.schemaType ?? (page.tool ? "WebApplication" : "WebPage");
  if (type === "WebApplication") {
    out.push({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: page.h1,
      description: clampDescription(page.description, 300),
      url,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      inLanguage: locale,
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    });
  } else if (type === "CollectionPage") {
    out.push({ "@context": "https://schema.org", "@type": "CollectionPage", name: page.h1, description: page.description, url, inLanguage: locale });
  }
  if (page.faq && page.faq.length > 0 && page.kind === "tool") {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  if (page.jsonLd) out.push(...page.jsonLd);
  return out;
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot break out of the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
