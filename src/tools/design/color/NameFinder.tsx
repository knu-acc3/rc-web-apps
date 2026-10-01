"use client";

import Link from "@/ui/link";
import { useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { Notice, Panel, PanelHeader } from "@/ui/panel";
import { nearestNamed, parseColor, toHex } from "./lib/color";
import { ColorField, Swatch } from "./ui/ColorField";

const T = {
  ru: {
    input: "Ваш цвет: HEX, RGB, HSL или OKLCH",
    title: "Ближайшие названия цветов CSS",
    invalid: "Введите цвет, например #3B82F6",
    distance: "ΔE OK",
    verdict: (d: number) =>
      d < 0.0005 ? "точное совпадение" : d < 0.02 ? "на глаз не отличить" : d < 0.05 ? "очень близко" : d < 0.1 ? "похожий оттенок" : "заметно отличается",
    yours: "Ваш цвет",
  },
  en: {
    input: "Your color: HEX, RGB, HSL or OKLCH",
    title: "Nearest CSS color names",
    invalid: "Enter a color, e.g. #3B82F6",
    distance: "ΔE OK",
    verdict: (d: number) =>
      d < 0.0005 ? "exact match" : d < 0.02 ? "indistinguishable" : d < 0.05 ? "very close" : d < 0.1 ? "similar hue" : "noticeably different",
    yours: "Your color",
  },
} as const;

export default function NameFinder({ locale, initial = "#3B82F6" }: { locale: Locale; initial?: string }) {
  const t = T[locale];
  const [text, setText] = useState(initial);
  const c = parseColor(text);
  const list = c ? nearestNamed(c, 8) : [];
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <ColorField label={t.input} value={text} onChange={setText} locale={locale} size="lg" />
        {c && (
          <div className="flex items-center gap-3">
            <Swatch color={toHex(c)} className="h-20 w-full" label={`${t.yours} ${toHex(c)}`} />
          </div>
        )}
      </Panel>
      <Panel>
        <PanelHeader title={t.title} />
        {c ? (
          <ol className="divide-y divide-line" aria-live="polite">
            {list.map((n, i) => (
              <li key={n.name} className="flex items-center gap-3 px-4 py-2.5">
                <Swatch color={n.hex} className="size-10 shrink-0" />
                <span className="min-w-0 flex-1">
                  <Link href={href(locale, ["color", n.name])} className={i === 0 ? "font-semibold text-accent hover:underline" : "font-medium text-fg hover:text-accent"}>
                    {n.name}
                  </Link>
                  <span className="block text-sm text-fg-3">
                    <span className="font-mono">{n.hex}</span> · {t.verdict(n.distance)}
                  </span>
                </span>
                <span className="tabular shrink-0 text-sm text-fg-3" title={t.distance}>
                  {n.distance.toFixed(3)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <Notice className="m-4">{t.invalid}</Notice>
        )}
      </Panel>
    </div>
  );
}
