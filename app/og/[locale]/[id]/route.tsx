import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, BRAND_MARK } from "@/config/brand";
import { isLocale, LOCALES, tr } from "@/i18n/config";
import { allSections, getSection } from "@/registry";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  const ids = ["home", ...allSections().map((s) => s.id)];
  return LOCALES.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700 }[]> | null = null;
function loadFonts() {
  if (!fonts) {
    const dir = join(process.cwd(), "src", "assets", "og");
    fonts = Promise.all(
      (["latin", "cyrillic"] as const).flatMap((subset) =>
        ([400, 700] as const).map(async (weight) => ({ name: "Onest", weight, data: await readFile(join(dir, `onest-${subset}-${weight}.woff`)) })),
      ),
    );
  }
  return fonts;
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) return new Response("Not found", { status: 404 });
  const section = id === "home" ? null : getSection(id);
  const title = section ? tr(section.name, locale) : BRAND.name;
  const subtitle = section ? tr(section.description, locale) : BRAND.tagline[locale];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F6F6F3", padding: "72px 80px", fontFamily: "Onest" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: BRAND.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700 }}>
            {BRAND_MARK}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#15161A" }}>{BRAND.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: section ? 84 : 72, fontWeight: 700, color: "#15161A", lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          <div style={{ fontSize: 34, color: "#55575E", lineHeight: 1.3, maxWidth: 1000 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", height: 10, width: 220, borderRadius: 5, background: BRAND.color }} />
      </div>
    ),
    { width: 1200, height: 630, fonts: await loadFonts() },
  );
}
