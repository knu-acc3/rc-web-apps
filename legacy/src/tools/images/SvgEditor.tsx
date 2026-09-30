"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
  Download,
  Plus,
  Code,
  WarningCircle,
  Sparkle,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import SmartCopy from "@/src/components/SmartCopy";
import ColorPickerInput from "@/src/components/ColorPickerInput";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { sanitizeSvg } from "@/src/utils/htmlSanitization";
import { downloadBlob } from "@/src/utils/exportHelpers";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";

const DEFAULT_SVG_RU = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect x="10" y="10" width="180" height="180" rx="20" fill="#4A90D9" stroke="#2C5F8A" stroke-width="3"/>
  <circle cx="100" cy="85" r="35" fill="#FFD93D"/>
  <text x="100" y="160" text-anchor="middle" font-size="18" fill="white" font-family="sans-serif">Привет SVG!</text>
</svg>`;

const DEFAULT_SVG_EN = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect x="10" y="10" width="180" height="180" rx="20" fill="#4A90D9" stroke="#2C5F8A" stroke-width="3"/>
  <circle cx="100" cy="85" r="35" fill="#FFD93D"/>
  <text x="100" y="160" text-anchor="middle" font-size="18" fill="white" font-family="sans-serif">Hello SVG!</text>
</svg>`;

const SAMPLES = [
  {
    label: "Иконка",
    labelEn: "Icon",
    code: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#1565C0"/>
  <path d="M14 26l6 6 14-16" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
  },
  {
    label: "Логотип",
    labelEn: "Logo",
    code: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1565C0"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
  </defs>
  <rect width="200" height="80" rx="12" fill="url(#g)"/>
  <text x="100" y="50" text-anchor="middle" font-size="28" fill="white" font-family="system-ui, sans-serif" font-weight="700">ULTI</text>
</svg>`,
  },
  {
    label: "Анимация",
    labelEn: "Animated",
    code: `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <circle cx="80" cy="80" r="60" fill="none" stroke="#1565C0" stroke-width="6" stroke-dasharray="40 20">
    <animateTransform attributeName="transform" type="rotate" from="0 80 80" to="360 80 80" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="80" cy="80" r="20" fill="#FFD93D">
    <animate attributeName="r" values="15;25;15" dur="1.5s" repeatCount="indefinite"/>
  </circle>
</svg>`,
  },
  {
    label: "Волна",
    labelEn: "Wave",
    code: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120">
  <path d="M0 60 Q 40 20 80 60 T 160 60 T 240 60 T 320 60 L 320 120 L 0 120 Z" fill="#0EA5E9"/>
  <path d="M0 70 Q 40 30 80 70 T 160 70 T 240 70 T 320 70 L 320 120 L 0 120 Z" fill="#0284C7" opacity="0.7"/>
</svg>`,
  },
];

function optimizeSvg(code: string): string {
  return code
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\?xml[^?]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\/>/g, "/>")
    .trim();
}

function downloadAsPng(svgCode: string, scale = 2): void {
  const blob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth || 256;
    const h = img.naturalHeight || 256;
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "image.png";
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

const SVG_TEMPLATES: { label: string; labelEn: string; code: string }[] = [
  {
    label: "Прямоугольник",
    labelEn: "Rectangle",
    code: '  <rect x="50" y="50" width="100" height="60" rx="5" fill="#4CAF50" stroke="#388E3C" stroke-width="2"/>',
  },
  {
    label: "Круг",
    labelEn: "Circle",
    code: '  <circle cx="100" cy="100" r="40" fill="#2196F3" stroke="#1565C0" stroke-width="2"/>',
  },
  {
    label: "Линия",
    labelEn: "Line",
    code: '  <line x1="20" y1="20" x2="180" y2="180" stroke="#F44336" stroke-width="3" stroke-linecap="round"/>',
  },
  {
    label: "Текст",
    labelEn: "Text",
    code: '  <text x="100" y="100" text-anchor="middle" font-size="16" fill="#333" font-family="sans-serif">Text</text>',
  },
  {
    label: "Путь",
    labelEn: "Path",
    code: '  <path d="M50 150 Q100 50 150 150" fill="none" stroke="#9C27B0" stroke-width="3"/>',
  },
];

export default function SvgEditor() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [svgCode, setSvgCode] = useState(
    isEn ? DEFAULT_SVG_EN : DEFAULT_SVG_RU,
  );
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [fillColor, setFillColor] = useState("#4A90D9");
  const [strokeColor, setStrokeColor] = useState("#2C5F8A");
  const [svgWidth, setSvgWidth] = useState("200");
  const [svgHeight, setSvgHeight] = useState("200");
  const [viewBox, setViewBox] = useState("0 0 200 200");
  const safeSvgCode = useMemo(() => sanitizeSvg(svgCode), [svgCode]);

  const validateSvg = useCallback(
    (code: string): boolean => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(code, "image/svg+xml");
        const parseError = doc.querySelector("parsererror");
        if (parseError) {
          setError(
            parseError.textContent?.slice(0, 200) ||
              (isEn ? "SVG parsing error" : "Ошибка парсинга SVG"),
          );
          return false;
        }
        setError("");
        return true;
      } catch {
        setError(
          isEn ? "Unable to parse SVG code" : "Невозможно разобрать SVG код",
        );
        return false;
      }
    },
    [isEn],
  );

  const syncFromCode = useCallback((code: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (!svgEl) return;
      const w = svgEl.getAttribute("width");
      const h = svgEl.getAttribute("height");
      const vb = svgEl.getAttribute("viewBox");
      if (w) setSvgWidth(w);
      if (h) setSvgHeight(h);
      if (vb) setViewBox(vb);
      const firstShape = svgEl.querySelector(
        "rect, circle, ellipse, path, polygon, polyline, line",
      );
      if (firstShape) {
        const f = firstShape.getAttribute("fill");
        const s = firstShape.getAttribute("stroke");
        if (f && f !== "none" && f !== "transparent") setFillColor(f);
        if (s && s !== "none" && s !== "transparent") setStrokeColor(s);
      }
    } catch {
      /* ignore parse errors */
    }
  }, []);

  const handleCodeChange = useCallback(
    (value: string) => {
      setSvgCode(value);
      validateSvg(value);
      syncFromCode(value);
    },
    [validateSvg, syncFromCode],
  );

  const applyDimensions = useCallback(
    (width: string, height: string, vb: string) => {
      let code = svgCode;
      code = code.replace(/(<svg[^>]*)\bwidth="[^"]*"/, `$1width="${width}"`);
      code = code.replace(
        /(<svg[^>]*)\bheight="[^"]*"/,
        `$1height="${height}"`,
      );
      code = code.replace(/(<svg[^>]*)\bviewBox="[^"]*"/, `$1viewBox="${vb}"`);
      setSvgCode(code);
      validateSvg(code);
    },
    [svgCode, validateSvg],
  );

  const applyFillColor = useCallback(
    (color: string) => {
      setFillColor(color);
      let code = svgCode;
      const match = code.match(
        /(<(?:rect|circle|ellipse|polygon|polyline|path)\b[^>]*)\bfill="[^"]*"/,
      );
      if (match) {
        code = code.replace(match[0], `${match[1]}fill="${color}"`);
        setSvgCode(code);
        validateSvg(code);
      }
    },
    [svgCode, validateSvg],
  );

  const applyStrokeColor = useCallback(
    (color: string) => {
      setStrokeColor(color);
      let code = svgCode;
      const match = code.match(
        /(<(?:rect|circle|ellipse|polygon|polyline|path|line)\b[^>]*)\bstroke="[^"]*"/,
      );
      if (match) {
        code = code.replace(match[0], `${match[1]}stroke="${color}"`);
        setSvgCode(code);
        validateSvg(code);
      }
    },
    [svgCode, validateSvg],
  );

  const insertTemplate = useCallback(
    (templateCode: string) => {
      const textarea = textareaRef.current;
      if (!textarea || !showCode) {
        const closingIndex = svgCode.lastIndexOf("</svg>");
        if (closingIndex !== -1) {
          const newCode =
            svgCode.slice(0, closingIndex) +
            templateCode +
            "\n" +
            svgCode.slice(closingIndex);
          handleCodeChange(newCode);
        } else {
          handleCodeChange(svgCode + "\n" + templateCode);
        }
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== undefined && start === end && start > 0) {
        const newCode =
          svgCode.slice(0, start) + "\n" + templateCode + svgCode.slice(end);
        handleCodeChange(newCode);
      } else {
        const closingIndex = svgCode.lastIndexOf("</svg>");
        if (closingIndex !== -1) {
          const newCode =
            svgCode.slice(0, closingIndex) +
            templateCode +
            "\n" +
            svgCode.slice(closingIndex);
          handleCodeChange(newCode);
        }
      }
    },
    [svgCode, handleCodeChange, showCode],
  );

  const downloadSvg = useCallback(() => {
    const blob = new Blob([safeSvgCode], {
      type: "image/svg+xml;charset=utf-8",
    });
    downloadBlob(blob, "image.svg");
  }, [safeSvgCode]);

  const handleOptimize = useCallback(() => {
    const optimized = optimizeSvg(svgCode);
    setSvgCode(optimized);
    validateSvg(optimized);
  }, [svgCode, validateSvg]);

  const optimizedPreview = useMemo(
    () => optimizeSvg(safeSvgCode),
    [safeSvgCode],
  );
  const sizeReduction = useMemo(() => {
    const orig = new Blob([svgCode]).size;
    const opt = new Blob([optimizedPreview]).size;
    if (orig === 0) return 0;
    return Math.round(((orig - opt) / orig) * 100);
  }, [svgCode, optimizedPreview]);

  const getSvgInfo = useCallback(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgCode, "image/svg+xml");
      const svgEl = doc.querySelector("svg");
      if (!svgEl) return null;
      return {
        width: svgEl.getAttribute("width") || "auto",
        height: svgEl.getAttribute("height") || "auto",
        viewBox: svgEl.getAttribute("viewBox") || (isEn ? "none" : "нет"),
        elements: svgEl.children.length,
      };
    } catch {
      return null;
    }
  }, [svgCode, isEn]);

  const svgInfo = getSvgInfo();

  return (
    <div className="mx-auto max-w-3xl">
      <div
        className={cn("grid grid-cols-1 gap-3", showCode && "md:grid-cols-2")}
      >
        <Card className="order-2 h-full p-4 sm:p-6 md:order-1">
          <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
            <span className="text-sm font-semibold">
              {isEn ? "Preview" : "Предпросмотр"}
            </span>
            <div className="flex shrink-0 flex-nowrap gap-2">
              <Button
                size="sm"
                variant={showCode ? "primary" : "outline"}
                onClick={() => setShowCode(!showCode)}
              >
                <Code size={14} />
                {isEn ? "Code" : "Код"}
              </Button>
              <Button
                size="sm"
                onClick={downloadSvg}
                className="tool-primary-action"
              >
                <Download size={14} />
                {isEn ? "Download SVG" : "Скачать SVG"}
              </Button>
            </div>
          </div>
          <div
            className="tool-short-landscape-stage flex min-h-[400px] items-center justify-center overflow-hidden rounded-[var(--radius-md)] p-3"
            style={{
              backgroundColor:
                "color-mix(in oklab, var(--color-bg) 50%, transparent)",
              backgroundImage: `linear-gradient(45deg, color-mix(in oklab, var(--color-text) 5%, transparent) 25%, transparent 25%),
                linear-gradient(-45deg, color-mix(in oklab, var(--color-text) 5%, transparent) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, color-mix(in oklab, var(--color-text) 5%, transparent) 75%),
                linear-gradient(-45deg, transparent 75%, color-mix(in oklab, var(--color-text) 5%, transparent) 75%)`,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            }}
          >
            {!error && svgCode.trim() && (
              <div
                className="max-h-[400px] max-w-full [&_svg]:max-h-[400px] [&_svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgCode) }}
              />
            )}
            {error && (
              <span className="text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? "Fix errors in SVG code"
                  : "Исправьте ошибки в SVG коде"}
              </span>
            )}
          </div>
        </Card>

        {showCode && (
          <Card className="order-1 h-full p-4 sm:p-6 md:order-2">
            <div className="mb-2 flex min-h-11 items-center justify-between gap-2 text-sm font-semibold">
              SVG {isEn ? "Code" : "Код"}
            </div>
            <Textarea
              ref={textareaRef}
              rows={20}
              value={svgCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="tool-short-landscape-editor min-h-[400px] font-mono text-xs"
            />
            {error && (
              <div className="mt-2 flex items-center gap-2">
                <WarningCircle
                  size={16}
                  className="text-[var(--color-danger)]"
                />
                <span className="text-xs text-[var(--color-danger)]">
                  {error}
                </span>
              </div>
            )}
          </Card>
        )}
      </div>

      <AdvancedSettings
        title={
          isEn
            ? "Drawing and export settings"
            : "Настройки рисования и экспорта"
        }
        description={
          isEn
            ? "Starting shapes, colors, dimensions, elements and file options"
            : "Заготовки, цвета, размеры, элементы и параметры файла"
        }
        className="mb-3"
      >
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {isEn ? "Starting shapes" : "Заготовки"}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleCodeChange(s.code)}
              className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {isEn ? s.labelEn : s.label}
            </button>
          ))}
        </div>

        <div className="mb-2 text-sm font-semibold">
          {isEn ? "Colors" : "Цвета"}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <ColorPickerInput value={fillColor} onChange={applyFillColor} />
            <span className="text-xs text-[var(--color-text-muted)]">
              {isEn ? "Fill" : "Заливка"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ColorPickerInput value={strokeColor} onChange={applyStrokeColor} />
            <span className="text-xs text-[var(--color-text-muted)]">
              {isEn ? "Stroke" : "Обводка"}
            </span>
          </div>
        </div>

        <div className="mb-2 text-sm font-semibold">
          {isEn ? "Dimensions" : "Размеры"}
        </div>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <Label className="mb-1 block">{isEn ? "Width" : "Ширина"}</Label>
            <Input
              value={svgWidth}
              onChange={(e) => {
                setSvgWidth(e.target.value);
                applyDimensions(e.target.value, svgHeight, viewBox);
              }}
              className="w-24"
            />
          </div>
          <span className="pb-2 text-sm text-[var(--color-text-muted)]">x</span>
          <div>
            <Label className="mb-1 block">{isEn ? "Height" : "Высота"}</Label>
            <Input
              value={svgHeight}
              onChange={(e) => {
                setSvgHeight(e.target.value);
                applyDimensions(svgWidth, e.target.value, viewBox);
              }}
              className="w-24"
            />
          </div>
          <div>
            <Label className="mb-1 block">viewBox</Label>
            <Input
              value={viewBox}
              onChange={(e) => {
                setViewBox(e.target.value);
                applyDimensions(svgWidth, svgHeight, e.target.value);
              }}
              className="w-44"
            />
          </div>
        </div>

        <div className="mb-2 text-sm font-semibold">
          {isEn ? "Insert Element" : "Добавить элемент"}
        </div>
        <div className="flex flex-wrap gap-2">
          {SVG_TEMPLATES.map((t) => (
            <Button
              key={t.label}
              size="sm"
              variant="outline"
              onClick={() => insertTemplate(t.code)}
            >
              <Plus size={14} />
              {isEn ? t.labelEn : t.label}
            </Button>
          ))}
        </div>

        <div className="my-4 border-t border-[var(--color-border-subtle)]" />
        <div className="mb-2 text-sm font-semibold">
          {isEn ? "Export and document info" : "Экспорт и сведения"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOptimize}
            disabled={sizeReduction <= 0}
          >
            <Sparkle size={14} />
            {isEn ? "Optimize" : "Оптимизировать"}
            {sizeReduction > 0 && (
              <span className="text-[10px] opacity-70">−{sizeReduction}%</span>
            )}
          </Button>
          <SmartCopy
            text={safeSvgCode}
            threshold={50000}
            fileName="image.svg"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadAsPng(safeSvgCode, 2)}
          >
            <ImageIcon size={14} />
            PNG 2×
          </Button>
        </div>
        {svgInfo && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">
              {svgInfo.width} × {svgInfo.height}
            </Badge>
            <Badge variant="outline">viewBox: {svgInfo.viewBox}</Badge>
            <Badge variant="outline">
              {svgInfo.elements} {isEn ? "elements" : "элементов"}
            </Badge>
            <Badge variant="outline">
              {new Blob([svgCode]).size} {isEn ? "B" : "Б"}
            </Badge>
          </div>
        )}
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Preview is sanitized: scripts and event handlers are removed. PNG export rasterizes at 2×."
            : "Предпросмотр очищается от скриптов и обработчиков. PNG экспортируется в масштабе 2×."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
