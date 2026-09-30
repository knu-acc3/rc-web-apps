"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { dotPitchMm, megapixels, physicalSize, ppi, retinaDistanceIn } from "../screen/engine";
import { QuietFacts, plainSpaces } from "../ui";

const T = {
  ru: {
    width: "Ширина, px",
    height: "Высота, px",
    diag: "Диагональ″",
    density: "Плотность пикселей",
    invalid: "Введите разрешение (1–100 000 px) и диагональ больше нуля",
    pitch: "Шаг пикселя",
    size: "Размер экрана",
    total: "Всего пикселей",
    retina: "Пиксели не видны дальше",
    mp: "Мп",
    mm: "мм",
    cm: "см",
  },
  en: {
    width: "Width, px",
    height: "Height, px",
    diag: "Diagonal″",
    density: "Pixel density",
    invalid: "Enter a resolution (1–100,000 px) and a diagonal above zero",
    pitch: "Pixel pitch",
    size: "Screen size",
    total: "Total pixels",
    retina: "Pixels invisible beyond",
    mp: "MP",
    mm: "mm",
    cm: "cm",
  },
} as const;

const ok = (v: number | null): v is number => v !== null && Number.isFinite(v) && v >= 1 && v <= 100_000;

export default function PpiCalc({ locale, w = 1920, h = 1080, diag = 24 }: { locale: Locale; w?: number; h?: number; diag?: number }) {
  const t = T[locale];
  const id = useId();
  const n = (v: number, d = 2) => plainSpaces(formatNumber(locale, v, { maximumFractionDigits: d }));
  const [wText, setW] = useState(String(w));
  const [hText, setH] = useState(String(h));
  const [dText, setD] = useState(() => n(diag, 2));

  const W = parseNumber(wText);
  const H = parseNumber(hText);
  const D = parseNumber(dText);
  const valid = ok(W) && ok(H) && D !== null && D > 0 && D < 1000;
  const p = valid ? ppi(W, H, D) : null;
  const [pw, ph] = valid ? physicalSize(W, H, D) : [0, 0];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-end">
          <div className="grid grid-cols-3 gap-3">
            <Field label={t.width} htmlFor={`${id}-w`}>
              <Input id={`${id}-w`} inputMode="numeric" autoComplete="off" value={wText} onChange={(e) => setW(e.target.value)} aria-invalid={!ok(W)} size="lg" className="tabular" />
            </Field>
            <Field label={t.height} htmlFor={`${id}-h`}>
              <Input id={`${id}-h`} inputMode="numeric" autoComplete="off" value={hText} onChange={(e) => setH(e.target.value)} aria-invalid={!ok(H)} size="lg" className="tabular" />
            </Field>
            <Field label={t.diag} htmlFor={`${id}-d`}>
              <Input id={`${id}-d`} inputMode="decimal" autoComplete="off" value={dText} onChange={(e) => setD(e.target.value)} size="lg" className="tabular" />
            </Field>
          </div>
          <div className="min-w-0" aria-live="polite">
            {p !== null ? (
              <>
                <div className="text-sm text-fg-2">{t.density}</div>
                <div className="tabular text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
                  {n(p, 2)} <span className="text-xl font-medium text-fg-3">PPI</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-err">{t.invalid}</p>
            )}
          </div>
        </div>
      </Panel>
      {p !== null && W !== null && H !== null && (
        <QuietFacts
          items={[
            { label: t.pitch, value: `${n(dotPitchMm(p), 4)} ${t.mm}` },
            { label: t.size, value: `${n(pw * 2.54, 1)} × ${n(ph * 2.54, 1)} ${t.cm}` },
            { label: t.total, value: `${n(W * H, 0)} (${n(megapixels(W, H))} ${t.mp})` },
            { label: t.retina, value: `${n(retinaDistanceIn(p) * 2.54, 0)} ${t.cm}` },
          ]}
        />
      )}
    </div>
  );
}
