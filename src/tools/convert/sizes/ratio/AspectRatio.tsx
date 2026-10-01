"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { CopyButton } from "@/ui/copy-button";
import { Field, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { heightFor, nearestCommonRatio, ratioText, reduceRatio, roundEven, widthFor } from "../screen/engine";
import { plainSpaces } from "../ui/kit";

const T = {
  ru: {
    width: "Ширина",
    height: "Высота",
    ratio: "Соотношение сторон",
    invalid: "Введите целые ширину и высоту больше нуля",
    exact: "точно",
    scale: "Масштабировать",
    byWidth: "новая ширина",
    byHeight: "новая высота",
    newValue: "Новое значение",
    even: "Округлять до чётного",
    result: (a: string) => `→ ${a}`,
    nearest: (l: string) => `ближайшая стандартная — ${l}`,
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    width: "Width",
    height: "Height",
    ratio: "Aspect ratio",
    invalid: "Enter whole width and height above zero",
    exact: "exact",
    scale: "Scale",
    byWidth: "new width",
    byHeight: "new height",
    newValue: "New value",
    even: "Round to even",
    result: (a: string) => `→ ${a}`,
    nearest: (l: string) => `nearest standard: ${l}`,
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const ok = (v: number | null): v is number => v !== null && Number.isFinite(v) && v > 0 && v <= 1_000_000;

export default function AspectRatio({ locale, w = 1920, h = 1080, scale = 1366 }: { locale: Locale; w?: number; h?: number; scale?: number }) {
  const t = T[locale];
  const id = useId();
  const n = (v: number, d = 3) => plainSpaces(formatNumber(locale, v, { maximumFractionDigits: d }));
  const [wText, setW] = useState(String(w));
  const [hText, setH] = useState(String(h));
  const [mode, setMode] = useState<"w" | "h">("w");
  const [sText, setS] = useState(String(scale));
  const [even, setEven] = useState(true);

  const W = parseNumber(wText);
  const H = parseNumber(hText);
  const valid = ok(W) && ok(H) && Number.isInteger(W) && Number.isInteger(H);
  const [a, b] = valid ? reduceRatio(W, H) : [0, 0];
  const match = valid ? nearestCommonRatio(W, H) : null;

  const S = parseNumber(sText);
  const other = valid && ok(S) ? (mode === "w" ? heightFor(W, H, S) : widthFor(W, H, S)) : null;
  const rounded = other === null ? null : even ? roundEven(other) : Math.round(other);
  const scaled = other === null || S === null ? "" : mode === "w" ? `${Math.round(S)} × ${rounded}` : `${rounded} × ${Math.round(S)}`;

  return (
    <Panel className="p-4 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end sm:gap-8">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.width} htmlFor={`${id}-w`}>
            <NumberInput id={`${id}-w`} locale={locale} value={W} onChange={(v) => setW(v === null ? "" : String(v))} min={1} max={1_000_000} stepper={false} invalid={!valid} size="lg" />
          </Field>
          <Field label={t.height} htmlFor={`${id}-h`}>
            <NumberInput id={`${id}-h`} locale={locale} value={H} onChange={(v) => setH(v === null ? "" : String(v))} min={1} max={1_000_000} stepper={false} invalid={!valid} size="lg" />
          </Field>
        </div>
        <div className="min-w-0" aria-live="polite">
          {valid ? (
            <>
              <div className="text-sm text-fg-2">{t.ratio}</div>
              <div className="tabular text-5xl font-semibold tracking-tight text-fg sm:text-6xl">
                {`${a}:${b}`}
              </div>
              <div className="tabular mt-1 text-[0.9375rem] text-fg-2">
                {n(W / H, 4)}:1
                {match && !match.exact && ` · ${t.nearest(ratioText(match.oriented, locale))}`}
              </div>
            </>
          ) : (
            <p className="text-sm text-err">{t.invalid}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[1rem] bg-surface-2 px-4 py-3 text-sm">
        <span className="font-medium text-fg-2">{t.scale}</span>
        <Segmented
          size="sm"
          label={t.scale}
          value={mode}
          onChange={setMode}
          options={[
            { value: "w", label: t.byWidth },
            { value: "h", label: t.byHeight },
          ]}
        />
        <NumberInput aria-label={t.newValue} locale={locale} value={parseNumber(sText)} onChange={(v) => setS(v === null ? "" : String(v))} min={1} max={1_000_000} stepper={false} size="sm" className="w-28" />
        {other !== null && (
          <span className="tabular text-fg">
            {t.result(scaled)}
            {!Number.isInteger(other) && <span className="text-fg-3"> ({t.exact} {n(other)})</span>}
          </span>
        )}
        {other !== null && <CopyButton value={scaled} label={t.copy} copiedLabel={t.copied} variant="ghost" size="icon-sm" />}
        <Switch label={t.even} checked={even} onChange={(e) => setEven(e.target.checked)} className="text-sm! sm:ml-auto" />
      </div>
    </Panel>
  );
}
