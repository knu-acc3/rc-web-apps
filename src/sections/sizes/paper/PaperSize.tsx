"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { QuietFacts, plainSpaces } from "../ui/kit";
import { COMMON_DPI, PAPER, PAPER_BY_SLUG, inchesOf, mmToPt, type PaperSeries } from "./data";

const T = {
  ru: {
    format: "Формат",
    orientation: "Ориентация",
    portrait: "Книжная",
    landscape: "Альбомная",
    dpi: "Разрешение",
    custom: "Своё DPI",
    customDpi: "DPI от 1 до 2400",
    badDpi: "DPI — от 1 до 2400",
    mm: "Миллиметры",
    cm: "Сантиметры",
    inch: "Дюймы",
    pt: "Пункты (1/72″)",
    px: "пикселей",
    mp: "Мп",
    copy: "Копировать",
    copied: "Скопировано",
    groups: { a: "ISO A", b: "ISO B", c: "ISO C (конверты)", us: "США и Канада", sra: "SRA (печатные листы)", env: "Конверты", jis: "JIS B (Япония)" },
  },
  en: {
    format: "Format",
    orientation: "Orientation",
    portrait: "Portrait",
    landscape: "Landscape",
    dpi: "Resolution",
    custom: "Custom DPI",
    customDpi: "DPI from 1 to 2400",
    badDpi: "DPI must be 1–2400",
    mm: "Millimetres",
    cm: "Centimetres",
    inch: "Inches",
    pt: "Points (1/72″)",
    px: "pixels",
    mp: "MP",
    copy: "Copy",
    copied: "Copied",
    groups: { a: "ISO A", b: "ISO B", c: "ISO C (envelopes)", us: "US & Canada", sra: "SRA (press sheets)", env: "Envelopes", jis: "JIS B (Japan)" },
  },
} as const;

const GROUPS: PaperSeries[] = ["a", "b", "c", "us", "sra", "env", "jis"];

export default function PaperSize({ locale, format = "a4", dpi: dpi0 = 300 }: { locale: Locale; format?: string; dpi?: number }) {
  const t = T[locale];
  const id = useId();
  const [slug, setSlug] = useState(format);
  const [landscape, setLandscape] = useState(false);
  const [dpiSel, setDpiSel] = useState<string>((COMMON_DPI as readonly number[]).includes(dpi0) ? String(dpi0) : "custom");
  const [custom, setCustom] = useState(String(dpi0));

  const p = PAPER_BY_SLUG.get(slug) ?? PAPER_BY_SLUG.get("a4")!;
  const [iw, ih] = inchesOf(p);
  const [w, h, wi, hi] = landscape ? [p.h, p.w, ih, iw] : [p.w, p.h, iw, ih];
  const dpiNum = dpiSel === "custom" ? parseNumber(custom) : Number(dpiSel);
  const dpiOk = dpiNum !== null && dpiNum >= 1 && dpiNum <= 2400;
  const pw = dpiOk ? Math.round(wi * dpiNum) : null;
  const ph = dpiOk ? Math.round(hi * dpiNum) : null;

  const n = (v: number, d = 2) => plainSpaces(formatNumber(locale, v, { maximumFractionDigits: d }));
  const pair = (a: number, b: number, d = 2) => `${n(a, d)} × ${n(b, d)}`;
  const mmText = `${pair(w, h)} ${locale === "ru" ? "мм" : "mm"}`;
  const pxText = pw !== null && ph !== null ? `${pw} × ${ph}` : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-6">
          <Field label={t.format} htmlFor={`${id}-f`}>
            <Select id={`${id}-f`} value={p.slug} onChange={(e) => setSlug(e.target.value)} size="lg">
              {GROUPS.map((g) => (
                <optgroup key={g} label={t.groups[g]}>
                  {PAPER.filter((x) => x.series === g).map((x) => (
                    <option key={x.slug} value={x.slug}>
                      {x.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <div className="min-w-0" aria-live="polite">
            <div className="text-sm text-fg-2">
              {p.name} · {mmText}
              {pw !== null && ph !== null && ` · ${n((pw * ph) / 1e6, 1)} ${t.mp}`}
            </div>
            <div className="tabular text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              {pxText ? (
                <>
                  {pxText} <span className="text-lg font-medium text-fg-3">{t.px}</span>
                </>
              ) : (
                <span className="text-base font-medium text-err">{t.badDpi}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Segmented
            size="sm"
            label={t.orientation}
            value={landscape ? "l" : "p"}
            onChange={(v) => setLandscape(v === "l")}
            options={[
              { value: "p", label: t.portrait },
              { value: "l", label: t.landscape },
            ]}
          />
          <label htmlFor={`${id}-d`} className="sr-only">
            {t.dpi}
          </label>
          <Select id={`${id}-d`} value={dpiSel} onChange={(e) => setDpiSel(e.target.value)} size="sm" className="w-32">
            {COMMON_DPI.map((d) => (
              <option key={d} value={String(d)}>
                {d} DPI
              </option>
            ))}
            <option value="custom">{t.custom}</option>
          </Select>
          {dpiSel === "custom" && (
            <Input
              aria-label={t.customDpi}
              inputMode="decimal"
              autoComplete="off"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-invalid={!dpiOk}
              size="sm"
              className="tabular w-20"
            />
          )}
          {pxText && <CopyButton value={pxText} label={t.copy} copiedLabel={t.copied} variant="ghost" className="ml-auto" />}
        </div>
      </Panel>

      <QuietFacts
        items={[
          { label: t.mm, value: mmText },
          { label: t.cm, value: `${pair(w / 10, h / 10, 3)} ${locale === "ru" ? "см" : "cm"}` },
          { label: t.inch, value: `${pair(wi, hi)}″` },
          { label: t.pt, value: pair(mmToPt(w), mmToPt(h)) },
        ]}
      />
    </div>
  );
}
