"use client";

import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatDate, formatNumber, parseNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field, Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import {
  clearCalibration,
  cssPpi,
  devicePpi,
  isPlausiblePxPerMm,
  MM_PER_INCH,
  pxPerMmFromDiagonal,
  saveCalibration,
  screenDiagonalInches,
} from "./calibration";
import { CardMatcher } from "./CardMatcher";
import { useCalibration } from "./use-calibration";

const T = {
  ru: {
    status: "Текущий масштаб",
    notCalibrated: "Не откалибровано: используется стандарт 96 ppi (1 мм = 3,78 пикс.). На телефонах и HiDPI-экранах это заметно не совпадает с реальностью.",
    calibratedAt: (m: string, d: string) => `Откалибровано ${m} · ${d}`,
    byCard: "по банковской карте",
    byDiagonal: "по диагонали экрана",
    loading: "Загрузка настроек калибровки…",
    mm: "1 миллиметр",
    px: "пикс.",
    cssPpi: "CSS-пикселей на дюйм",
    devPpi: "Физическая плотность",
    devPpiSub: (d: string) => `devicePixelRatio ${d}`,
    screen: "Размер экрана по калибровке",
    screenSub: (d: string) => `диагональ ≈ ${d}″`,
    cm: "см",
    method: "Способ калибровки",
    card: "Банковская карта",
    diagonal: "Диагональ экрана",
    diagLabel: "Диагональ экрана, дюймов",
    diagHint: "Указана в характеристиках ноутбука или монитора, например 15,6.",
    presets: "Популярные диагонали",
    reported: (w: number, h: number, d: string, pw: number, ph: number) =>
      `Браузер сообщает: экран ${w} × ${h} CSS-пикс., devicePixelRatio ${d} → ${pw} × ${ph} физических пикселей.`,
    result: "Результат",
    invalid: "Введите диагональ от 3 до 100 дюймов",
    save: "Сохранить калибровку",
    saved: "Сохранено",
    limits:
      "Способ работает, только если масштаб браузера 100 % и браузер сообщает настоящее разрешение матрицы. На Mac с «масштабированным» разрешением, при увеличении страницы и на некоторых телефонах расчёт будет неточным — тогда используйте карту.",
    check: "Проверка линейкой",
    checkText: "Приложите обычную линейку: отрезки ниже должны быть ровно 5 см и 2 дюйма.",
    reset: "Удалить калибровку",
    storage: "Калибровка хранится только в этом браузере (localStorage) и никуда не отправляется.",
  },
  en: {
    status: "Current scale",
    notCalibrated: "Not calibrated: the 96 ppi standard is used (1 mm = 3.78 px). On phones and HiDPI screens this is noticeably off.",
    calibratedAt: (m: string, d: string) => `Calibrated ${m} · ${d}`,
    byCard: "with a bank card",
    byDiagonal: "by screen diagonal",
    loading: "Loading calibration settings…",
    mm: "1 millimetre",
    px: "px",
    cssPpi: "CSS pixels per inch",
    devPpi: "Physical density",
    devPpiSub: (d: string) => `devicePixelRatio ${d}`,
    screen: "Screen size by calibration",
    screenSub: (d: string) => `diagonal ≈ ${d}″`,
    cm: "cm",
    method: "Calibration method",
    card: "Bank card",
    diagonal: "Screen diagonal",
    diagLabel: "Screen diagonal, inches",
    diagHint: "Listed in the laptop or monitor specs, e.g. 15.6.",
    presets: "Common diagonals",
    reported: (w: number, h: number, d: string, pw: number, ph: number) =>
      `The browser reports a ${w} × ${h} CSS px screen, devicePixelRatio ${d} → ${pw} × ${ph} physical pixels.`,
    result: "Result",
    invalid: "Enter a diagonal between 3 and 100 inches",
    save: "Save calibration",
    saved: "Saved",
    limits:
      "This only works when browser zoom is 100 % and the browser reports the real panel resolution. On Macs with a “scaled” resolution, with page zoom and on some phones the result will be off — use the card instead.",
    check: "Check with a ruler",
    checkText: "Hold a real ruler to the screen: the segments below should be exactly 5 cm and 2 inches.",
    reset: "Delete calibration",
    storage: "The calibration is stored only in this browser (localStorage) and is never sent anywhere.",
  },
} as const;

const PRESETS = [5.5, 6.1, 6.7, 10.9, 13.3, 14, 15.6, 16, 17.3, 21.5, 23.8, 27, 32];

export default function Calibrate({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const state = useCalibration();
  const [method, setMethod] = useState<"card" | "diagonal">("card");
  const [diagText, setDiagText] = useState("");
  const [diagSaved, setDiagSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const nf = (n: number, d = 2) => formatNumber(locale, n, { maximumFractionDigits: d });

  // Screen metrics exist only in the browser; `ready` is false during SSR/hydration.
  const scr = state.ready ? { w: window.screen.width, h: window.screen.height } : null;
  const diag = parseNumber(diagText);
  const diagValid = diag !== null && diag >= 3 && diag <= 100;
  const diagPx = scr && diagValid ? pxPerMmFromDiagonal(scr.w, scr.h, state.dpr, diag) : null;

  function saveDiagonal() {
    if (diagPx === null || !isPlausiblePxPerMm(diagPx)) return;
    if (saveCalibration(diagPx, "diagonal")) {
      setDiagSaved(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDiagSaved(false), 2500);
    }
  }

  const p = state.pxPerMm;
  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <Segmented
          label={t.method}
          value={method}
          onChange={setMethod}
          size="sm"
          options={[
            { value: "card", label: t.card },
            { value: "diagonal", label: t.diagonal },
          ]}
          className="mb-4"
        />
        {method === "card" ? (
          // Server/hydration render uses the 96 ppi estimate; remount once the stored calibration is known.
          <CardMatcher key={state.ready ? "client" : "server"} locale={locale} initial={p} onSave={(v) => saveCalibration(v, "card") !== null} />
        ) : (
          <div className="flex flex-col gap-4">
            <Field label={t.diagLabel} htmlFor={`${id}-d`} hint={t.diagHint} error={diagText.trim() && !diagValid ? t.invalid : undefined}>
              <Input
                id={`${id}-d`}
                inputMode="decimal"
                autoComplete="off"
                value={diagText}
                onChange={(e) => {
                  setDiagText(e.target.value);
                  setDiagSaved(false);
                }}
                aria-invalid={!!diagText.trim() && !diagValid}
                size="lg"
                className="tabular max-w-48"
              />
            </Field>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.presets}>
              {PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className="chip h-8! px-3! text-[13px]!"
                  onClick={() => {
                    setDiagText(nf(d, 1));
                    setDiagSaved(false);
                  }}
                >
                  {nf(d, 1)}″
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl" aria-live="polite">
                  {diagPx !== null ? `${t.mm} = ${nf(diagPx, 3)} ${t.px}` : "—"}
                </p>
                {scr && (
                  <p className="text-sm text-fg-3">
                    {t.reported(scr.w, scr.h, nf(state.dpr), Math.round(scr.w * state.dpr), Math.round(scr.h * state.dpr))}
                  </p>
                )}
              </div>
              <Button variant="primary" onClick={saveDiagonal} disabled={diagPx === null || !isPlausiblePxPerMm(diagPx)}>
                {diagSaved && <Check aria-hidden />}
                {diagSaved ? t.saved : t.save}
              </Button>
            </div>
            <Notice tone="warn">{t.limits}</Notice>
          </div>
        )}
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-fg">{t.status}</h2>
        {!state.ready ? (
          <p className="text-sm text-fg-3">{t.loading}</p>
        ) : (
          <>
            {state.calibrated && state.cal ? (
              <p className="text-sm text-ok">
                {t.calibratedAt(
                  state.cal.method === "diagonal" ? t.byDiagonal : t.byCard,
                  state.cal.at ? formatDate(locale, new Date(state.cal.at), { dateStyle: "medium", timeStyle: "short" }) : "",
                )}
              </p>
            ) : (
              <p className="text-sm text-warn">{t.notCalibrated}</p>
            )}
            <dl className="facts text-sm">
              <div>
                <dt>{t.mm}</dt>
                <dd className="tabular">
                  {nf(p, 3)} {t.px}
                </dd>
              </div>
              <div>
                <dt>{t.cssPpi}</dt>
                <dd className="tabular">{nf(cssPpi(p), 1)}</dd>
              </div>
              <div>
                <dt>
                  {t.devPpi} ({t.devPpiSub(nf(state.dpr))})
                </dt>
                <dd className="tabular">{nf(devicePpi(p, state.dpr), 0)} ppi</dd>
              </div>
              {scr && (
                <div>
                  <dt>{t.screen}</dt>
                  <dd className="tabular">
                    {nf(scr.w / p / 10, 1)} × {nf(scr.h / p / 10, 1)} {t.cm}, {t.screenSub(nf(screenDiagonalInches(scr.w, scr.h, p), 1))}
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-fg">{t.check}</h2>
        <p className="mb-3 text-sm text-fg-2">{t.checkText}</p>
        <div className="scrollbar-thin overflow-x-auto">
          <CheckLine mm={50} pxPerMm={p} ticks={Array.from({ length: 6 }, (_, i) => i * 10)} label={locale === "ru" ? "5 см" : "5 cm"} />
          <CheckLine mm={2 * MM_PER_INCH} pxPerMm={p} ticks={[0, 0.5, 1, 1.5, 2].map((x) => x * MM_PER_INCH)} label={locale === "ru" ? "2 дюйма" : "2 inches"} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-3">{t.storage}</p>
          {state.calibrated && (
            <Button variant="ghost" size="sm" onClick={clearCalibration}>
              {t.reset}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}


function CheckLine({ mm, pxPerMm, ticks, label }: { mm: number; pxPerMm: number; ticks: number[]; label: string }) {
  const w = mm * pxPerMm;
  return (
    <svg width={w + 60} height={30} className="mb-2 block overflow-visible text-fg" aria-label={label} role="img">
      <line x1={0.5} y1={14} x2={w + 0.5} y2={14} stroke="currentColor" strokeWidth={1.5} />
      {ticks.map((x) => (
        <line key={x} x1={x * pxPerMm + 0.5} x2={x * pxPerMm + 0.5} y1={x === 0 || Math.abs(x - mm) < 0.01 ? 4 : 9} y2={24} stroke="currentColor" strokeWidth={1} />
      ))}
      <text x={w + 8} y={18} fontSize={12} className="fill-fg-2">
        {label}
      </text>
    </svg>
  );
}
