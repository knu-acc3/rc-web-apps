"use client";

import { useId, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CodeOutput } from "@/ui/code-output";
import { Input, Slider } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { Tabs } from "@/ui/tabs";
import { CHECKER_STYLE } from "@/tools/design/color/ui/ColorField";

type StageBg = "light" | "dark" | "checker";

const STAGE_T = {
  ru: { bg: "Фон превью", light: "Светлый", dark: "Тёмный", checker: "Шахматка" },
  en: { bg: "Preview background", light: "Light", dark: "Dark", checker: "Checker" },
} as const;

const STAGE_BG: Record<StageBg, React.CSSProperties> = {
  light: { background: "#f4f4f5" },
  dark: { background: "#18181b" },
  checker: CHECKER_STYLE,
};

/**
 * Preview area shared by the CSS generators. Preview colors are hard-coded on purpose:
 * the preview must look the same in light and dark site themes.
 */
export function Stage({
  children,
  locale,
  surface,
  defaultBg = "light",
  className,
  minHeight = 280,
  switcher = true,
}: {
  children: ReactNode;
  locale: Locale;
  /** Fixed background color (e.g. neumorphism); hides the switcher. */
  surface?: string;
  defaultBg?: StageBg;
  className?: string;
  minHeight?: number;
  switcher?: boolean;
}) {
  const t = STAGE_T[locale];
  const [bg, setBg] = useState<StageBg>(defaultBg);
  return (
    <div className={cn("relative overflow-hidden rounded-[0.75rem] border border-line", className)} style={surface ? { background: surface } : STAGE_BG[bg]}>
      {switcher && !surface && (
        <div className="absolute top-2 right-2 z-10">
          <Segmented
            label={t.bg}
            value={bg}
            onChange={setBg}
            size="sm"
            options={[
              { value: "light", label: t.light },
              { value: "dark", label: t.dark },
              { value: "checker", label: t.checker },
            ]}
          />
        </div>
      )}
      <div className="flex items-center justify-center p-6 pt-14" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}

const CODE_T = {
  ru: { copy: "Копировать", copied: "Скопировано", download: "Скачать", code: "Код" },
  en: { copy: "Copy", copied: "Copied", download: "Download", code: "Code" },
} as const;

interface CodeTab {
  id: string;
  label: string;
  code: string;
  filename?: string;
}

/** Generated code with optional tabs (CSS / HTML / Tailwind). */
export function CodePanel({ tabs, locale, minRows = 4 }: { tabs: CodeTab[]; locale: Locale; minRows?: number }) {
  const t = CODE_T[locale];
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const tab = tabs.find((x) => x.id === active) ?? tabs[0];
  if (!tab) return null;
  return (
    <div className="flex flex-col gap-2">
      {tabs.length > 1 && <Tabs label={t.code} value={tab.id} onChange={setActive} items={tabs.map((x) => ({ value: x.id, label: x.label }))} />}
      <CodeOutput
        value={tab.code}
        title={tabs.length === 1 ? tab.label : undefined}
        filename={tab.filename}
        mime={tab.filename?.endsWith(".html") ? "text/html;charset=utf-8" : "text/css;charset=utf-8"}
        labels={{ copy: t.copy, copied: t.copied, download: t.download }}
        minRows={Math.max(minRows, Math.min(18, tab.code.split("\n").length))}
      />
    </div>
  );
}

/** Label + range slider + number input, all bound to one value. */
export function NumberSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-x-3 gap-y-1", className)}>
      <label htmlFor={`${id}-n`} className="col-span-2 text-sm text-fg-2">
        {label}
      </label>
      <Slider aria-label={label} min={min} max={max} step={step} value={Math.min(max, Math.max(min, value))} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="relative">
        <Input
          id={`${id}-n`}
          type="number"
          inputMode="decimal"
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          size="sm"
          className={unit ? "pr-8" : undefined}
        />
        {unit && <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-fg-3">{unit}</span>}
      </div>
    </div>
  );
}
