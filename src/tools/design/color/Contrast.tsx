"use client";

import { ArrowUpDown, Check, X } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/ui/button";
import { Badge, Notice, Panel, PanelHeader } from "@/ui/panel";
import {
  adjustToContrast,
  apcaContrast,
  contrastRatio,
  flatten,
  formatRatio,
  parseColor,
  toHex,
  wcagChecks,
  WCAG_THRESHOLDS,
  type Color,
  type WcagCheck,
} from "./lib/color";
import { CHECKER_STYLE, ColorField, Swatch } from "./ui/ColorField";

const T = {
  ru: {
    fg: "Цвет текста",
    bg: "Цвет фона",
    swap: "Поменять цвета местами",
    ratio: "Контраст WCAG 2",
    pass: "Проходит",
    fail: "Не проходит",
    checks: {
      aaNormal: "AA — обычный текст",
      aaLarge: "AA — крупный текст",
      aaaNormal: "AAA — обычный текст",
      aaaLarge: "AAA — крупный текст",
      ui: "AA — элементы интерфейса и графика",
    } as Record<WcagCheck, string>,
    need: "нужно",
    apca: "APCA (черновик WCAG 3)",
    apcaNote: "Lc — воспринимаемая разница светлоты. Знак минус означает светлый текст на тёмном фоне.",
    apcaLevels: [
      [90, "подходит для основного текста любого размера"],
      [75, "минимум для основного текста (от 18 px обычным или 14 px жирным)"],
      [60, "текст от 24 px обычным или от 16 px жирным"],
      [45, "крупные заголовки (от 36 px обычным или 24 px жирным), значки"],
      [30, "минимум для любого текста: подписи, плейсхолдеры; границы"],
      [15, "минимум для нетекстовых элементов"],
      [0, "почти не различимо"],
    ] as [number, string][],
    preview: "Предпросмотр",
    normal: "Обычный текст 16 px — съешь же ещё этих мягких французских булок.",
    large: "Крупный текст 24 px",
    bold: "Жирный 18,66 px (14 pt)",
    button: "Кнопка",
    alphaNote: (fg: string, bg: string) =>
      `Полупрозрачный фон наложен на белую страницу, текст — на получившийся фон. Проверяются итоговые цвета: текст ${fg}, фон ${bg}.`,
    fix: "Как исправить",
    fixText: "Сделать текст",
    fixBg: "Сделать фон",
    darker: "темнее",
    lighter: "светлее",
    apply: "Применить",
    impossible: "Даже чёрный или белый не дают такого контраста с этим цветом.",
    invalid: "Введите оба цвета",
  },
  en: {
    fg: "Text color",
    bg: "Background color",
    swap: "Swap colors",
    ratio: "WCAG 2 contrast",
    pass: "Pass",
    fail: "Fail",
    checks: {
      aaNormal: "AA — normal text",
      aaLarge: "AA — large text",
      aaaNormal: "AAA — normal text",
      aaaLarge: "AAA — large text",
      ui: "AA — UI components & graphics",
    } as Record<WcagCheck, string>,
    need: "needs",
    apca: "APCA (WCAG 3 draft)",
    apcaNote: "Lc is the perceived lightness difference. A minus sign means light text on a dark background.",
    apcaLevels: [
      [90, "fine for body text at any size"],
      [75, "minimum for body text (18 px regular or 14 px bold and up)"],
      [60, "text from 24 px regular or 16 px bold"],
      [45, "large headlines (36 px regular or 24 px bold), icons"],
      [30, "minimum for any text: captions, placeholders; borders"],
      [15, "minimum for non-text elements"],
      [0, "barely distinguishable"],
    ] as [number, string][],
    preview: "Preview",
    normal: "Normal text 16 px — the quick brown fox jumps over the lazy dog.",
    large: "Large text 24 px",
    bold: "Bold 18.66 px (14 pt)",
    button: "Button",
    alphaNote: (fg: string, bg: string) =>
      `The translucent background is composited over a white page and the text over the result. The checked colors are text ${fg} on ${bg}.`,
    fix: "How to fix",
    fixText: "Make the text",
    fixBg: "Make the background",
    darker: "darker",
    lighter: "lighter",
    apply: "Apply",
    impossible: "Even black or white can't reach this ratio against that color.",
    invalid: "Enter both colors",
  },
} as const;

const CHECKS: WcagCheck[] = ["aaNormal", "aaLarge", "aaaNormal", "aaaLarge", "ui"];

export default function ContrastChecker({ locale, fg: fg0 = "#6363F8", bg: bg0 = "#FFFFFF" }: { locale: Locale; fg?: string; bg?: string }) {
  const t = T[locale];
  const [fgText, setFg] = useState(fg0);
  const [bgText, setBg] = useState(bg0);
  const fg = parseColor(fgText);
  const bg = parseColor(bgText);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <ColorField label={t.fg} value={fgText} onChange={setFg} locale={locale} size="lg" />
          <IconButton
            variant="tonal"
            onClick={() => {
              setFg(bgText);
              setBg(fgText);
            }}
            label={t.swap}
            icon={<ArrowUpDown aria-hidden />}
            className="mx-auto md:mb-1 md:rotate-90"
          />
          <ColorField label={t.bg} value={bgText} onChange={setBg} locale={locale} size="lg" />
        </div>
      </Panel>
      {fg && bg ? <Results fg={fg} bg={bg} t={t} onFg={setFg} onBg={setBg} /> : <Notice>{t.invalid}</Notice>}
    </div>
  );
}

type Dict = (typeof T)[Locale];

function Results({ fg, bg, t, onFg, onBg }: { fg: Color; bg: Color; t: Dict; onFg: (v: string) => void; onBg: (v: string) => void }) {
  const ratio = contrastRatio(fg, bg);
  const checks = wcagChecks(ratio);
  const lc = apcaContrast(fg, bg);
  const flat = flatten(fg, bg);
  const translucent = fg.alpha < 1 || bg.alpha < 1;
  const abs = Math.abs(lc);
  const level = t.apcaLevels.find(([min]) => abs >= min)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="p-4 sm:p-5">
          <div className="text-sm font-medium text-fg-2">{t.ratio}</div>
          <p className="tabular mt-1 text-5xl font-bold tracking-tight text-fg sm:text-6xl" aria-live="polite">
            {formatRatio(ratio)}:1
            <span className="sr-only">
              {" "}
              — {t.checks.aaNormal}: {checks.aaNormal ? t.pass : t.fail}
            </span>
          </p>
          <ul className="mt-4 grid gap-1">
            {CHECKS.map((k) => (
              <li key={k} className="flex min-h-11 items-center justify-between gap-3 rounded-[0.75rem] bg-surface-2 px-3 py-1.5">
                <span className="min-w-0 text-[0.9375rem] text-fg">
                  {t.checks[k]} <span className="block text-sm text-fg-3">{t.need} {WCAG_THRESHOLDS[k]}:1</span>
                </span>
                <Badge tone={checks[k] ? "ok" : "err"} className="shrink-0 whitespace-nowrap">
                  {checks[k] ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                  {checks[k] ? t.pass : t.fail}
                </Badge>
              </li>
            ))}
          </ul>
          {translucent && <Notice className="mt-3">{t.alphaNote(toHex(flat.fg), toHex(flat.bg))}</Notice>}
        </Panel>
        <Panel className="p-4 sm:p-5">
          <div className="text-sm font-medium text-fg-2">{t.apca}</div>
          <div className="tabular mt-1 text-3xl font-bold text-fg">Lc {(Math.round(lc * 10) / 10).toFixed(1)}</div>
          <p className="mt-1 text-[0.9375rem] text-fg">{level[1]}</p>
          <p className="mt-2 text-sm text-fg-3">{t.apcaNote}</p>
        </Panel>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="overflow-hidden">
          <PanelHeader title={t.preview} />
          <div style={CHECKER_STYLE}>
            <div className="flex flex-col gap-3 p-4 sm:p-5" style={{ background: toHex(bg), color: toHex(fg) }}>
              <p className="text-base">{t.normal}</p>
              <p className="text-2xl">{t.large}</p>
              <p className="text-[1.1663rem] font-bold">{t.bold}</p>
              <span className="inline-flex w-fit items-center rounded-full border-2 px-5 py-2 font-medium" style={{ borderColor: toHex(fg) }}>
                {t.button}
              </span>
            </div>
          </div>
        </Panel>
        {!checks.aaaNormal && <Fixes fg={fg} bg={bg} t={t} onFg={onFg} onBg={onBg} />}
      </div>
    </div>
  );
}

function Fixes({ fg, bg, t, onFg, onBg }: { fg: Color; bg: Color; t: Dict; onFg: (v: string) => void; onBg: (v: string) => void }) {
  const flat = flatten(fg, bg);
  const rows: { label: string; color: Color | null; apply: (hex: string) => void; target: number }[] = [];
  for (const target of [4.5, 7]) {
    if (contrastRatio(fg, bg) >= target) continue;
    rows.push({ label: t.fixText, color: adjustToContrast(flat.fg, flat.bg, target, "fg"), apply: onFg, target });
    rows.push({ label: t.fixBg, color: adjustToContrast(flat.bg, flat.fg, target, "bg"), apply: onBg, target });
  }
  if (!rows.length) return null;
  const lighterOrDarker = (orig: Color, c: Color) => {
    const l = (x: Color) => 0.2126 * x.r + 0.7152 * x.g + 0.0722 * x.b;
    return l(c) > l(orig) ? t.lighter : t.darker;
  };
  return (
    <Panel>
      <PanelHeader title={t.fix} />
      <ul className="flex flex-col gap-1 p-2">
        {rows.map((r, i) => {
          const orig = r.apply === onFg ? flat.fg : flat.bg;
          return (
            <li key={i} className="flex items-center gap-3 rounded-[0.75rem] px-2 py-2 transition-colors hover:bg-surface-2">
              {r.color ? (
                <>
                  <Swatch color={toHex(r.color)} className="size-10 shrink-0" />
                  <span className="min-w-0 flex-1 text-[0.9375rem]">
                    <span className="text-fg">
                      {r.label} {lighterOrDarker(orig, r.color)}: <code className="font-mono">{toHex(r.color)}</code>
                    </span>
                    <span className={cn("block text-sm text-fg-3")}>
                      {formatRatio(r.apply === onFg ? contrastRatio(r.color, flat.bg) : contrastRatio(flat.fg, r.color))}:1 · ≥ {r.target}:1
                    </span>
                  </span>
                  <Button size="sm" variant="tonal" onClick={() => r.apply(toHex(r.color!))}>
                    {t.apply}
                  </Button>
                </>
              ) : (
                <span className="text-sm text-fg-3">
                  {r.label}: {t.impossible} (≥ {r.target}:1)
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
