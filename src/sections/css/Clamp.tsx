"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { parseNumber } from "@/i18n/format";
import { CopyButton } from "@/ui/copy-button";
import { Input, Slider } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { round } from "./lib/tokens";
import { clampAt, fluidClamp, type ClampInput } from "./lib/units";
import { CodePanel } from "./ui/kit";

const T = {
  ru: {
    minSize: "Размер на узком экране, px",
    maxSize: "Размер на широком экране, px",
    minVw: "Ширина узкого экрана, px",
    maxVw: "Ширина широкого экрана, px",
    root: "Базовый шрифт, px",
    preview: "Предпросмотр на ширине",
    sample: "Заголовок меняет размер плавно",
    size: (px: string) => `${px} px`,
    invalid: "Проверьте значения: ширины экранов должны различаться, размеры — больше нуля",
    copy: "Копировать",
    copied: "Скопировано",
    table: "Размер на разных экранах",
  },
  en: {
    minSize: "Size on a narrow screen, px",
    maxSize: "Size on a wide screen, px",
    minVw: "Narrow screen width, px",
    maxVw: "Wide screen width, px",
    root: "Root font size, px",
    preview: "Preview at width",
    sample: "This heading scales smoothly",
    size: (px: string) => `${px}px`,
    invalid: "Check the values: screen widths must differ and sizes must be above zero",
    copy: "Copy",
    copied: "Copied",
    table: "Size on different screens",
  },
} as const;

const FIELDS = ["minSize", "maxSize", "minVw", "maxVw", "root"] as const;
type Key = (typeof FIELDS)[number];

export default function ClampGenerator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [v, setV] = useState<Record<Key, string>>({ minSize: "16", maxSize: "24", minVw: "360", maxVw: "1280", root: "16" });
  const [width, setWidth] = useState(800);
  const nums = Object.fromEntries(FIELDS.map((k) => [k, parseNumber(v[k])])) as Record<Key, number | null>;
  const valid = FIELDS.every((k) => nums[k] !== null && nums[k]! > 0) && nums.minVw !== nums.maxVw;
  const input: ClampInput | null = valid ? { minSize: nums.minSize!, maxSize: nums.maxSize!, minViewport: nums.minVw!, maxViewport: nums.maxVw!, root: nums.root! } : null;
  const result = input ? fluidClamp(input) : null;
  const decl = result ? `font-size: ${result.css};` : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {FIELDS.map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <label htmlFor={`${id}-${k}`} className="text-xs text-fg-2">
                {t[k]}
              </label>
              <Input id={`${id}-${k}`} inputMode="decimal" value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} className="tabular" autoComplete="off" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex min-h-14 items-center justify-between gap-2 rounded-[0.625rem] bg-surface-2 px-4 py-2">
          <output className="min-w-0 font-mono text-lg font-semibold break-all text-fg sm:text-xl" aria-live="polite">
            {result ? result.css : <span className="text-base font-normal text-fg-3">{t.invalid}</span>}
          </output>
          <CopyButton value={result?.css ?? ""} label={t.copy} copiedLabel={t.copied} size="sm" variant="ghost" />
        </div>
      </Panel>

      {input && result ? (
        <>
          <Panel className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <label htmlFor={`${id}-w`} className="shrink-0 text-sm text-fg-2">
                {t.preview}
              </label>
              <Slider id={`${id}-w`} min={320} max={1920} step={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
              <span className="tabular w-16 shrink-0 text-right text-sm text-fg-2">{width}px</span>
            </div>
            <p className="font-semibold break-words text-fg" style={{ fontSize: `${clampAt(input, width)}px`, lineHeight: 1.2 }}>
              {t.sample} <span className="text-sm font-normal text-fg-3">· {t.size(round(clampAt(input, width), 2))}</span>
            </p>
          </Panel>
          <div tabIndex={0} className="tbl">
            <table>
              <caption className="sr-only">{t.table}</caption>
              <thead>
                <tr>
                  {[360, 768, 1024, 1280, 1440, 1920].map((w) => (
                    <th key={w} scope="col">
                      {w}px
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[360, 768, 1024, 1280, 1440, 1920].map((w) => (
                    <td key={w}>{t.size(round(clampAt(input, w), 2))}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <CodePanel locale={locale} tabs={[{ id: "css", label: "CSS", code: `h1 {\n  ${decl}\n}`, filename: "fluid-type.css" }]} minRows={3} />
        </>
      ) : (
        <Notice tone="warn">{t.invalid}</Notice>
      )}
    </div>
  );
}
