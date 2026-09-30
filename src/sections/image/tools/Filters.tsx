"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Select, Switch } from "@/ui/field";
import { FILTER_NAMES } from "../data/filter-names";
import type { FilterId } from "../data/types";
import { defaultParams, FILTER_IDS, FILTERS, type FilterParams } from "../engine/filters";
import { processFile, toBlob } from "../engine/run";
import { baseName } from "../engine/source";
import type { Op } from "../engine/types";
import { BatchWorkspace } from "../ui/BatchWorkspace";
import { ColorField, RangeField } from "../ui/controls";
import { DEFAULT_QUALITY, LOSSY, OUT_LABEL, resolveOut, type OutChoice } from "../ui/format";
import { LiveStage } from "../ui/LiveStage";
import { S } from "../ui/strings";
import { useBatch, type Runner } from "../ui/useBatch";

const PARAM_LABEL: Record<string, { ru: string; en: string }> = {
  "%": { ru: "Сила", en: "Strength" },
  px: { ru: "Радиус", en: "Radius" },
  "°": { ru: "Угол", en: "Angle" },
  lv: { ru: "Уровни", en: "Levels" },
  "": { ru: "Сила", en: "Strength" },
};

const T = {
  ru: {
    filter: "Фильтр",
    threshold: "Порог",
    dither: "Дизеринг (Флойд — Стейнберг)",
    shadows: "Тени",
    highlights: "Света",
    size: "Размер центра",
    block: "Размер блока",
  },
  en: {
    filter: "Filter",
    threshold: "Threshold",
    dither: "Dithering (Floyd–Steinberg)",
    shadows: "Shadows",
    highlights: "Highlights",
    size: "Centre size",
    block: "Block size",
  },
} as const;

export interface FiltersProps {
  locale: Locale;
  filter?: FilterId;
}

export default function Filters({ locale, filter: initial = "grayscale" }: FiltersProps) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const [filter, setFilter] = useState<FilterId>(initial);
  const [params, setParams] = useState<FilterParams>(() => defaultParams(initial));
  const [out, setOut] = useState<OutChoice>("same");
  const def = FILTERS[filter];
  const ops: Op[] = [{ t: "filter", id: filter, params }];
  const key = JSON.stringify({ ops, out });

  const choose = (f: FilterId) => {
    setFilter(f);
    setParams(defaultParams(f));
  };

  const runner: Runner = async (p, ctx) => {
    const fmt = resolveOut(out, p.format);
    const r = await processFile(
      ctx.engine,
      p,
      ops,
      { format: fmt, quality: LOSSY.has(fmt) ? Math.max(88, DEFAULT_QUALITY[fmt]) : 100, background: "#FFFFFF" },
      { signal: ctx.signal, onProgress: ctx.onProgress },
    );
    return { blob: toBlob(r), name: `${baseName(p.file.name)}-${filter}.${r.ext}`, width: r.width, height: r.height };
  };
  const batch = useBatch({ runner, settingsKey: key, delay: 600 });

  const paramLabel = filter === "black-and-white" ? t.threshold : filter === "pixelate" ? t.block : PARAM_LABEL[def.unit][locale];
  const options = (
    <>
      <Field label={t.filter} htmlFor={`${id}-f`} className="w-60">
        <Select id={`${id}-f`} value={filter} onChange={(e) => choose(e.target.value as FilterId)}>
          {FILTER_IDS.map((f) => (
            <option key={f} value={f}>
              {FILTER_NAMES[f][locale]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="min-w-52 flex-1">
        <RangeField
          label={paramLabel}
          value={params.amount}
          onChange={(v) => setParams((x) => ({ ...x, amount: v }))}
          min={def.min}
          max={def.max}
          step={def.step}
          unit={def.unit === "lv" ? "" : def.unit}
          locale={locale}
        />
      </div>
    </>
  );

  const more = (
    <>
      {filter === "duotone" && (
        <>
          <ColorField label={t.shadows} value={params.color1 ?? "#1E1A50"} onChange={(c) => setParams((x) => ({ ...x, color1: c }))} locale={locale} />
          <ColorField label={t.highlights} value={params.color2 ?? "#FFC45A"} onChange={(c) => setParams((x) => ({ ...x, color2: c }))} locale={locale} />
        </>
      )}
      {filter === "black-and-white" && (
        <Switch label={t.dither} checked={!!params.dither} onChange={(e) => setParams((x) => ({ ...x, dither: e.target.checked }))} />
      )}
      {filter === "vignette" && (
        <RangeField
          label={t.size}
          value={params.size ?? 40}
          onChange={(v) => setParams((x) => ({ ...x, size: v }))}
          min={0}
          max={90}
          unit="%"
          locale={locale}
        />
      )}
      <Field label={s.outputFormat} htmlFor={`${id}-out`}>
        <Select id={`${id}-out`} value={out} onChange={(e) => setOut(e.target.value as OutChoice)}>
          {(["same", "jpg", "png", "webp"] as const).map((f) => (
            <option key={f} value={f}>
              {f === "same" ? s.sameFormat : OUT_LABEL[f]}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );

  return (
    <BatchWorkspace
      locale={locale}
      batch={batch}
      options={options}
      more={more}
      zipName={`${filter}-images.zip`}
      stage={(it) => <LiveStage locale={locale} prepared={it.prepared} ops={ops} />}
    />
  );
}
