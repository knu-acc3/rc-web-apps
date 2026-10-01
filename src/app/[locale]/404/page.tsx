import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, LOCALES } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { NotFoundView } from "@/site/not-found-view";

/** Target of the proxy for unknown URLs (served with status 404), so a 404 is a full, server-rendered page. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: { absolute: ui(locale).notFoundTitle }, robots: { index: false, follow: true } };
}

export default async function NotFoundPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <NotFoundView locale={locale} />;
}
