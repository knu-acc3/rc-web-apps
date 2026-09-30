"use client";

import { RotateCw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { L10n, Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Select, Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { ObjectArt, ObjectOutline } from "./art";
import { CalibrationBar } from "./CalibrationBar";
import { MM_PER_INCH } from "./calibration";
import { DEVICE_SHAPES, ROUND_SHAPES, type ClientObj } from "./types";
import { useCalibration } from "./use-calibration";

const T = {
  ru: {
    object: "Предмет",
    compare: "Сравнить с",
    none: "Сравнить с…",
    rotate: "Повернуть",
    rotateLabel: "Повернуть на 90°",
    fit: "Уместить в окно",
    scaled: (p: string) => `Уменьшено до ${p} % — это не натуральная величина.`,
    wider: "Предмет шире окна: прокрутите область вбок или поверните его. Показан в натуральную величину.",
    taller: "Предмет выше экрана — прокрутите страницу, чтобы увидеть его целиком.",
    mm: "мм",
    cm: "см",
    dia: "⌀",
    thick: "толщина",
    dashed: "Пунктир",
    ruler: "см",
  },
  en: {
    object: "Object",
    compare: "Compare with",
    none: "Compare with…",
    rotate: "Rotate",
    rotateLabel: "Rotate 90°",
    fit: "Fit to window",
    scaled: (p: string) => `Scaled down to ${p}% — this is not actual size.`,
    wider: "The object is wider than the window: scroll sideways or rotate it. Shown at actual size.",
    taller: "The object is taller than the screen — scroll the page to see all of it.",
    mm: "mm",
    cm: "cm",
    dia: "⌀",
    thick: "thickness",
    dashed: "Dashed",
    ruler: "cm",
  },
} as const;

const M = 2.5; // margin around the scene, mm
const RULER_GAP = 3;
const RULER_H = 7;

export interface ObjectViewerProps {
  locale: Locale;
  items: ClientObj[];
  /** Object shown first. */
  initial?: string;
  /** Variant page: the object is fixed (no object selector). */
  fixed?: boolean;
  /** Extra reference objects available only for comparison. */
  refs?: ClientObj[];
  /** Category names for grouping the object selector. */
  groups?: { id: string; name: L10n }[];
}

export default function ObjectViewer({ locale, items, initial, fixed = false, refs = [], groups }: ObjectViewerProps) {
  const t = T[locale];
  const id = useId();
  const cal = useCalibration();
  const [slug, setSlug] = useState(initial ?? items[0]?.slug);
  const [cmp, setCmp] = useState("");
  const [rotation, setRotation] = useState<boolean | null>(null);
  const [fit, setFit] = useState(false);
  const [box, setBox] = useState<{ w: number; vh: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, vh: window.innerHeight });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const main = items.find((x) => x.slug === slug) ?? items[0];
  const pool = useMemo(() => {
    const seen = new Set<string>();
    return [...items, ...refs].filter((x) => (seen.has(x.slug) ? false : (seen.add(x.slug), true)));
  }, [items, refs]);
  const other = cmp ? pool.find((x) => x.slug === cmp && x.slug !== main.slug) : undefined;

  const nf = (n: number, d = 2) => formatNumber(locale, n, { maximumFractionDigits: d });
  const p = cal.pxPerMm;

  // Auto-rotate objects that are too wide for the window but fit lying the other way (phones in portrait).
  const autoRotate = box !== null && !fit && (main.w + 2 * M) * p > box.w && (main.h + 2 * M) * p <= box.w;
  const rotated = rotation ?? autoRotate;

  // Scene geometry in millimetres.
  const dim = (o: ClientObj) => (rotated ? { w: o.h, h: o.w } : { w: o.w, h: o.h });
  const a = dim(main);
  const b = other ? dim(other) : null;
  const W = Math.max(a.w, b?.w ?? 0);
  const H = Math.max(a.h, b?.h ?? 0);
  const rulerLen = Math.max(10, Math.ceil(W - 1e-6));
  const TW = Math.max(W, rulerLen) + 2 * M;
  const TH = H + 2 * M + RULER_GAP + RULER_H;
  const naturalW = TW * p;
  const naturalH = TH * p;
  const scale = fit && box ? Math.min(1, (box.w - 2) / naturalW, (box.vh * 0.8) / naturalH) : 1;
  const place = (d: { w: number; h: number }) => {
    const x = M + (W - d.w) / 2;
    const y = M + (H - d.h) / 2;
    return rotated ? `translate(${x + d.w} ${y}) rotate(90)` : `translate(${x} ${y})`;
  };

  // Devices are listed height × width like spec sheets; everything else width × height.
  const sides = (o: ClientObj) => (DEVICE_SHAPES.has(o.shape) ? [o.h, o.w] : [o.w, o.h]);
  const size = (o: ClientObj) => {
    const u = (mm: number) => `${nf(mm)} ${t.mm}`;
    if (ROUND_SHAPES.has(o.shape)) return `${t.dia} ${u(o.w)}`;
    if (o.shape === "battery") return `${t.dia} ${nf(o.w)} × ${u(o.h)}`;
    const [s1, s2] = sides(o);
    return `${nf(s1)} × ${u(s2)}`;
  };
  const round = ROUND_SHAPES.has(main.shape);
  const [m1, m2] = sides(main);
  const secondary = [
    round ? `${nf(main.w / 10)} ${t.cm}` : `${nf(m1 / 10)} × ${nf(m2 / 10)} ${t.cm}`,
    round ? `${nf(main.w / MM_PER_INCH)}″` : `${nf(m1 / MM_PER_INCH)} × ${nf(m2 / MM_PER_INCH)}″`,
    main.d ? `${t.thick} ${nf(main.d)} ${t.mm}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const name = main.name[locale];

  let ticks = "";
  for (let i = 0; i <= rulerLen; i++) {
    const len = i % 10 === 0 ? RULER_H * 0.6 : i % 5 === 0 ? RULER_H * 0.42 : RULER_H * 0.26;
    const y0 = M + H + RULER_GAP;
    ticks += `M${M + i} ${y0}V${y0 + len}`;
  }
  const labelSize = Math.min(2.6, 12 / p);
  const wider = !fit && box !== null && naturalW > box.w + 1;
  const taller = !fit && box !== null && naturalH > box.vh * 0.9;

  const options = (list: ClientObj[]) =>
    list.map((x) => (
      <option key={x.slug} value={x.slug}>
        {x.name[locale]}
      </option>
    ));
  const grouped = (list: ClientObj[]) =>
    groups
      ? groups.map((g) => {
          const part = list.filter((x) => x.cat === g.id);
          return part.length ? (
            <optgroup key={g.id} label={g.name[locale]}>
              {options(part)}
            </optgroup>
          ) : null;
        })
      : options(list);

  return (
    <div className="flex flex-col gap-3">
      <CalibrationBar locale={locale} state={cal} />

      {!fixed && items.length > 1 && (
        <div className="max-w-md">
          <label htmlFor={`${id}-o`} className="sr-only">
            {t.object}
          </label>
          <Select id={`${id}-o`} value={main.slug} onChange={(e) => setSlug(e.target.value)} size="lg">
            {grouped(items)}
          </Select>
        </div>
      )}

      <div ref={stageRef} className="scrollbar-thin overflow-x-auto rounded-[12px] border border-line bg-bg">
        <svg role="img" aria-label={`${name}: ${size(main)}`} viewBox={`0 0 ${TW} ${TH}`} width={naturalW * scale} height={naturalH * scale} className="mx-auto block max-w-none">
          <g transform={place(a)}>
            <ObjectArt o={main} />
          </g>
          {other && b && (
            <g transform={place(b)}>
              <ObjectOutline o={other} className="stroke-accent" />
            </g>
          )}
          <path d={ticks} className="stroke-fg-3" strokeWidth={1} style={{ vectorEffect: "non-scaling-stroke" }} />
          {Array.from({ length: Math.floor(rulerLen / 10) + 1 }, (_, i) => (
            <text
              key={i}
              x={i === 0 ? M : M + i * 10}
              y={M + H + RULER_GAP + RULER_H * 0.95}
              fontSize={labelSize}
              textAnchor={i === 0 ? "start" : "middle"}
              className="fill-fg-3"
            >
              {i === 0 ? `0 ${t.ruler}` : i}
            </text>
          ))}
        </svg>
      </div>

      {scale < 1 && <Notice tone="warn">{t.scaled(nf(scale * 100, 0))}</Notice>}
      {wider && <Notice>{t.wider}</Notice>}
      {!wider && taller && <Notice>{t.taller}</Notice>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-fg-2">{name}</p>
          <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl" aria-live="polite">
            {size(main)}
          </p>
          <p className="tabular text-sm text-fg-3">{secondary}</p>
          {other && (
            <p className="mt-1 text-sm text-fg-2">
              <span className="font-medium text-accent">{t.dashed}:</span> {other.name[locale]} — <span className="tabular">{size(other)}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pool.length > 1 && (
            <div className="w-48">
              <label htmlFor={`${id}-c`} className="sr-only">
                {t.compare}
              </label>
              <Select id={`${id}-c`} value={other ? other.slug : ""} onChange={(e) => setCmp(e.target.value)} size="sm">
                <option value="">{t.none}</option>
                {grouped(pool.filter((x) => x.slug !== main.slug))}
              </Select>
            </div>
          )}
          {!(round && (!other || ROUND_SHAPES.has(other.shape))) && (
            <Button variant="ghost" size="sm" onClick={() => setRotation(!rotated)} aria-pressed={rotated} title={t.rotateLabel}>
              <RotateCw aria-hidden />
              {t.rotate}
            </Button>
          )}
          <Switch label={t.fit} checked={fit} onChange={(e) => setFit(e.target.checked)} className="text-sm" />
        </div>
      </div>
    </div>
  );
}
