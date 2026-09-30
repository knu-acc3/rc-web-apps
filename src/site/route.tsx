import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, LOCALES, type Locale } from "@/i18n/config";
import { prebuildPaths, resolvePage } from "@/registry";
import { PageView } from "./page-view";
import { pageMetadata } from "./seo";

export type RouteParams = Promise<{ locale: string; section: string; slug?: string; variant?: string }>;

function segmentsOf(p: Awaited<RouteParams>): string[] {
  return [p.section, p.slug, p.variant].filter((x): x is string => typeof x === "string").map((s) => decodeURIComponent(s));
}

function load(p: Awaited<RouteParams>) {
  if (!isLocale(p.locale)) return null;
  const page = resolvePage(p.locale, segmentsOf(p));
  return page ? { page, locale: p.locale as Locale } : null;
}

/** Static params for a route depth (1 = /[section], 2 = /[section]/[slug], 3 = /[section]/[slug]/[variant]). */
export function staticParams(depth: 1 | 2 | 3) {
  const out: Record<string, string>[] = [];
  for (const path of prebuildPaths()) {
    if (path.length !== depth) continue;
    for (const locale of LOCALES) {
      const p: Record<string, string> = { locale, section: path[0] };
      if (depth >= 2) p.slug = path[1];
      if (depth >= 3) p.variant = path[2];
      out.push(p);
    }
  }
  return out;
}

export async function routeMetadata(params: RouteParams): Promise<Metadata> {
  const data = load(await params);
  if (!data) return {};
  return pageMetadata(data.page, data.locale);
}

export async function RoutePage({ params }: { params: RouteParams }) {
  const data = load(await params);
  if (!data) notFound();
  return <PageView page={data.page} locale={data.locale} />;
}
