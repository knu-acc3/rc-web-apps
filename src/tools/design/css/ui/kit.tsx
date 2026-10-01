"use client";

import { useId, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CodeOutput } from "@/ui/code-output";
import { Segmented } from "@/ui/segmented";
import { SliderField } from "@/ui/slider-field";
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
    <div className={cn("relative overflow-hidden rounded-[1.25rem] shadow-card", className)} style={surface ? { background: surface } : STAGE_BG[bg]}>
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

/** Decimals implied by a slider step: 1 → 0, 0.1 → 1, 0.125 → 3. */
function stepDecimals(step: number): number {
  const str = String(step);
  return str.includes(".") ? str.length - str.indexOf(".") - 1 : 0;
}

/** Reads what the user typed: "12", "-4", "1,5", "−3" (typographic minus). */
function parseNum(text: string): number | null {
  const s = text.trim().replace(",", ".").replace(/^[−–]/, "-");
  if (!s || s === "-" || s === ".") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * A CSS length or percentage you can drag: the value written on the line (tap it to type an exact number, even past
 * the slider's ends) and a Material slider under it. Keeps the number API of the generators.
 */
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
  const decimals = stepDecimals(step);
  const format = (n: number) => String(Number(n.toFixed(decimals)));
  const [text, setText] = useState(() => format(Number.isFinite(value) ? value : 0));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    if (parseNum(text) !== value) setText(format(value));
  }
  return (
    <SliderField
      id={id}
      label={label}
      value={text}
      onChange={(s) => {
        setText(s);
        const n = parseNum(s);
        if (n !== null) onChange(n);
      }}
      parse={parseNum}
      format={format}
      min={min}
      max={max}
      step={step}
      suffix={unit}
      className={className}
    />
  );
}
