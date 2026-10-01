"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { QuietFacts, plainSpaces } from "../ui/kit";
import { CM_PER_INCH, diagonalForAcuity, diagonalForAngle, screenDims, tvDistances } from "./engine";

const T = {
  ru: {
    mode: "Что вы знаете",
    byDiag: "Диагональ",
    byDist: "Расстояние",
    diag: "Диагональ, дюймы",
    dist: "Расстояние до экрана, м",
    distResult: "Рекомендуемое расстояние",
    diagResult: "Рекомендуемая диагональ",
    rangeNote: "от THX (40°) до SMPTE (30°)",
    invalidDiag: "Введите диагональ от 10 до 300 дюймов",
    invalidDist: "Введите расстояние от 0,5 до 15 м",
    diagCm: "Диагональ",
    screen: "Экран 16:9",
    uhd: "Вся детализация 4K — ближе",
    fhd: "Вся детализация Full HD — ближе",
    uhdNeed: "Для детализации 4K нужна диагональ от",
    fhdNeed: "Для детализации Full HD — от",
    m: "м",
    cm: "см",
    note: "Это ориентиры, а не нормы: SMPTE — минимальный угол обзора для «эффекта присутствия», THX — для кинотеатра, детализация — для зрения 20/20.",
  },
  en: {
    mode: "What you know",
    byDiag: "TV size",
    byDist: "Distance",
    diag: "Diagonal, inches",
    dist: "Viewing distance, m",
    distResult: "Recommended distance",
    diagResult: "Recommended TV size",
    rangeNote: "from THX (40°) to SMPTE (30°)",
    invalidDiag: "Enter a diagonal from 10 to 300 inches",
    invalidDist: "Enter a distance from 0.5 to 15 m",
    diagCm: "Diagonal",
    screen: "16:9 screen",
    uhd: "Full 4K detail — closer than",
    fhd: "Full HD detail — closer than",
    uhdNeed: "4K detail needs a diagonal of at least",
    fhdNeed: "Full HD detail — at least",
    m: "m",
    cm: "cm",
    note: "These are guidelines, not rules: SMPTE is the minimum angle for immersion, THX targets a cinema-like view, and detail distances assume 20/20 vision.",
  },
} as const;

export default function TvSize({ locale, diag = 55 }: { locale: Locale; diag?: number }) {
  const t = T[locale];
  const id = useId();
  const n = (v: number, d = 1) => plainSpaces(formatNumber(locale, v, { maximumFractionDigits: d }));
  const [mode, setMode] = useState<"diag" | "dist">("diag");
  const [dText, setD] = useState(String(diag));
  const [mText, setM] = useState(() => n(tvDistances(diag).smpte, 1));

  const D = parseNumber(dText);
  const M = parseNumber(mText);
  const diagOk = D !== null && D >= 10 && D <= 300;
  const distOk = M !== null && M >= 0.5 && M <= 15;

  const dist = diagOk ? tvDistances(D) : null;
  const [sw, sh] = diagOk ? screenDims(D) : [0, 0];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <Segmented
          size="sm"
          label={t.mode}
          value={mode}
          onChange={setMode}
          options={[
            { value: "diag", label: t.byDiag },
            { value: "dist", label: t.byDist },
          ]}
        />
        <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-end">
          {mode === "diag" ? (
            <Field label={t.diag} htmlFor={`${id}-d`} error={dText.trim() && !diagOk ? t.invalidDiag : undefined}>
              <Input id={`${id}-d`} inputMode="decimal" autoComplete="off" value={dText} onChange={(e) => setD(e.target.value)} aria-invalid={!!dText.trim() && !diagOk} size="lg" className="tabular" />
            </Field>
          ) : (
            <Field label={t.dist} htmlFor={`${id}-m`} error={mText.trim() && !distOk ? t.invalidDist : undefined}>
              <Input id={`${id}-m`} inputMode="decimal" autoComplete="off" value={mText} onChange={(e) => setM(e.target.value)} aria-invalid={!!mText.trim() && !distOk} size="lg" className="tabular" />
            </Field>
          )}
          <div className="min-w-0" aria-live="polite">
            {mode === "diag" && dist && (
              <>
                <div className="text-sm text-fg-2">{t.distResult}</div>
                <div className="tabular text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
                  {`${n(dist.thx)}–${n(dist.smpte)}`} <span className="text-xl font-medium text-fg-3">{t.m}</span>
                </div>
                <div className="text-sm text-fg-3">{t.rangeNote}</div>
              </>
            )}
            {mode === "dist" && distOk && (
              <>
                <div className="text-sm text-fg-2">{t.diagResult}</div>
                <div className="tabular text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
                  {`${n(diagonalForAngle(M, 30), 0)}–${n(diagonalForAngle(M, 40), 0)}″`}
                </div>
                <div className="text-sm text-fg-3">{t.rangeNote}</div>
              </>
            )}
          </div>
        </div>
      </Panel>

      {mode === "diag" && dist && D !== null && (
        <QuietFacts
          items={[
            { label: t.diagCm, value: `${n(D * CM_PER_INCH)} ${t.cm}` },
            { label: t.screen, value: `${n(sw * CM_PER_INCH)} × ${n(sh * CM_PER_INCH)} ${t.cm}` },
            { label: t.uhd, value: `${n(dist.uhd)} ${t.m}` },
            { label: t.fhd, value: `${n(dist.fhd)} ${t.m}` },
          ]}
        />
      )}
      {mode === "dist" && distOk && (
        <QuietFacts
          items={[
            { label: t.uhdNeed, value: `${n(diagonalForAcuity(M, 2160), 0)}″` },
            { label: t.fhdNeed, value: `${n(diagonalForAcuity(M, 1080), 0)}″` },
          ]}
        />
      )}
      <p className="px-1 text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
