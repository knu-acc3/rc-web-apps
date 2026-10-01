"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { mix, parseColor, toGamut, toHex, type Color, type MixSpace } from "../lib/color";
import { ColorField } from "../ui/ColorField";
import { SwatchStrip } from "../ui/SwatchStrip";
import { NumberSlider } from "@/tools/design/css/ui/kit";

const SPACES: MixSpace[] = ["oklab", "oklch", "srgb-linear", "srgb"];
const SPACE_LABEL: Record<MixSpace, string> = { oklab: "OKLab", oklch: "OKLCH", "srgb-linear": "Linear sRGB", srgb: "sRGB" };

const T = {
  ru: {
    a: "Первый цвет",
    b: "Второй цвет",
    steps: "Шагов",
    space: "Пространство смешивания",
    mid: "Середина (50 %)",
    compare: "Те же цвета в других пространствах",
    copy: "Копировать",
    copied: "Скопировано",
    invalid: "Введите оба цвета",
  },
  en: {
    a: "First color",
    b: "Second color",
    steps: "Steps",
    space: "Mixing space",
    mid: "Midpoint (50%)",
    compare: "The same colors in other spaces",
    copy: "Copy",
    copied: "Copied",
    invalid: "Enter both colors",
  },
} as const;

export function mixSteps(a: Color, b: Color, steps: number, space: MixSpace): Color[] {
  return Array.from({ length: steps }, (_, i) => toGamut(mix(a, b, steps === 1 ? 0 : i / (steps - 1), space)));
}

export default function ColorMixer({ locale, a: a0 = "#808080", b: b0 = "#0000FF" }: { locale: Locale; a?: string; b?: string }) {
  const t = T[locale];
  const [aText, setA] = useState(a0);
  const [bText, setB] = useState(b0);
  const [steps, setSteps] = useState(7);
  const [space, setSpace] = useState<MixSpace>("oklab");
  const a = parseColor(aText);
  const b = parseColor(bText);
  const list = a && b ? mixSteps(a, b, steps, space) : null;
  const mid = a && b ? toHex(toGamut(mix(a, b, 0.5, space))) : "";
  const css = a && b ? `color-mix(in ${space}, ${toHex(a)}, ${toHex(b)})` : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <ColorField label={t.a} value={aText} onChange={setA} locale={locale} size="lg" />
          <ColorField label={t.b} value={bText} onChange={setB} locale={locale} size="lg" />
        </div>
        <div className="mt-4 grid items-end gap-x-6 gap-y-4 md:grid-cols-[auto_minmax(0,1fr)]">
          <Segmented label={t.space} value={space} onChange={setSpace} options={SPACES.map((s) => ({ value: s, label: SPACE_LABEL[s] }))} size="sm" />
          <NumberSlider label={t.steps} value={steps} min={2} max={20} onChange={(v) => setSteps(Math.min(20, Math.max(2, Math.round(v))))} />
        </div>
      </Panel>

      {list ? (
        <>
          <div>
            <SwatchStrip items={list.map((c, i) => ({ color: c, caption: `${Math.round((i / (steps - 1)) * 100)}%` }))} copyLabel={t.copy} copiedLabel={t.copied} tall />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-sm text-fg-2">
                {t.mid}: <code className="font-mono text-base font-semibold text-fg">{mid}</code>
              </span>
              <code className="min-w-0 font-mono text-sm break-all text-fg-3">{css}</code>
              <CopyButton value={css} label={t.copy} copiedLabel={t.copied} size="sm" variant="secondary" />
            </div>
          </div>
          <section>
            <h2 className="mb-2 text-sm font-semibold text-fg-2">{t.compare}</h2>
            <div className="flex flex-col gap-2">
              {SPACES.filter((s) => s !== space).map((s) => (
                <div key={s} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3">
                  <span className="text-sm text-fg-3">{SPACE_LABEL[s]}</span>
                  <div className="flex h-8 overflow-hidden rounded-[0.75rem] shadow-card" aria-hidden>
                    {mixSteps(a!, b!, steps, s).map((c, i) => (
                      <span key={i} className="flex-1" style={{ background: toHex(c) }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <p className="text-fg-3">{t.invalid}</p>
      )}
    </div>
  );
}
