"use client";

import { Check, Minus, Plus, RotateCw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Slider } from "@/ui/field";
import { CARD, cssPpi, MAX_PX_PER_MM, MIN_PX_PER_MM, pxPerMmFromCard } from "./calibration";

const T = {
  ru: {
    hint: "Приложите банковскую карту (или права, ID-карту — любую карту формата ID-1) углом к левому верхнему углу рамки и двигайте ползунок, пока края не совпадут. Затем нажмите «Сохранить».",
    card: "Банковская карта 85,6 × 53,98 мм",
    width: "Длина карты на экране",
    less: "Уменьшить на 1 пиксель",
    more: "Увеличить на 1 пиксель",
    rotate: "Повернуть карту",
    save: "Сохранить калибровку",
    saved: "Сохранено",
    reset: "Сбросить к 96 ppi",
    mm: "1 мм",
    px: "пикс.",
  },
  en: {
    hint: "Hold a bank card (or a driving licence, ID card — any ID-1 card) against the top-left corner of the frame and move the slider until the edges match. Then press Save.",
    card: "Bank card 85.6 × 53.98 mm",
    width: "Card length on screen",
    less: "Decrease by 1 pixel",
    more: "Increase by 1 pixel",
    rotate: "Rotate card",
    save: "Save calibration",
    saved: "Saved",
    reset: "Reset to 96 ppi",
    mm: "1 mm",
    px: "px",
  },
} as const;

const MIN_PX = Math.ceil(MIN_PX_PER_MM * CARD.w);
const MAX_PX = Math.floor(MAX_PX_PER_MM * CARD.w);
const clampPx = (v: number) => Math.min(MAX_PX, Math.max(MIN_PX, Math.round(v * 2) / 2));

export function CardMatcher({
  locale,
  initial,
  onSave,
  showSteps = true,
}: {
  locale: Locale;
  /** Starting CSS px per mm. */
  initial: number;
  onSave: (pxPerMm: number) => boolean;
  showSteps?: boolean;
}) {
  const t = T[locale];
  const id = useId();
  const [px, setPx] = useState(() => clampPx(initial * CARD.w));
  const [manualRotate, setManualRotate] = useState<boolean | null>(null);
  const [avail, setAvail] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail(el.clientWidth));
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const pxPerMm = pxPerMmFromCard(px);
  const longPx = px;
  const shortPx = CARD.h * pxPerMm;
  const autoPortrait = avail !== null && longPx + 4 > avail;
  const portrait = manualRotate ?? autoPortrait;
  const w = portrait ? shortPx : longPx;
  const h = portrait ? longPx : shortPx;
  const nf = (n: number, d = 1) => formatNumber(locale, n, { maximumFractionDigits: d });

  function change(v: number) {
    setPx(clampPx(v));
    setSaved(false);
  }

  function save() {
    if (onSave(pxPerMm)) {
      setSaved(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {showSteps && <p className="text-sm text-fg-2">{t.hint}</p>}

      <div ref={wrapRef} className="scrollbar-thin -mx-1 overflow-x-auto px-1 py-1">
        <div
          aria-hidden
          className="relative flex items-end justify-center border-2 border-accent bg-accent-soft pb-[6%] text-center text-accent select-none"
          style={{ width: w, height: h, borderRadius: CARD.r * pxPerMm, boxSizing: "border-box" }}
        >
          <span
            className="absolute rounded-[0.1875rem] border border-warn bg-warn-soft"
            style={
              portrait
                ? { width: 9 * pxPerMm, height: 11.5 * pxPerMm, right: 18 * pxPerMm, top: 10 * pxPerMm }
                : { width: 11.5 * pxPerMm, height: 9 * pxPerMm, left: 10 * pxPerMm, top: 18 * pxPerMm }
            }
          />
          <span className="px-2 text-xs font-medium sm:text-sm">{t.card}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-s`} className="flex items-center justify-between gap-2 text-sm font-medium text-fg-2">
          <span>{t.width}</span>
          <span className="tabular text-fg">
            {nf(px)} {t.px} · {t.mm} = {nf(pxPerMm, 3)} {t.px} · {nf(cssPpi(pxPerMm))} ppi
          </span>
        </label>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => change(px - 1)} aria-label={t.less} title={t.less}>
            <Minus />
          </Button>
          <Slider
            id={`${id}-s`}
            min={MIN_PX}
            max={MAX_PX}
            step={0.5}
            value={px}
            onChange={(e) => change(Number(e.target.value))}
            aria-valuetext={`${nf(px)} ${t.px}`}
            className="min-w-0 flex-1"
          />
          <Button variant="outline" size="icon" onClick={() => change(px + 1)} aria-label={t.more} title={t.more}>
            <Plus />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={save}>
          {saved ? <Check aria-hidden /> : null}
          {saved ? t.saved : t.save}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setManualRotate(!portrait)}>
          <RotateCw aria-hidden />
          {t.rotate}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => change((96 / 25.4) * CARD.w)}>
          {t.reset}
        </Button>
        <span className="sr-only" aria-live="polite">
          {saved ? t.saved : ""}
        </span>
      </div>
    </div>
  );
}
