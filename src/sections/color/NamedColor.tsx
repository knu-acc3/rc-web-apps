"use client";

import type { Locale } from "@/i18n/config";
import { Panel, PanelHeader } from "@/ui/panel";
import { BLACK, WHITE, contrastRatio, formatRatio, harmony, hex as parseHex, type Harmony } from "./lib/color";
import { VARIATION_STEPS, shades, tints } from "./lib/variations";
import { FormatList } from "./ui/FormatList";
import { SwatchStrip } from "./ui/SwatchStrip";

const T = {
  ru: {
    formats: "Коды цвета",
    tints: "Светлее (смешение с белым)",
    shades: "Темнее (смешение с чёрным)",
    harmonies: "Гармонии",
    copy: "Копировать",
    copied: "Скопировано",
    text: "Текст на этом фоне",
    ratio: "контраст",
    h: {
      complementary: "Комплементарная",
      analogous: "Аналоговая",
      triadic: "Триада",
      "split-complementary": "Раздельно-комплементарная",
    } as Record<string, string>,
  },
  en: {
    formats: "Color codes",
    tints: "Tints (mixed with white)",
    shades: "Shades (mixed with black)",
    harmonies: "Harmonies",
    copy: "Copy",
    copied: "Copied",
    text: "Text on this background",
    ratio: "contrast",
    h: {
      complementary: "Complementary",
      analogous: "Analogous",
      triadic: "Triadic",
      "split-complementary": "Split-complementary",
    } as Record<string, string>,
  },
} as const;

const HARMONIES: Harmony[] = ["complementary", "analogous", "triadic", "split-complementary"];

export default function NamedColor({ locale, hex, name }: { locale: Locale; hex: string; name: string }) {
  const t = T[locale];
  const c = parseHex(hex);
  const labels = { copyLabel: t.copy, copiedLabel: t.copied };
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="overflow-hidden">
          <div role="img" aria-label={`${name} ${hex}`} className="h-44 sm:h-56" style={{ background: hex }} />
          <div className="grid grid-cols-2 border-t border-line">
            {[
              { bg: hex, fg: "#FFFFFF", other: WHITE },
              { bg: hex, fg: "#000000", other: BLACK },
            ].map((x, i) => (
              <div key={i} className="px-4 py-3" style={{ background: x.bg, color: x.fg }}>
                <div className="text-lg font-semibold">{name}</div>
                <div className="text-sm">
                  {t.text}: {t.ratio} {formatRatio(contrastRatio(x.other, c))}:1
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-fg">{t.tints}</h2>
          <SwatchStrip items={tints(c).map((x, i) => ({ color: x, caption: `${VARIATION_STEPS[i]}%` }))} {...labels} />
          <h2 className="mt-4 mb-2 text-sm font-semibold text-fg">{t.shades}</h2>
          <SwatchStrip items={shades(c).map((x, i) => ({ color: x, caption: `${VARIATION_STEPS[i]}%` }))} {...labels} />
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-fg">{t.harmonies}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {HARMONIES.map((k) => (
              <div key={k}>
                <div className="mb-1 text-[0.8125rem] text-fg-3">{t.h[k]}</div>
                <SwatchStrip items={harmony(c, k).map((x) => ({ color: x }))} {...labels} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel className="h-fit">
        <PanelHeader title={t.formats} />
        <FormatList color={c} locale={locale} />
      </Panel>
    </div>
  );
}
