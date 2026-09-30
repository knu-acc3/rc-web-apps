import { isLocale, LOCALES } from "@/i18n/config";
import { href } from "@/i18n/config";
import type { PackedEntry } from "@/lib/search";
import { searchEntries } from "@/registry";

export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const packed: PackedEntry[] = searchEntries(locale).map((e) => [e.title, href(locale, e.path), e.hint, e.keywords ?? "", e.glyph ?? "", e.weight ?? 0, e.hue]);
  return new Response(JSON.stringify(packed), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
