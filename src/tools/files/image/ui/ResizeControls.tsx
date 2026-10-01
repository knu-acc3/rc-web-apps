"use client";

import { ArrowRight, Link2, Link2Off } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { Field } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Segmented } from "@/ui/segmented";
import { SliderField } from "@/ui/slider-field";
import type { FitMode } from "../lib/geometry";
import { plannedSize, setSide, shownSides, switchMode, toggleLock, type ResizeState, type ResizeUiMode, type Size } from "../lib/resize-state";

export { resizeSpecOf, RESIZE_DEFAULT, type ResizeState } from "../lib/resize-state";

const T = {
  ru: {
    by: "Как задать размер",
    percent: "Проценты",
    px: "Пиксели",
    long: "Длинная сторона",
    scale: "Масштаб",
    width: "Ширина",
    height: "Высота",
    longSide: "Длинная сторона",
    lock: "Сохранять пропорции",
    unlock: "Пропорции не сохраняются — нажмите, чтобы связать стороны",
    auto: "авто",
    fit: "Если пропорции другие",
    fits: { contain: "Вписать", cover: "Обрезать", pad: "С полями", stretch: "Растянуть" } as Record<FitMode, string>,
    fitTitles: {
      contain: "Вписать в рамку без обрезки",
      cover: "Заполнить рамку и обрезать лишнее по центру",
      pad: "Вписать и добавить поля",
      stretch: "Растянуть до точного размера",
    } as Record<FitMode, string>,
    same: "без изменений",
  },
  en: {
    by: "Resize by",
    percent: "Percent",
    px: "Pixels",
    long: "Long side",
    scale: "Scale",
    width: "Width",
    height: "Height",
    longSide: "Long side",
    lock: "Keep proportions",
    unlock: "Proportions are free — press to link the sides",
    auto: "auto",
    fit: "If the shape differs",
    fits: { contain: "Fit", cover: "Crop", pad: "Pad", stretch: "Stretch" } as Record<FitMode, string>,
    fitTitles: {
      contain: "Fit inside the box, no cropping",
      cover: "Fill the box and crop the centre",
      pad: "Fit inside and add padding",
      stretch: "Stretch to the exact size",
    } as Record<FitMode, string>,
    same: "unchanged",
  },
} as const;

const ALL_MODES: ResizeUiMode[] = ["percent", "px", "long"];
const CHIPS = [100, 75, 50, 25];
const FITS: FitMode[] = ["contain", "cover", "pad", "stretch"];

/**
 * Picture size: percent (slider + chips) by default, then pixels (width × height with a proportions lock) and,
 * optionally, the long side. Shows "4032×3024 → 2016×1512" for the selected photo when its size is known.
 */
export function ResizeControls({
  locale,
  value,
  onChange,
  source,
  modes = ["percent", "px"],
  fits = FITS,
}: {
  locale: Locale;
  value: ResizeState;
  onChange: (next: ResizeState) => void;
  /** Size of the selected photo (for the live "→" line and the linked side). */
  source?: Size | null;
  modes?: ResizeUiMode[];
  fits?: FitMode[];
}) {
  const t = T[locale];
  const id = useId();
  const max = value.up ? 400 : 100;
  const [text, setText] = useState(String(value.percent));
  const [prevPct, setPrevPct] = useState(value.percent);
  if (prevPct !== value.percent) {
    setPrevPct(value.percent);
    if (parsePct(text) !== value.percent) setText(String(value.percent));
  }
  const shown = shownSides(value, source);
  const out = plannedSize(value, source);
  const changed = !!out && !!source && (out.w !== source.w || out.h !== source.h);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {modes.length > 1 && (
        <Segmented
          label={t.by}
          value={value.mode}
          onChange={(m) => onChange(switchMode(value, m, source))}
          options={ALL_MODES.filter((m) => modes.includes(m)).map((m) => ({ value: m, label: t[m] }))}
        />
      )}

      {value.mode === "percent" && (
        <div className="flex flex-col gap-2">
          <SliderField
            id={`${id}-pct`}
            label={t.scale}
            value={text}
            onChange={(v) => {
              setText(v);
              const n = parsePct(v);
              if (n !== null && n >= 1 && n <= max) onChange({ ...value, percent: n });
            }}
            parse={parsePct}
            format={(n) => String(Math.round(n))}
            min={1}
            max={max}
            suffix="%"
            inputMode="numeric"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.scale}>
            {CHIPS.map((p) => (
              <button key={p} type="button" className="chip tabular" aria-pressed={value.percent === p} onClick={() => onChange({ ...value, percent: p })}>
                {p} %
              </button>
            ))}
          </div>
        </div>
      )}

      {value.mode === "px" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
            <Field label={t.width} htmlFor={`${id}-w`}>
              <NumberInput
                id={`${id}-w`}
                value={shown.w}
                onChange={(v) => onChange(setSide(value, "w", v))}
                min={1}
                max={30000}
                stepper={false}
                suffix="px"
                placeholder={t.auto}
                locale={locale}
              />
            </Field>
            <IconButton
              label={value.locked ? t.lock : t.unlock}
              icon={value.locked ? <Link2 aria-hidden /> : <Link2Off aria-hidden />}
              variant={value.locked ? "tonal" : "standard"}
              selected={value.locked}
              onClick={() => onChange(toggleLock(value, source))}
              className="mb-0.5"
            />
            <Field label={t.height} htmlFor={`${id}-h`}>
              <NumberInput
                id={`${id}-h`}
                value={shown.h}
                onChange={(v) => onChange(setSide(value, "h", v))}
                min={1}
                max={30000}
                stepper={false}
                suffix="px"
                placeholder={t.auto}
                locale={locale}
              />
            </Field>
          </div>
          {!value.locked && !!value.w && !!value.h && fits.length > 1 && (
            <Field label={t.fit}>
              <Segmented
                size="sm"
                label={t.fit}
                value={value.fit}
                onChange={(f) => onChange({ ...value, fit: f })}
                options={fits.map((f) => ({ value: f, label: t.fits[f], title: t.fitTitles[f] }))}
              />
            </Field>
          )}
        </div>
      )}

      {value.mode === "long" && (
        <Field label={t.longSide} htmlFor={`${id}-long`}>
          <NumberInput
            id={`${id}-long`}
            value={value.long}
            onChange={(v) => onChange({ ...value, long: v })}
            min={1}
            max={30000}
            stepper={false}
            suffix="px"
            placeholder={t.auto}
            locale={locale}
          />
        </Field>
      )}

      {source && out && (
        <p className="tabular flex flex-wrap items-center gap-x-2 text-sm text-fg-2" aria-live="polite">
          <span>
            {source.w}×{source.h}
          </span>
          <ArrowRight className="size-4 text-fg-3" aria-hidden />
          <span className={cn("font-semibold", changed ? "text-accent" : "text-fg")}>
            {out.w}×{out.h} px
          </span>
          {!changed && <span className="text-fg-3">· {t.same}</span>}
        </p>
      )}
    </div>
  );
}

function parsePct(v: string): number | null {
  const s = v.replace(/[\s%]/g, "").replace(",", ".");
  const n = Math.round(Number(s));
  return s && Number.isFinite(n) && n > 0 ? n : null;
}
