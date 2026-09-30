"use client";

import { useId, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, parseNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { QuietFacts, plainSpaces } from "../ui";
import { dotPitchMm, megapixels, physicalPixels, physicalSize, ppi, resolutionName } from "./engine";
import { ratioLabel } from "./text";

const T = {
  ru: {
    width: "Ширина, px",
    height: "Высота, px",
    diag: "Диагональ″",
    optional: "необязательно",
    noName: "Без стандартного названия",
    invalid: "Введите ширину и высоту от 1 до 100 000 пикселей",
    mp: "Мп",
    pitch: "Шаг пикселя",
    size: "Размер экрана",
    total: "Всего пикселей",
    ratio: "Соотношение сторон",
    mm: "мм",
    cm: "см",
    yours: "Ваш экран",
    detecting: "Определяем…",
    physical: "физических пикселей",
    css: "В CSS-пикселях",
    dpr: "devicePixelRatio",
    use: "Подставить",
    zoom: "Масштаб страницы должен быть 100% (Ctrl+0), иначе devicePixelRatio и результат искажаются.",
  },
  en: {
    width: "Width, px",
    height: "Height, px",
    diag: "Diagonal″",
    optional: "optional",
    noName: "No standard name",
    invalid: "Enter a width and height from 1 to 100,000 pixels",
    mp: "MP",
    pitch: "Pixel pitch",
    size: "Screen size",
    total: "Total pixels",
    ratio: "Aspect ratio",
    mm: "mm",
    cm: "cm",
    yours: "Your screen",
    detecting: "Detecting…",
    physical: "physical pixels",
    css: "In CSS pixels",
    dpr: "devicePixelRatio",
    use: "Use these",
    zoom: "Keep page zoom at 100% (Ctrl+0), otherwise devicePixelRatio and the result are skewed.",
  },
} as const;

/* Screen snapshot as a stable string ("cssW,cssH,dpr") so useSyncExternalStore can compare it. */
function subscribe(cb: () => void) {
  window.addEventListener("resize", cb);
  const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  mq.addEventListener("change", cb);
  return () => {
    window.removeEventListener("resize", cb);
    mq.removeEventListener("change", cb);
  };
}
const snapshot = () => `${window.screen.width},${window.screen.height},${window.devicePixelRatio}`;
const serverSnapshot = () => "";

/** Physical screen = CSS size × devicePixelRatio (a scaled 4K screen reports 2560 × 1440 CSS px at 150%). */
function parseScreen(s: string): { pw: number; ph: number; cw: number; ch: number; dpr: number } | null {
  if (!s) return null;
  const [cw, ch, dpr] = s.split(",").map(Number);
  const [pw, ph] = physicalPixels(cw, ch, dpr);
  return { cw, ch, dpr, pw, ph };
}

const ok = (v: number | null): v is number => v !== null && Number.isFinite(v) && v >= 1 && v <= 100_000;

export default function ScreenResolution({ locale, w = 1920, h = 1080, diag = 24 }: { locale: Locale; w?: number; h?: number; diag?: number | null }) {
  const t = T[locale];
  const id = useId();
  const n = (v: number, d = 2) => plainSpaces(formatNumber(locale, v, { maximumFractionDigits: d }));
  const [wText, setW] = useState(String(w));
  const [hText, setH] = useState(String(h));
  const [dText, setD] = useState(diag ? n(diag, 2) : "");
  const screen = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const W = parseNumber(wText);
  const H = parseNumber(hText);
  const D = parseNumber(dText);
  const valid = ok(W) && ok(H);
  const iw = valid ? Math.round(W) : 0;
  const ih = valid ? Math.round(H) : 0;
  const diagOk = D !== null && D > 0 && D < 1000;
  const p = valid && diagOk ? ppi(iw, ih, D) : null;
  const name = valid ? resolutionName(iw, ih) : null;

  const yours = parseScreen(screen);

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
              <Input id={`${id}-d`} inputMode="decimal" autoComplete="off" placeholder={t.optional} value={dText} onChange={(e) => setD(e.target.value)} size="lg" className="tabular" />
            </Field>
          </div>
          <div className="min-w-0" aria-live="polite">
            {valid ? (
              <>
                <div className="truncate text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{name ?? `${iw} × ${ih}`}</div>
                <div className="tabular mt-1 text-[0.9375rem] text-fg-2">
                  {ratioLabel(locale, iw, ih)} · {n(megapixels(iw, ih))} {t.mp}
                  {p !== null && ` · ${n(p, 1)} PPI`}
                </div>
                {!name && <div className="text-sm text-fg-3">{t.noName}</div>}
              </>
            ) : (
              <p className="text-sm text-err">{t.invalid}</p>
            )}
          </div>
        </div>
      </Panel>

      {valid && (
        <QuietFacts
          items={[
            { label: t.total, value: n(iw * ih, 0) },
            { label: t.ratio, value: `${n(iw / ih, 4)}:1` },
            ...(p !== null
              ? [
                  { label: t.pitch, value: `${n(dotPitchMm(p), 3)} ${t.mm}` },
                  {
                    label: t.size,
                    value: `${n(physicalSize(iw, ih, D!)[0] * 2.54, 1)} × ${n(physicalSize(iw, ih, D!)[1] * 2.54, 1)} ${t.cm}`,
                  },
                ]
              : []),
          ]}
        />
      )}

      <section className="rounded-[0.75rem] border border-line px-4 py-3" aria-label={t.yours}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="text-[0.8125rem] text-fg-3">{t.yours}</div>
            {yours ? (
              <div className="tabular text-[0.9375rem] text-fg">
                <span className="font-semibold">
                  {yours.pw} × {yours.ph}
                </span>{" "}
                {t.physical}
                {resolutionName(yours.pw, yours.ph) && ` — ${resolutionName(yours.pw, yours.ph)}`}
                <span className="text-fg-3">
                  {" "}
                  · {t.css}: {yours.cw} × {yours.ch} · {t.dpr} {n(yours.dpr, 3)}
                </span>
              </div>
            ) : (
              <div className="text-[0.9375rem] text-fg-3">{t.detecting}</div>
            )}
          </div>
          {yours && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setW(String(yours.pw));
                setH(String(yours.ph));
              }}
            >
              {t.use}
            </Button>
          )}
        </div>
        <p className="mt-1 text-[0.8125rem] text-fg-3">{t.zoom}</p>
      </section>
    </div>
  );
}
