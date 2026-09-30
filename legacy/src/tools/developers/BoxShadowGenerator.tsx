"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeSlash,
  ArrowSquareIn,
  ArrowSquareOut,
  Warning,
  DownloadSimple,
  ClipboardText,
  Check,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { downloadBlob } from "@/src/utils/exportHelpers";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { MobileSlider } from "@/src/components/tool/MobileSlider";
import ColorPickerInput from "@/src/components/ColorPickerInput";

interface Shadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
  enabled: boolean;
}

const defaultShadow = (): Shadow => ({
  offsetX: 4,
  offsetY: 4,
  blur: 10,
  spread: 0,
  color: "#00000040",
  inset: false,
  enabled: true,
});

// 6 focused preset stacks (Subtle, Medium, Strong, Inner, Neumorphism light/dark)
const SHADOW_PRESETS: {
  id: string;
  labelRu: string;
  labelEn: string;
  shadows: Omit<Shadow, "enabled">[];
}[] = [
  {
    id: "subtle",
    labelRu: "Лёгкая",
    labelEn: "Subtle",
    shadows: [
      {
        offsetX: 0,
        offsetY: 1,
        blur: 3,
        spread: 0,
        color: "#0000001a",
        inset: false,
      },
    ],
  },
  {
    id: "medium",
    labelRu: "Средняя",
    labelEn: "Medium",
    shadows: [
      {
        offsetX: 0,
        offsetY: 4,
        blur: 6,
        spread: -1,
        color: "#0000001a",
        inset: false,
      },
      {
        offsetX: 0,
        offsetY: 2,
        blur: 4,
        spread: -2,
        color: "#0000001a",
        inset: false,
      },
    ],
  },
  {
    id: "strong",
    labelRu: "Сильная",
    labelEn: "Strong",
    shadows: [
      {
        offsetX: 0,
        offsetY: 25,
        blur: 50,
        spread: -12,
        color: "#00000040",
        inset: false,
      },
      {
        offsetX: 0,
        offsetY: 10,
        blur: 20,
        spread: -5,
        color: "#00000033",
        inset: false,
      },
      {
        offsetX: 0,
        offsetY: 4,
        blur: 8,
        spread: -2,
        color: "#0000001a",
        inset: false,
      },
      {
        offsetX: 0,
        offsetY: 2,
        blur: 4,
        spread: 0,
        color: "#00000014",
        inset: false,
      },
    ],
  },
  {
    id: "inner",
    labelRu: "Внутренняя",
    labelEn: "Inner",
    shadows: [
      {
        offsetX: 0,
        offsetY: 2,
        blur: 6,
        spread: 0,
        color: "#00000040",
        inset: true,
      },
    ],
  },
  {
    id: "neumorph-light",
    labelRu: "Неоморф. светл.",
    labelEn: "Neumorph light",
    shadows: [
      {
        offsetX: -8,
        offsetY: -8,
        blur: 16,
        spread: 0,
        color: "#ffffffcc",
        inset: false,
      },
      {
        offsetX: 8,
        offsetY: 8,
        blur: 16,
        spread: 0,
        color: "#bebebe80",
        inset: false,
      },
    ],
  },
  {
    id: "neumorph-dark",
    labelRu: "Неоморф. тёмн.",
    labelEn: "Neumorph dark",
    shadows: [
      {
        offsetX: -8,
        offsetY: -8,
        blur: 16,
        spread: 0,
        color: "#4a4a4a99",
        inset: false,
      },
      {
        offsetX: 8,
        offsetY: 8,
        blur: 16,
        spread: 0,
        color: "#0000009a",
        inset: false,
      },
    ],
  },
];

function shadowToCSS(s: Shadow): string {
  const parts = [
    ...(s.inset ? ["inset"] : []),
    `${s.offsetX}px`,
    `${s.offsetY}px`,
    `${s.blur}px`,
    `${s.spread}px`,
    s.color,
  ];
  return parts.join(" ");
}

// ----- CSS parser -----------------------------------------------------------

/**
 * Split a `box-shadow` value into individual layers. Commas inside `rgba(...)`,
 * `rgb(...)`, `hsl(...)`, `hsla(...)` must NOT split the layer, so we track
 * parenthesis depth manually.
 */
function splitLayers(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** Tokenize a single layer, keeping color functions like `rgba(0,0,0,0.5)` intact. */
function tokenizeLayer(layer: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < layer.length; i++) {
    const ch = layer[i];
    if (ch === "(") {
      depth++;
      buf += ch;
    } else if (ch === ")") {
      depth = Math.max(0, depth - 1);
      buf += ch;
    } else if (/\s/.test(ch) && depth === 0) {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}

function parsePx(token: string): number | null {
  const m = token.match(/^(-?\d+(?:\.\d+)?)(px)?$/);
  if (!m) return null;
  return parseFloat(m[1]);
}

function isLength(token: string): boolean {
  return /^-?\d+(?:\.\d+)?(?:px)?$/.test(token);
}

function isColor(token: string): boolean {
  if (/^#[0-9a-fA-F]{3,8}$/.test(token)) return true;
  if (/^(rgba?|hsla?)\s*\(/i.test(token)) return true;
  // Named colors — accept anything alphabetic that isn't `inset`
  if (/^[a-zA-Z]+$/.test(token) && token.toLowerCase() !== "inset") return true;
  return false;
}

function parseSingleLayer(layer: string): Shadow | null {
  const tokens = tokenizeLayer(layer);
  if (tokens.length === 0) return null;

  let inset = false;
  const lengths: number[] = [];
  let color: string | null = null;

  for (const tok of tokens) {
    if (tok.toLowerCase() === "inset") {
      inset = true;
    } else if (isLength(tok)) {
      const v = parsePx(tok);
      if (v !== null) lengths.push(v);
    } else if (isColor(tok)) {
      // The last color-looking token wins.
      color = tok;
    }
  }

  if (lengths.length < 2) return null;

  const [offsetX, offsetY] = lengths;
  const blur = lengths[2] ?? 0;
  const spread = lengths[3] ?? 0;

  return {
    offsetX,
    offsetY,
    blur,
    spread,
    color: color ?? "#00000040",
    inset,
    enabled: true,
  };
}

interface ParseResult {
  shadows: Shadow[];
  error: string | null;
}

function parseBoxShadow(input: string): ParseResult {
  const trimmed = input
    .trim()
    .replace(/^box-shadow\s*:\s*/i, "")
    .replace(/;\s*$/, "")
    .trim();
  if (!trimmed) return { shadows: [], error: "empty" };
  if (/^none$/i.test(trimmed)) return { shadows: [], error: "none" };

  const parts = splitLayers(trimmed);
  if (parts.length === 0) return { shadows: [], error: "empty" };

  const out: Shadow[] = [];
  for (const p of parts) {
    const layer = parseSingleLayer(p);
    if (!layer) return { shadows: [], error: `bad: ${p}` };
    out.push(layer);
  }
  return { shadows: out, error: null };
}

// ----- Component ------------------------------------------------------------

export default function BoxShadowGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [shadows, setShadows] = useState<Shadow[]>([defaultShadow()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bgColor, setBgColor] = useState("#f3f4f6");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeShadow = shadows[activeIndex] ?? shadows[0];

  const updateShadow = useCallback(
    (key: keyof Shadow, value: number | string | boolean) => {
      setShadows((prev) =>
        prev.map((s, i) => (i === activeIndex ? { ...s, [key]: value } : s)),
      );
    },
    [activeIndex],
  );

  const updateShadowAt = useCallback(
    (index: number, key: keyof Shadow, value: number | string | boolean) => {
      setShadows((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
      );
    },
    [],
  );

  const addShadow = useCallback(() => {
    const newShadow = defaultShadow();
    setShadows((prev) => {
      setActiveIndex(prev.length);
      return [...prev, newShadow];
    });
  }, []);

  const removeShadow = useCallback((index: number) => {
    setShadows((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setActiveIndex((ai) =>
        ai >= next.length
          ? Math.max(0, next.length - 1)
          : Math.min(ai, next.length - 1),
      );
      return next;
    });
  }, []);

  const moveShadow = useCallback((index: number, direction: -1 | 1) => {
    setShadows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      setActiveIndex((ai) => {
        if (ai === index) return target;
        if (ai === target) return index;
        return ai;
      });
      return next;
    });
  }, []);

  const applyPreset = useCallback((p: (typeof SHADOW_PRESETS)[number]) => {
    setShadows(p.shadows.map((s) => ({ ...s, enabled: true })));
    setActiveIndex(0);
  }, []);

  const handleImport = useCallback(() => {
    const result = parseBoxShadow(importText);
    if (result.error) {
      setImportError(
        isEn
          ? `Could not parse: ${result.error === "empty" ? "empty input" : result.error === "none" ? "`none` has no layers" : "invalid CSS syntax"}`
          : `Не удалось разобрать: ${result.error === "empty" ? "пустой ввод" : result.error === "none" ? "`none` не имеет слоёв" : "неверный синтаксис"}`,
      );
      return;
    }
    if (result.shadows.length === 0) {
      setImportError(
        isEn
          ? "No shadow layers found"
          : "Слои тени не найдены",
      );
      return;
    }
    setShadows(result.shadows);
    setActiveIndex(0);
    setImportError(null);
    setImportText("");
  }, [importText, isEn]);

  const enabledShadows = useMemo(
    () => shadows.filter((s) => s.enabled),
    [shadows],
  );
  const fullCSS = useMemo(
    () =>
      enabledShadows.length > 0
        ? enabledShadows.map(shadowToCSS).join(", ")
        : "none",
    [enabledShadows],
  );
  const cssCode = `box-shadow: ${fullCSS};`;

  const copyCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = cssCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, [cssCode]);
  const shadowReport = useMemo(() => {
    const lines = [
      isEn ? "Box shadow export" : "Экспорт box-shadow",
      `${isEn ? "Layers" : "Слоёв"}: ${enabledShadows.length}/${shadows.length}`,
      `${isEn ? "Preview background" : "Фон превью"}: ${bgColor}`,
      "",
      cssCode,
      "",
      ...enabledShadows.map((shadow, index) => {
        const kind = shadow.inset ? "inset" : "outset";
        return `${index + 1}. ${kind}: x=${shadow.offsetX}px, y=${shadow.offsetY}px, blur=${shadow.blur}px, spread=${shadow.spread}px, color=${shadow.color}`;
      }),
    ];
    return lines.join("\n");
  }, [bgColor, cssCode, enabledShadows, isEn, shadows.length]);

  const downloadCss = useCallback(() => {
    downloadBlob(
      new Blob([cssCode], { type: "text/css;charset=utf-8" }),
      "box-shadow.css",
    );
  }, [cssCode]);

  const downloadReport = useCallback(() => {
    downloadBlob(
      new Blob([shadowReport], { type: "text/plain;charset=utf-8" }),
      "box-shadow-report.txt",
    );
  }, [shadowReport]);

  const sliders: {
    key: keyof Shadow;
    label: [string, string];
    min: number;
    max: number;
  }[] = [
    {
      key: "offsetX",
      label: ["Offset X", "Смещение X"],
      min: -50,
      max: 50,
    },
    {
      key: "offsetY",
      label: ["Offset Y", "Смещение Y"],
      min: -50,
      max: 50,
    },
    { key: "blur", label: ["Blur", "Размытие"], min: 0, max: 100 },
    {
      key: "spread",
      label: ["Spread", "Распространение"],
      min: -50,
      max: 50,
    },
  ];

  const alphaPct = (color: string) => {
    if (/^#([0-9a-fA-F]{8})$/.test(color)) {
      return Math.round((parseInt(color.substring(7), 16) / 255) * 100);
    }
    if (/^#([0-9a-fA-F]{6})$/.test(color)) return 100;
    return 100;
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="p-4 sm:p-6">
        <div
          className="flex min-h-52 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 transition-colors sm:min-h-64"
          style={{ background: bgColor }}
        >
          <div
            className="h-32 w-32 rounded-[var(--radius-lg)] bg-[var(--color-primary)] transition-shadow sm:h-40 sm:w-40"
            style={{ boxShadow: fullCSS }}
            aria-label={isEn ? "Box shadow preview" : "Предпросмотр тени"}
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {sliders.slice(0, 3).map(({ key, label, min, max }) => (
            <MobileSlider
              key={key}
              label={isEn ? label[0] : label[1]}
              value={activeShadow[key] as number}
              min={min}
              max={max}
              unit="px"
              onChange={(value) => updateShadow(key, value)}
            />
          ))}
        </div>

        <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <Label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            CSS
          </Label>
          <code className="block break-all font-mono text-sm leading-relaxed">
            {cssCode}
          </code>
        </div>

        <Button
          size="lg"
          onClick={copyCss}
          className="tool-primary-action mt-4 w-full gap-2 sm:w-auto sm:min-w-52"
        >
          {copied ? (
            <Check size={18} weight="bold" />
          ) : (
            <ClipboardText size={18} />
          )}
          {copied
            ? isEn
              ? "CSS copied"
              : "CSS скопирован"
            : isEn
              ? "Copy CSS"
              : "Скопировать CSS"}
        </Button>

        <AdvancedSettings
          title={isEn ? "Shadow details" : "Дополнительные параметры"}
          description={
            isEn
              ? "Spread, color, layers, presets and import"
              : "Spread, цвет, слои, presets и импорт"
          }
          className="mt-5"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Label className="font-semibold">
                  {isEn ? "Selected layer" : "Выбранный слой"} {activeIndex + 1}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateShadow("inset", !activeShadow.inset)}
                  className="min-h-11"
                >
                  {activeShadow.inset ? (
                    <ArrowSquareIn size={18} />
                  ) : (
                    <ArrowSquareOut size={18} />
                  )}
                  {activeShadow.inset ? "Inset" : "Outset"}
                </Button>
              </div>

              <MobileSlider
                label={isEn ? sliders[3].label[0] : sliders[3].label[1]}
                value={activeShadow.spread}
                min={sliders[3].min}
                max={sliders[3].max}
                unit="px"
                onChange={(value) => updateShadow("spread", value)}
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_150px]">
                <label className="text-sm font-semibold">
                  <span className="mb-1.5 block text-[var(--color-text-muted)]">
                    {isEn ? "Shadow color" : "Цвет тени"}
                  </span>
                  <div className="flex gap-2">
                    <ColorPickerInput
                      value={
                        activeShadow.color.startsWith("#")
                          ? activeShadow.color.slice(0, 7)
                          : "#000000"
                      }
                      onChange={(color) => {
                        const alpha = /^#[\da-f]{8}$/i.test(activeShadow.color)
                          ? activeShadow.color.slice(7)
                          : "40";
                        updateShadow("color", color + alpha);
                      }}
                      label={isEn ? "Shadow color" : "Цвет тени"}
                    />
                    <Input
                      value={activeShadow.color}
                      onChange={(event) =>
                        updateShadow("color", event.target.value)
                      }
                      className="h-11 min-w-0 font-mono"
                    />
                  </div>
                </label>
                <MobileSlider
                  label={isEn ? "Opacity" : "Прозрачность"}
                  value={alphaPct(activeShadow.color)}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(value) => {
                    if (!/^#[\da-f]{6,8}$/i.test(activeShadow.color)) return;
                    const alpha = Math.round((value / 100) * 255)
                      .toString(16)
                      .padStart(2, "0");
                    updateShadow(
                      "color",
                      activeShadow.color.slice(0, 7) + alpha,
                    );
                  }}
                />
              </div>

              <label className="mt-4 block text-sm font-semibold">
                <span className="mb-1.5 block text-[var(--color-text-muted)]">
                  {isEn ? "Preview background" : "Фон предпросмотра"}
                </span>
                <div className="flex gap-2">
                  <ColorPickerInput
                    value={bgColor}
                    onChange={setBgColor}
                    label={isEn ? "Preview background" : "Фон предпросмотра"}
                  />
                  <Input
                    value={bgColor}
                    onChange={(event) => setBgColor(event.target.value)}
                    className="h-11 min-w-0 font-mono"
                  />
                </div>
              </label>
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <Label className="font-semibold">
                  {isEn ? "Layers" : "Слои"}
                </Label>
                <Button
                  variant="outline"
                  onClick={addShadow}
                  className="min-h-11"
                >
                  <Plus size={17} />
                  {isEn ? "Add layer" : "Добавить слой"}
                </Button>
              </div>
              <ul className="space-y-2">
                {shadows.map((shadow, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={index}
                      className={
                        isActive
                          ? "flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-primary-soft)] p-1"
                          : "flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-1"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className="min-h-11 min-w-0 flex-1 rounded px-2 text-left font-mono text-xs"
                        aria-pressed={isActive}
                      >
                        {index + 1}. {shadow.inset ? "inset " : ""}
                        {shadow.offsetX}px {shadow.offsetY}px {shadow.blur}px
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateShadowAt(index, "enabled", !shadow.enabled)
                        }
                        aria-label={
                          shadow.enabled
                            ? isEn
                              ? "Hide layer"
                              : "Скрыть слой"
                            : isEn
                              ? "Show layer"
                              : "Показать слой"
                        }
                      >
                        {shadow.enabled ? (
                          <Eye size={16} />
                        ) : (
                          <EyeSlash size={16} />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveShadow(index, -1)}
                        disabled={index === 0}
                        aria-label={
                          isEn ? "Move layer up" : "Переместить слой вверх"
                        }
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveShadow(index, 1)}
                        disabled={index === shadows.length - 1}
                        aria-label={
                          isEn ? "Move layer down" : "Переместить слой вниз"
                        }
                      >
                        <ArrowDown size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeShadow(index)}
                        disabled={shadows.length === 1}
                        className="text-[var(--color-danger)]"
                        aria-label={isEn ? "Remove layer" : "Удалить слой"}
                      >
                        <Trash size={16} />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          <div className="mt-5">
            <Label className="mb-2 block text-sm font-semibold">
              {isEn ? "Presets" : "Готовые варианты"}
            </Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {SHADOW_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="outline"
                  onClick={() => applyPreset(preset)}
                  className="min-h-11 justify-start"
                >
                  {isEn ? preset.labelEn : preset.labelRu}
                </Button>
              ))}
            </div>
          </div>

          <Card className="mt-5 p-4">
            <Label className="mb-2 block text-sm font-semibold">
              {isEn ? "Import box-shadow" : "Импорт box-shadow"}
            </Label>
            <Textarea
              value={importText}
              onChange={(event) => {
                setImportText(event.target.value);
                setImportError(null);
              }}
              placeholder={
                isEn
                  ? "Paste a box-shadow declaration"
                  : "Вставьте декларацию box-shadow"
              }
              className="min-h-24 font-mono text-sm"
              spellCheck={false}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleImport}
                disabled={!importText.trim()}
                className="min-h-11"
              >
                {isEn ? "Import" : "Импортировать"}
              </Button>
              {importError ? (
                <span
                  role="alert"
                  className="inline-flex items-center gap-1 text-sm text-[var(--color-danger)]"
                >
                  <Warning size={16} />
                  {importError}
                </span>
              ) : null}
            </div>
          </Card>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={downloadCss}
              className="min-h-11"
            >
              <DownloadSimple size={16} />
              {isEn ? "Download CSS" : "Скачать CSS"}
            </Button>
            <Button
              variant="outline"
              onClick={downloadReport}
              className="min-h-11"
            >
              <DownloadSimple size={16} />
              {isEn ? "Download details" : "Скачать параметры"}
            </Button>
          </div>
        </AdvancedSettings>
      </Card>
    </div>
  );
}
