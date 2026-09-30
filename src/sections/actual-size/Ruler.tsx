"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Select, Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { CalibrationBar } from "./CalibrationBar";
import { formatInchFraction, MM_PER_IN, rulerTicks, snapRuler, type RulerUnit } from "./geometry";
import { useCalibration } from "./use-calibration";

const T = {
  ru: {
    length: "Длина",
    orientation: "Положение",
    horizontal: "Горизонтально",
    vertical: "Вертикально",
    zoom: "Увеличение",
    second: (u: RulerUnit) => (u === "cm" ? "Шкала в дюймах" : "Шкала в см"),
    zoomed: (z: number) => `Шкала увеличена в ${z} раза — это удобно для чтения делений, но не натуральная величина.`,
    ruler: (u: RulerUnit) => (u === "cm" ? "Линейка в сантиметрах" : "Линейка в дюймах"),
    mark: "Отметка",
    markHint: "Нажмите на линейку, чтобы поставить отметку; стрелки ← → двигают её (Shift — быстрее).",
    cm: "см",
    mm: "мм",
    inch: "дюйм.",
  },
  en: {
    length: "Length",
    orientation: "Orientation",
    horizontal: "Horizontal",
    vertical: "Vertical",
    zoom: "Magnification",
    second: (u: RulerUnit) => (u === "cm" ? "Inch scale" : "cm scale"),
    zoomed: (z: number) => `The scale is magnified ${z}× — handy for reading ticks, but not actual size.`,
    ruler: (u: RulerUnit) => (u === "cm" ? "Centimetre ruler" : "Inch ruler"),
    mark: "Marker",
    markHint: "Click the ruler to place a marker; ← → arrow keys move it (Shift for bigger steps).",
    cm: "cm",
    mm: "mm",
    inch: "in",
  },
} as const;

const LENGTHS: Record<RulerUnit, number[]> = { cm: [10, 15, 20, 30, 50, 100], in: [6, 12, 24, 36] };
const TICK_LEN: Record<RulerUnit, number[]> = { cm: [28, 19, 12], in: [28, 21, 16, 11, 7] };
const BAND = 64;
const DUAL_BAND = 92;

export default function Ruler({ locale, unit = "cm" }: { locale: Locale; unit?: RulerUnit }) {
  const t = T[locale];
  const id = useId();
  const cal = useCalibration();
  const [length, setLength] = useState(unit === "cm" ? 30 : 12);
  const [orient, setOrient] = useState<"h" | "v">("h");
  const [zoom, setZoom] = useState<"1" | "2" | "4">("1");
  const [dual, setDual] = useState(false);
  const [marker, setMarker] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    // Phones: the long side of the screen is vertical, so start with a vertical ruler.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the viewport is only known after mount
    if (window.matchMedia("(max-width: 639px)").matches) setOrient("v");
  }, []);

  const other: RulerUnit = unit === "cm" ? "in" : "cm";
  const z = Number(zoom);
  const p = cal.pxPerMm * z;
  const lengthMm = unit === "cm" ? length * 10 : length * MM_PER_IN;
  const band = dual ? DUAL_BAND : BAND;
  const main = useMemo(() => rulerTicks(unit, length), [unit, length]);
  const sec = useMemo(() => (dual ? rulerTicks(other, Math.floor((lengthMm / (other === "cm" ? 10 : MM_PER_IN)) * 1000) / 1000) : []), [dual, other, lengthMm]);
  const vert = orient === "v";
  const pad = 24;
  const long = Math.ceil(lengthMm * p) + pad;
  const pos = (mm: number) => Math.floor(mm * p) + 0.5;

  const nf = (n: number, d = 1) => formatNumber(locale, n, { maximumFractionDigits: d });

  function path(ticks: typeof main, u: RulerUnit, fromEnd: boolean) {
    const lens = TICK_LEN[u];
    let d = "";
    for (const tk of ticks) {
      const x = pos(tk.mm);
      const l = lens[tk.level];
      const a = fromEnd ? band - l : 0;
      const b = fromEnd ? band : l;
      d += vert ? `M${a} ${x}H${b}` : `M${x} ${a}V${b}`;
    }
    return d;
  }

  function labels(ticks: typeof main, u: RulerUnit, fromEnd: boolean) {
    const l = TICK_LEN[u][0];
    return ticks
      .filter((tk) => tk.label !== undefined)
      .map((tk) => {
        const x = pos(tk.mm);
        const isZero = tk.mm === 0;
        const unitMark = isZero ? (
          <tspan className="fill-fg-3" fontSize={10}>
            {` ${u === "cm" ? t.cm : "in"}`}
          </tspan>
        ) : null;
        if (vert) {
          return (
            <text key={`${u}${tk.mm}`} x={fromEnd ? band - l - 4 : l + 4} y={isZero ? x + 11 : x + 4} fontSize={12} textAnchor={fromEnd ? "end" : "start"} className="fill-fg">
              {tk.label}
              {unitMark}
            </text>
          );
        }
        return (
          <text
            key={`${u}${tk.mm}`}
            x={isZero ? x + 3 : x}
            y={fromEnd ? band - l - 5 : l + 13}
            fontSize={12}
            textAnchor={isZero ? "start" : "middle"}
            className="fill-fg"
          >
            {tk.label}
            {unitMark}
          </text>
        );
      });
  }

  function fromPointer(e: MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = vert ? e.clientY - r.top : e.clientX - r.left;
    setMarker(Math.min(lengthMm, Math.max(0, snapRuler(px / p, unit))));
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const small = unit === "cm" ? 1 : MM_PER_IN / 16;
    const big = unit === "cm" ? 10 : MM_PER_IN;
    const step = e.shiftKey ? big : small;
    let next: number | null = null;
    const cur = marker ?? 0;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = cur + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = cur - step;
    else if (e.key === "PageUp") next = cur + big;
    else if (e.key === "PageDown") next = cur - big;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = lengthMm;
    if (next === null) return;
    e.preventDefault();
    const v = Math.min(lengthMm, Math.max(0, snapRuler(next, unit)));
    setMarker(v);
    const sc = scrollRef.current;
    if (sc && !vert) {
      const x = v * p;
      if (x < sc.scrollLeft + 20) sc.scrollLeft = Math.max(0, x - 40);
      else if (x > sc.scrollLeft + sc.clientWidth - 20) sc.scrollLeft = x - sc.clientWidth + 40;
    }
  }


  const inches = marker === null ? 0 : marker / MM_PER_IN;
  const reading =
    marker === null
      ? null
      : unit === "cm"
        ? { main: `${nf(marker / 10, 2)} ${t.cm}`, sub: `${nf(marker, 1)} ${t.mm} ≈ ${nf(inches, 2)}″` }
        : { main: `${formatInchFraction(inches * 16)}″`, sub: `${nf(inches, 4)} ${t.inch} ≈ ${nf(marker / 10, 2)} ${t.cm}` };

  const W = vert ? band : long;
  const H = vert ? long : band;
  const mk = marker === null ? null : pos(marker);

  return (
    <div className="flex flex-col gap-3">
      <CalibrationBar locale={locale} state={cal} />

      <div ref={scrollRef} className={vert ? "" : "scrollbar-thin overflow-x-auto"}>
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${t.ruler(unit)}: ${t.mark}`}
          aria-orientation={vert ? "vertical" : "horizontal"}
          aria-valuemin={0}
          aria-valuemax={unit === "cm" ? length * 10 : length}
          aria-valuenow={marker === null ? 0 : unit === "cm" ? Math.round(marker * 10) / 10 : Math.round(inches * 10000) / 10000}
          aria-valuetext={reading ? `${reading.main} (${reading.sub})` : undefined}
          onKeyDown={onKey}
          className="inline-block rounded-[0.25rem] align-top"
        >
          <svg
            width={W}
            height={H}
            className="block cursor-crosshair select-none text-fg"
            style={{ touchAction: "manipulation" }}
            onClick={fromPointer}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse") dragging.current = true;
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerLeave={() => {
              dragging.current = false;
            }}
            onPointerMove={(e) => {
              if (dragging.current && e.buttons === 1) fromPointer(e);
            }}
            aria-hidden
          >
            <rect
              x={0}
              y={0}
              width={vert ? band : Math.ceil(lengthMm * p) + 1}
              height={vert ? Math.ceil(lengthMm * p) + 1 : band}
              className="fill-warn-soft stroke-line-strong"
              strokeWidth={1}
            />
            <path d={path(main, unit, false)} className="stroke-fg" strokeWidth={1} />
            {labels(main, unit, false)}
            {dual && (
              <>
                <path d={path(sec, other, true)} className="stroke-fg-2" strokeWidth={1} />
                {labels(sec, other, true)}
              </>
            )}
            {mk !== null &&
              (vert ? (
                <line x1={0} x2={band} y1={mk} y2={mk} className="stroke-accent" strokeWidth={2} />
              ) : (
                <line x1={mk} x2={mk} y1={0} y2={band} className="stroke-accent" strokeWidth={2} />
              ))}
          </svg>
        </div>
      </div>

      {z > 1 && <Notice tone="warn">{t.zoomed(z)}</Notice>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-h-16">
          {reading ? (
            <>
              <p className="text-sm text-fg-2">{t.mark}</p>
              <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{reading.main}</p>
              <p className="tabular text-sm text-fg-3">{reading.sub}</p>
            </>
          ) : (
            <p className="max-w-md text-sm text-fg-3">{t.markHint}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`${id}-l`} className="sr-only">
            {t.length}
          </label>
          <Select
            id={`${id}-l`}
            value={String(length)}
            onChange={(e) => {
              setLength(Number(e.target.value));
              setMarker(null);
            }}
            size="sm"
            className="w-28"
          >
            {LENGTHS[unit].map((n) => (
              <option key={n} value={n}>
                {n} {unit === "cm" ? t.cm : t.inch}
              </option>
            ))}
          </Select>
          <Segmented
            label={t.orientation}
            value={orient}
            onChange={setOrient}
            size="sm"
            options={[
              { value: "h", label: t.horizontal },
              { value: "v", label: t.vertical },
            ]}
          />
          <Segmented
            label={t.zoom}
            value={zoom}
            onChange={setZoom}
            size="sm"
            options={[
              { value: "1", label: "1×" },
              { value: "2", label: "2×" },
              { value: "4", label: "4×" },
            ]}
          />
          <Switch label={t.second(unit)} checked={dual} onChange={(e) => setDual(e.target.checked)} className="text-sm" />
        </div>
      </div>
    </div>
  );
}
