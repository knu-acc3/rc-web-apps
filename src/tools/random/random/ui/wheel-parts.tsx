"use client";

import { memo, useId, useState } from "react";
import { formatNumber, parseNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { Input } from "@/ui/field";
import { paletteColor, readableTextColor, type Sector } from "../lib/wheel";

export interface WheelEntry {
  id: number;
  label: string;
  weight: number;
  /** Custom colour (#rrggbb) or undefined for the automatic palette. */
  color?: string;
}

const entryColor = (e: WheelEntry, i: number, n: number) => e.color ?? paletteColor(i, n);

const R = 98;

function point(angleDeg: number, r: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  // Rounded: the server and the browser must print identical SVG coordinates (hydration).
  return [Math.round(r * Math.sin(a) * 1000) / 1000, Math.round(-r * Math.cos(a) * 1000) / 1000];
}

function slicePath(start: number, end: number): string {
  const [x1, y1] = point(start, R);
  const [x2, y2] = point(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M0 0L${x1.toFixed(3)} ${y1.toFixed(3)}A${R} ${R} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}Z`;
}

function fitLabel(label: string, width: number, count: number): { text: string; size: number } {
  // Font size limited by the arc height at ~60 % radius and by the slice count.
  const arc = (width * Math.PI * 58) / 180;
  const size = Math.max(3.2, Math.min(count <= 8 ? 10 : 8.5, arc * 0.62));
  const room = R - 26; // radial space between the hub and the rim
  const maxChars = Math.max(2, Math.floor(room / (size * 0.56)));
  const text = label.length > maxChars ? label.slice(0, maxChars - 1).trimEnd() + "…" : label;
  return { text, size };
}

/** Static wheel drawing (rotation is applied by the parent to a wrapper element). */
export const WheelSvg = memo(function WheelSvg({ entries, sectors }: { entries: readonly WheelEntry[]; sectors: readonly Sector[] }) {
  const n = entries.length;
  return (
    <svg viewBox="-100 -100 200 200" className="block size-full select-none" aria-hidden focusable="false">
      <circle r={R + 1.5} fill="var(--line-strong)" />
      {n === 0 && <circle r={R} fill="var(--surface-2)" />}
      {n === 1 && <circle r={R} fill={entryColor(entries[0], 0, 1)} />}
      {n > 1 &&
        sectors.map((s, i) =>
          s.end > s.start ? <path key={entries[i].id} d={slicePath(s.start, s.end)} fill={entryColor(entries[i], i, n)} stroke="#ffffff" strokeOpacity={0.55} strokeWidth={0.5} /> : null,
        )}
      {sectors.map((s, i) => {
        if (s.end <= s.start || !entries[i]) return null;
        const width = s.end - s.start;
        const mid = n === 1 ? 0 : s.start + width / 2;
        const { text, size } = fitLabel(entries[i].label, n === 1 ? 360 : width, n);
        const fill = readableTextColor(entryColor(entries[i], i, n));
        // Labels on the left half are turned 180° so they read upright when the wheel is at rest.
        const flip = n > 1 && mid > 180;
        return (
          <text
            key={`t${entries[i].id}`}
            transform={`rotate(${(flip ? mid + 90 : mid - 90).toFixed(3)})`}
            x={flip ? -(R - 7) : R - 7}
            y={0}
            textAnchor={flip ? "start" : "end"}
            dominantBaseline="central"
            fontSize={size}
            fontWeight={600}
            fill={fill}
            style={{ fontFamily: "inherit" }}
          >
            {text}
          </text>
        );
      })}
      <circle r={13} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth={1.5} />
      <circle r={4} fill="var(--fg-3)" />
    </svg>
  );
});

/** Pointer at 12 o'clock, drawn above the rotating wheel. */
export function WheelPointer() {
  return (
    <svg viewBox="0 0 40 44" className="pointer-events-none absolute left-1/2 top-0 z-10 w-9 -translate-x-1/2 -translate-y-[35%] drop-shadow-sm" aria-hidden focusable="false">
      <path d="M4 4h32L20 40z" fill="var(--fg)" stroke="var(--surface)" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}

const TW = {
  ru: { weight: "Вес", color: "Цвет", chance: "Шанс", of: "для" },
  en: { weight: "Weight", color: "Colour", chance: "Chance", of: "for" },
} as const;

/** Per-entry weights and colours. */
export function EntryTable({
  locale,
  entries,
  disabled,
  onWeight,
  onColor,
}: {
  locale: Locale;
  entries: readonly WheelEntry[];
  disabled: boolean;
  onWeight: (id: number, w: number) => void;
  onColor: (id: number, c: string) => void;
}) {
  const t = TW[locale];
  const total = entries.reduce((s, e) => s + e.weight, 0);
  return (
    <div tabIndex={0} className="tbl">
      <table>
        <thead>
          <tr>
            <th scope="col">{t.color}</th>
            <th scope="col" className="w-full">
              {locale === "ru" ? "Вариант" : "Entry"}
            </th>
            <th scope="col">{t.weight}</th>
            <th scope="col" className="text-right">
              {t.chance}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.id}>
              <td className="py-1!">
                <input
                  type="color"
                  value={entryColor(e, i, entries.length)}
                  disabled={disabled}
                  onChange={(ev) => onColor(e.id, ev.target.value)}
                  aria-label={`${t.color} ${t.of} «${e.label}»`}
                  className="h-8 w-10 cursor-pointer rounded-[0.375rem] border border-line bg-surface p-0.5"
                />
              </td>
              <td className="max-w-40 truncate sm:max-w-none">{e.label}</td>
              <td className="py-1!">
                <WeightInput locale={locale} value={e.weight} disabled={disabled} label={`${t.weight} ${t.of} «${e.label}»`} onCommit={(w) => onWeight(e.id, w)} />
              </td>
              <td className="tabular text-right whitespace-nowrap text-fg-2">
                {total > 0 ? `${formatNumber(locale, (e.weight / total) * 100, { maximumFractionDigits: e.weight / total < 0.01 ? 2 : 1 })} %` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeightInput({ locale, value, onCommit, label, disabled }: { locale: Locale; value: number; onCommit: (w: number) => void; label: string; disabled: boolean }) {
  const id = useId();
  const [text, setText] = useState<string | null>(null);
  const parsed = text === null ? value : parseNumber(text);
  const valid = parsed !== null && Math.round(parsed * 100) > 0 && parsed <= 1000;
  return (
    <Input
      id={id}
      size="sm"
      inputMode="decimal"
      autoComplete="off"
      aria-label={label}
      aria-invalid={!valid}
      disabled={disabled}
      className="tabular w-20"
      value={text ?? formatNumber(locale, value, { useGrouping: false })}
      onChange={(ev) => {
        const v = ev.target.value;
        setText(v);
        const n = parseNumber(v);
        const w = n === null ? 0 : Math.round(n * 100) / 100;
        if (w > 0 && w <= 1000) onCommit(w);
      }}
      onBlur={() => setText(null)}
    />
  );
}
