"use client";

import { Download, Lock, LockOpen, Shuffle } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { downloadBlob } from "@/lib/clipboard";
import { copyText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Tabs } from "@/ui/tabs";
import { randomFloat } from "@/sections/random/lib/rng";
import { fromOklch, parseColor, readableTextColor, toGamut, toHex, type Color } from "../lib/color";
import { ColorField } from "../ui/ColorField";
import { exportCss, exportJson, exportTailwind3, exportTailwind4, harmonyPalette, PALETTE_MODES, randomPalette, type PaletteMode } from "./lib/palette";

const T = {
  ru: {
    base: "Базовый цвет",
    mode: "Схема",
    count: "Цветов",
    generate: "Сгенерировать",
    hint: "Пробел — новая палитра, замок фиксирует цвет",
    lock: "Зафиксировать цвет",
    unlock: "Снять фиксацию",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    png: "PNG",
    export: "Экспорт палитры",
    modes: {
      analogous: "Аналоговая",
      complementary: "Комплементарная",
      triadic: "Триада",
      "split-complementary": "Раздельно-комплементарная",
      tetradic: "Тетрада",
      square: "Квадрат",
      monochromatic: "Монохромная",
      random: "Случайная",
    } as Record<PaletteMode, string>,
  },
  en: {
    base: "Base color",
    mode: "Scheme",
    count: "Colors",
    generate: "Generate",
    hint: "Space — new palette, the lock keeps a color",
    lock: "Lock color",
    unlock: "Unlock color",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    png: "PNG",
    export: "Export palette",
    modes: {
      analogous: "Analogous",
      complementary: "Complementary",
      triadic: "Triadic",
      "split-complementary": "Split-complementary",
      tetradic: "Tetradic",
      square: "Square",
      monochromatic: "Monochromatic",
      random: "Random",
    } as Record<PaletteMode, string>,
  },
} as const;

type Fmt = "css" | "tw4" | "tw3" | "json";
const FALLBACK: Color = { r: 0.23, g: 0.51, b: 0.96, alpha: 1 };

export default function PaletteGenerator({ locale, mode: mode0 = "analogous", base: base0 = "#3B82F6" }: { locale: Locale; mode?: PaletteMode; base?: string }) {
  const t = T[locale];
  const id = useId();
  const [base, setBase] = useState(base0);
  const [mode, setMode] = useState<PaletteMode>(mode0);
  const [count, setCount] = useState(5);
  const [randomColors, setRandomColors] = useState<Color[] | null>(null);
  const [locked, setLocked] = useState<Record<number, Color>>({});
  const [fmt, setFmt] = useState<Fmt>("css");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const baseColor = parseColor(base) ?? FALLBACK;
  const generated = mode === "random" ? (randomColors ?? harmonyPalette(baseColor, "analogous", count)) : harmonyPalette(baseColor, mode, count);
  const colors = Array.from({ length: count }, (_, i) => locked[i] ?? generated[i] ?? generated[generated.length - 1]);

  function generate() {
    if (mode === "random") setRandomColors(randomPalette(count, randomFloat));
    else setBase(toHex(toGamut(fromOklch(0.45 + randomFloat() * 0.35, 0.08 + randomFloat() * 0.12, randomFloat() * 360))));
  }
  const genRef = useRef(generate);
  useEffect(() => {
    genRef.current = generate;
  });
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.closest("input, textarea, select, button, a, [role='slider'], [contenteditable='true']") || el.isContentEditable)) return;
      e.preventDefault();
      genRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const code = fmt === "css" ? exportCss(colors) : fmt === "tw4" ? exportTailwind4(colors) : fmt === "tw3" ? exportTailwind3(colors) : exportJson(colors);

  function downloadPng() {
    const w = 1200;
    const h = 630;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sw = w / colors.length;
    colors.forEach((c, i) => {
      ctx.fillStyle = toHex(c);
      ctx.fillRect(Math.floor(i * sw), 0, Math.ceil(sw), h);
      ctx.fillStyle = readableTextColor(c);
      ctx.font = "600 28px ui-monospace, Menlo, Consolas, monospace";
      ctx.textAlign = "center";
      ctx.fillText(toHex(c), i * sw + sw / 2, h - 48);
    });
    canvas.toBlob((b) => b && downloadBlob(b, "palette.png"), "image/png");
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto]">
          <ColorField label={t.base} value={base} onChange={setBase} locale={locale} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-m`} className="text-sm font-medium text-fg-2">
              {t.mode}
            </label>
            <Select id={`${id}-m`} value={mode} onChange={(e) => setMode(e.target.value as PaletteMode)}>
              {PALETTE_MODES.map((m) => (
                <option key={m} value={m}>
                  {t.modes[m]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-n`} className="text-sm font-medium text-fg-2">
              {t.count}
            </label>
            <Select id={`${id}-n`} value={String(count)} onChange={(e) => setCount(Number(e.target.value))} className="w-24">
              {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="primary" onClick={generate}>
            <Shuffle aria-hidden />
            {t.generate}
          </Button>
        </div>
      </Panel>

      <div>
        <ul className="grid overflow-hidden rounded-[12px] border border-line" style={{ gridTemplateColumns: `repeat(${colors.length}, minmax(0, 1fr))` }}>
          {colors.map((c, i) => {
            const hex = toHex(c);
            const fg = readableTextColor(c);
            const isLocked = !!locked[i];
            return (
              <li key={i} className="relative flex h-56 flex-col justify-between sm:h-72" style={{ background: hex, color: fg }}>
                <button
                  type="button"
                  aria-pressed={isLocked}
                  aria-label={`${isLocked ? t.unlock : t.lock} ${hex}`}
                  title={isLocked ? t.unlock : t.lock}
                  onClick={() =>
                    setLocked((prev) => {
                      const next = { ...prev };
                      if (next[i]) delete next[i];
                      else next[i] = c;
                      return next;
                    })
                  }
                  className={isLocked ? "m-2 self-center rounded-full p-2" : "m-2 self-center rounded-full p-2 opacity-60 hover:opacity-100 focus-visible:opacity-100"}
                >
                  {isLocked ? <Lock className="size-4" aria-hidden /> : <LockOpen className="size-4" aria-hidden />}
                </button>
                <button
                  type="button"
                  className="px-1 pb-3 font-mono text-xs font-semibold break-all sm:text-sm"
                  aria-label={`${t.copy} ${hex}`}
                  onClick={async () => {
                    if (await copyText(hex)) {
                      setCopiedIdx(i);
                      setTimeout(() => setCopiedIdx((x) => (x === i ? null : x)), 1200);
                    }
                  }}
                >
                  {copiedIdx === i ? t.copied : hex.slice(1)}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-sm text-fg-3">{t.hint}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Tabs
          label={t.export}
          value={fmt}
          onChange={setFmt}
          items={[
            { value: "css", label: "CSS" },
            { value: "tw4", label: "Tailwind v4" },
            { value: "tw3", label: "Tailwind v3" },
            { value: "json", label: "JSON" },
          ]}
        />
        <CodeOutput
          value={code}
          filename={fmt === "json" ? "palette.json" : fmt === "tw3" ? "palette.js" : "palette.css"}
          labels={{ copy: t.copy, copied: t.copied, download: t.download }}
          minRows={Math.min(12, code.split("\n").length)}
          extraActions={
            <Button variant="ghost" size="sm" onClick={downloadPng}>
              <Download aria-hidden />
              {t.png}
            </Button>
          }
        />
      </div>
    </div>
  );
}
