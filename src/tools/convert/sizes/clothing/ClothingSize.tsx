"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Field, Select } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { Segmented } from "@/ui/segmented";
import { ResultTiles, plainSpaces } from "../ui/kit";
import { MEN, SHIRTS, WOMEN, menByMeasure, shirtByNeck, span, womenByMeasure, type ClothingChart } from "./data";

type Col = { key: string; label: Record<Locale, string>; get: (i: number) => string };

const T = {
  ru: {
    chart: "Таблица",
    charts: { "women-tops": "Жен. верх", "women-bottoms": "Жен. низ", "men-tops": "Муж. верх", "men-bottoms": "Муж. низ", "men-shirts": "Рубашки" },
    system: "Система",
    size: "Размер",
    byMeasure: "Подобрать по меркам",
    bust: "Грудь, см",
    chest: "Грудь, см",
    waist: "Талия, см",
    hips: "Бёдра, см",
    neck: "Шея, см",
    outOfRange: "Мерки вне таблицы",
    w: { bust: "Грудь", chest: "Грудь", waist: "талия", hips: "бёдра" },
    cm: "см",
    note: "Соответствия примерные: сверяйтесь с таблицей бренда. Буквенные размеры у европейских брендов часто на одну букву больше.",
  },
  en: {
    chart: "Chart",
    charts: { "women-tops": "Women tops", "women-bottoms": "Women bottoms", "men-tops": "Men tops", "men-bottoms": "Men bottoms", "men-shirts": "Shirts" },
    system: "System",
    size: "Size",
    byMeasure: "Find by measurements",
    bust: "Bust, cm",
    chest: "Chest, cm",
    waist: "Waist, cm",
    hips: "Hips, cm",
    neck: "Neck, cm",
    outOfRange: "Measurements are outside the chart",
    w: { bust: "Bust", chest: "Chest", waist: "waist", hips: "hips" },
    cm: "cm",
    note: "Equivalents are approximate — check the brand's chart. European brands often label the same size one letter larger.",
  },
} as const;

const rng = (v: number) => `${span(v)[0]}–${span(v)[1]}`;

function columns(chart: ClothingChart, locale: Locale): Col[] {
  const inch = (v: number) => plainSpaces(formatNumber(locale, v, { maximumFractionDigits: 2 }));
  if (chart === "men-shirts")
    return [
      { key: "collar", label: { ru: "Ворот, см", en: "Collar, cm" }, get: (i) => String(SHIRTS[i].collar) },
      { key: "collarIn", label: { ru: "Ворот, дюймы", en: "Collar, in" }, get: (i) => inch(SHIRTS[i].collarIn) },
      { key: "int", label: { ru: "INT", en: "Letter" }, get: (i) => SHIRTS[i].int },
    ];
  if (chart === "men-tops" || chart === "men-bottoms") {
    const base: Col[] = [
      { key: "ru", label: { ru: "RU", en: "RU" }, get: (i) => String(MEN[i].ru) },
      { key: "int", label: { ru: "INT", en: "Letter" }, get: (i) => MEN[i].int },
      { key: "eu", label: { ru: "EU / IT", en: "EU / IT" }, get: (i) => String(MEN[i].eu) },
    ];
    return chart === "men-tops"
      ? [...base, { key: "us", label: { ru: "US / UK", en: "US / UK" }, get: (i) => String(MEN[i].chestIn) }]
      : [...base, { key: "w", label: { ru: "Джинсы W", en: "Jeans W" }, get: (i) => `W${MEN[i].w}` }];
  }
  const cols: Col[] = [
    { key: "ru", label: { ru: "RU", en: "RU" }, get: (i) => String(WOMEN[i].ru) },
    { key: "int", label: { ru: "INT", en: "Letter" }, get: (i) => WOMEN[i].int },
    { key: "de", label: { ru: "EU / DE", en: "EU / DE" }, get: (i) => String(WOMEN[i].de) },
    { key: "fr", label: { ru: "FR", en: "FR" }, get: (i) => String(WOMEN[i].fr) },
    { key: "it", label: { ru: "IT", en: "IT" }, get: (i) => String(WOMEN[i].it) },
    { key: "uk", label: { ru: "UK", en: "UK" }, get: (i) => String(WOMEN[i].uk) },
    { key: "us", label: { ru: "US", en: "US" }, get: (i) => String(WOMEN[i].us) },
  ];
  return chart === "women-bottoms" ? [...cols, { key: "w", label: { ru: "Джинсы W", en: "Jeans W" }, get: (i) => `W${WOMEN[i].w}` }] : cols;
}

const rowsCount = (chart: ClothingChart) => (chart === "men-shirts" ? SHIRTS.length : chart.startsWith("men") ? MEN.length : WOMEN.length);

function initialIndex(chart: ClothingChart, ru?: number, collar?: number): number {
  if (chart === "men-shirts") return Math.max(0, SHIRTS.findIndex((r) => r.collar === (collar ?? 41)));
  const rows = chart.startsWith("men") ? MEN : WOMEN;
  const i = rows.findIndex((r) => r.ru === ru);
  return i >= 0 ? i : 2;
}

interface Props {
  locale: Locale;
  chart?: ClothingChart;
  ru?: number;
  collar?: number;
}

export default function ClothingSize({ locale, chart: c0 = "women-tops", ru, collar }: Props) {
  const t = T[locale];
  const id = useId();
  const [chart, setChart] = useState<ClothingChart>(c0);
  const [idx, setIdx] = useState(() => initialIndex(c0, ru, collar));
  const [sys, setSys] = useState("ru");
  const [m, setM] = useState({ a: "", waist: "", hips: "" });

  const cols = columns(chart, locale);
  const col = cols.find((c) => c.key === sys) ?? cols[0];
  const i = Math.min(idx, rowsCount(chart) - 1);

  function changeChart(next: ClothingChart) {
    const sameFamily = next.startsWith("men") === chart.startsWith("men") && next !== "men-shirts" && chart !== "men-shirts";
    setChart(next);
    setIdx(sameFamily ? i : initialIndex(next));
    setSys(next === "men-shirts" ? "collar" : "ru");
    setM({ a: "", waist: "", hips: "" });
  }

  // Measurement finder: fills the size selection when the numbers map to a row.
  const num = (s: string) => {
    const v = parseNumber(s);
    return v !== null && v > 0 ? v : undefined;
  };
  const anyMeasure = m.a.trim() || m.waist.trim() || m.hips.trim();
  let found: number | null = null;
  if (anyMeasure) {
    if (chart === "men-shirts") {
      const r = num(m.a) ? shirtByNeck(num(m.a)!) : null;
      found = r ? SHIRTS.indexOf(r) : null;
    } else if (chart.startsWith("women")) {
      const r = womenByMeasure(chart === "women-tops" ? "tops" : "bottoms", { bust: num(m.a), waist: num(m.waist), hips: num(m.hips) });
      found = r ? WOMEN.indexOf(r) : null;
    } else {
      const r = menByMeasure(chart === "men-tops" ? "tops" : "bottoms", { chest: num(m.a), waist: num(m.waist), hips: num(m.hips) });
      found = r ? MEN.indexOf(r) : null;
    }
  }
  const row = found ?? i;

  const girths = chart === "men-shirts" ? null : chart.startsWith("women") ? WOMEN[row] : MEN[row];
  const body = girths
    ? `${"bust" in girths ? t.w.bust : t.w.chest} ${rng("bust" in girths ? girths.bust : girths.chest)} ·${t.w.waist} ${rng(girths.waist)} · ${t.w.hips} ${rng(girths.hips)} ${t.cm}`
    : null;

  const measureFields: { key: "a" | "waist" | "hips"; label: string }[] =
    chart === "men-shirts"
      ? [{ key: "a", label: t.neck }]
      : chart === "women-tops"
        ? [
            { key: "a", label: t.bust },
            { key: "waist", label: t.waist },
          ]
        : chart === "men-tops"
          ? [
              { key: "a", label: t.chest },
              { key: "waist", label: t.waist },
            ]
          : [
              { key: "waist", label: t.waist },
              { key: "hips", label: t.hips },
            ];

  return (
    <Panel className="p-4 sm:p-6">
      <Segmented label={t.chart} value={chart} onChange={changeChart} options={(Object.keys(t.charts) as ClothingChart[]).map((k) => ({ value: k, label: t.charts[k] }))} />

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <label htmlFor={`${id}-s`} className="text-sm font-medium text-fg-2">
              {t.system}
            </label>
            <Select id={`${id}-s`} value={col.key} onChange={(e) => setSys(e.target.value)} variant="tonal" fit="selected" size="lg">
              {cols.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label[locale]}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-0">
            <div id={`${id}-v`} className="mb-1 text-sm font-medium text-fg-2">
              {t.size}
            </div>
            <ScrollRow label={t.size} role="radiogroup" rowClassName="gap-1.5">
              {Array.from({ length: rowsCount(chart) }, (_, k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={k === row}
                  onClick={() => {
                    setIdx(k);
                    setM({ a: "", waist: "", hips: "" });
                  }}
                  className="chip tabular min-w-12 justify-center text-base!"
                >
                  {col.get(k)}
                </button>
              ))}
            </ScrollRow>
          </div>

          <Fold variant="inline" title={t.byMeasure}>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              {measureFields.map((f) => (
                <Field key={f.key} label={f.label} htmlFor={`${id}-${f.key}`}>
                  <NumberInput
                    id={`${id}-${f.key}`}
                    locale={locale}
                    value={num(m[f.key]) ?? null}
                    onChange={(v) => setM({ ...m, [f.key]: v === null ? "" : String(v) })}
                    min={0}
                    max={200}
                    decimals={1}
                  />
                </Field>
              ))}
            </div>
            {anyMeasure && found === null && <p className="mt-2 text-sm text-err">{t.outOfRange}</p>}
          </Fold>
        </div>

        <div className="min-w-0" aria-live="polite">
          <ResultTiles items={cols.filter((c) => c.key !== col.key).map((c) => ({ label: c.label[locale], value: c.get(row) }))} className="lg:grid-cols-3!" />
          {body && <p className="tabular mt-3 text-sm text-fg-2">{body}</p>}
        </div>
      </div>
      <p className="mt-5 text-sm text-fg-3">{t.note}</p>
    </Panel>
  );
}
