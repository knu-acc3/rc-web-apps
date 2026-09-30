"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Download,
  Image as ImageIcon,
  Code,
  ArrowsClockwise,
  FilePdf,
  FileSvg,
  Copy,
  Check,
  Eye,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import { MobileSlider } from "@/src/components/tool/MobileSlider";
import ColorPickerInput from "@/src/components/ColorPickerInput";
import { copyText } from "@/src/components/CopyButton";
import { useCopyWithToast } from "@/src/hooks/useCopyWithToast";
import { downloadBlob, triggerDownload } from "@/src/utils/exportHelpers";
import { downloadPdfBlob } from "@/src/utils/pdfHelpers";
import { cn } from "@/src/lib/cn";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { sanitizeHtmlForSvgExport } from "@/src/utils/htmlSanitization";

type OutputFormat = "png" | "jpeg" | "webp" | "svg" | "pdf";
type EditorTab = "html" | "css" | "js";

interface SizePreset {
  key: string;
  label: string;
  w: number;
  h: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { key: "og", label: "OG / FB", w: 1200, h: 630 },
  { key: "twitter", label: "Twitter", w: 1200, h: 675 },
  { key: "ig-square", label: "IG square", w: 1080, h: 1080 },
  { key: "ig-story", label: "IG story", w: 1080, h: 1920 },
  { key: "a4-landscape", label: "A4 land", w: 1123, h: 794 },
  { key: "custom", label: "Custom", w: 800, h: 600 },
];

interface Template {
  key: string;
  en: string;
  ru: string;
  htmlEn: string;
  htmlRu: string;
  css: string;
  w: number;
  h: number;
  fg: string;
  bg: string;
}

const TEMPLATES: Template[] = [
  {
    key: "tweet",
    en: "Tweet",
    ru: "Твит",
    htmlEn: `<div class="tweet">
  <div class="header">
    <div class="avatar">A</div>
    <div class="name">
      <div class="display">Aida Nurzhan</div>
      <div class="handle">@aida_kz</div>
    </div>
  </div>
  <div class="content">Just shipped a new feature.<br>200 lines of code, 1000s of happy users.</div>
  <div class="meta">9:24 AM &middot; May 19, 2026</div>
</div>`,
    htmlRu: `<div class="tweet">
  <div class="header">
    <div class="avatar">А</div>
    <div class="name">
      <div class="display">Аида Нуржан</div>
      <div class="handle">@aida_kz</div>
    </div>
  </div>
  <div class="content">Только что выкатили фичу.<br>200 строк кода радуют тысячи пользователей.</div>
  <div class="meta">9:24 &middot; 19 мая 2026</div>
</div>`,
    css: `body { margin: 0; background: #1d9bf0; padding: 40px; box-sizing: border-box; min-height: 100%; }
.tweet {
  background: #fff; color: #0f1419; border-radius: 16px; padding: 28px 32px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 520px; margin: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}
.header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.avatar { width: 48px; height: 48px; border-radius: 50%; background: #1d9bf0; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; }
.display { font-weight: 700; font-size: 16px; }
.handle { color: #536471; font-size: 14px; }
.content { font-size: 22px; line-height: 1.4; margin-bottom: 16px; }
.meta { color: #536471; font-size: 14px; }`,
    w: 600,
    h: 320,
    fg: "#0f1419",
    bg: "#1d9bf0",
  },
  {
    key: "quote",
    en: "Quote card",
    ru: "Цитата",
    htmlEn: `<div class="quote">
  <div class="mark">&ldquo;</div>
  <p>The best way to predict the future is to invent it.</p>
  <div class="author">&mdash; Alan Kay</div>
</div>`,
    htmlRu: `<div class="quote">
  <div class="mark">&ldquo;</div>
  <p>Лучший способ предсказать будущее &mdash; изобрести его.</p>
  <div class="author">&mdash; Алан Кей</div>
</div>`,
    css: `body { margin: 0; min-height: 100%; }
.quote {
  font-family: Georgia, 'Times New Roman', serif;
  background: linear-gradient(135deg, #fefce8 0%, #fcd34d 100%);
  color: #422006;
  padding: 64px 80px;
  min-height: 100%;
  box-sizing: border-box;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
}
.mark { font-size: 140px; line-height: 0.6; color: #ca8a04; margin-bottom: 12px; font-family: Georgia, serif; }
.quote p { font-size: 36px; line-height: 1.4; margin: 0 0 28px; font-style: italic; max-width: 800px; }
.author { font-size: 22px; color: #78350f; font-weight: 600; letter-spacing: 0.5px; }`,
    w: 1200,
    h: 630,
    fg: "#422006",
    bg: "#fcd34d",
  },
  {
    key: "snippet",
    en: "Code snippet",
    ru: "Код",
    htmlEn: `<div class="window">
  <div class="bar">
    <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
    <span class="title">hello.ts</span>
  </div>
  <pre><span class="kw">const</span> <span class="var">greet</span> = (<span class="var">name</span>: <span class="type">string</span>) =&gt; {
  <span class="kw">return</span> <span class="str">\`Hello, \${name}!\`</span>;
};
<span class="fn">greet</span>(<span class="str">"world"</span>);</pre>
</div>`,
    htmlRu: `<div class="window">
  <div class="bar">
    <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
    <span class="title">privet.ts</span>
  </div>
  <pre><span class="kw">const</span> <span class="var">greet</span> = (<span class="var">name</span>: <span class="type">string</span>) =&gt; {
  <span class="kw">return</span> <span class="str">\`Привет, \${name}!\`</span>;
};
<span class="fn">greet</span>(<span class="str">"мир"</span>);</pre>
</div>`,
    css: `body { margin: 0; background: linear-gradient(135deg, #f97316, #db2777); min-height: 100%; padding: 56px; box-sizing: border-box; }
.window { background: #0d1117; border-radius: 14px; box-shadow: 0 24px 48px rgba(0,0,0,0.45);
  font-family: 'JetBrains Mono', 'Fira Code', Menlo, monospace; max-width: 900px; margin: auto; overflow: hidden; }
.bar { background: #161b22; padding: 10px 16px; display: flex; align-items: center; gap: 8px; }
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.dot.r { background: #ff5f56; } .dot.y { background: #ffbd2e; } .dot.g { background: #27c93f; }
.title { color: #8b949e; margin-left: 12px; font-size: 13px; }
pre { color: #c9d1d9; padding: 28px 32px; margin: 0; font-size: 22px; line-height: 1.55; overflow: auto; }
.kw { color: #ff7b72; } .var { color: #d2a8ff; } .type { color: #79c0ff; } .str { color: #a5d6ff; } .fn { color: #d2a8ff; }`,
    w: 1200,
    h: 675,
    fg: "#c9d1d9",
    bg: "#0d1117",
  },
  {
    key: "toast",
    en: "Notification toast",
    ru: "Уведомление",
    htmlEn: `<div class="toast">
  <div class="icon">&#10003;</div>
  <div class="body">
    <div class="title">Payment successful</div>
    <div class="desc">Your invoice INV-2026-042 has been paid.</div>
  </div>
  <div class="close">&times;</div>
</div>`,
    htmlRu: `<div class="toast">
  <div class="icon">&#10003;</div>
  <div class="body">
    <div class="title">Платёж прошёл</div>
    <div class="desc">Счёт INV-2026-042 успешно оплачен.</div>
  </div>
  <div class="close">&times;</div>
</div>`,
    css: `body { margin: 0; min-height: 100%; background: #f5f5f7; display: flex; align-items: center; justify-content: center; padding: 32px; box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.toast { display: flex; align-items: center; gap: 16px; background: #fff; border-radius: 14px;
  padding: 18px 22px; box-shadow: 0 18px 44px rgba(15,23,42,0.18); max-width: 460px; width: 100%;
  border: 1px solid rgba(15,23,42,0.06); }
.icon { width: 44px; height: 44px; border-radius: 50%; background: #16a34a; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; font-weight: bold; }
.body { flex: 1; }
.title { font-size: 16px; font-weight: 700; color: #0f172a; }
.desc { font-size: 14px; color: #475569; margin-top: 3px; }
.close { color: #94a3b8; font-size: 26px; font-weight: 300; line-height: 1; padding: 2px 6px; }`,
    w: 720,
    h: 240,
    fg: "#0f172a",
    bg: "#f5f5f7",
  },
  {
    key: "social-card",
    en: "Social card",
    ru: "OG карточка",
    htmlEn: `<div class="banner">
  <div class="badge">NEW &middot; 2026</div>
  <h1>Ultimate Tools</h1>
  <p>300+ free tools that run entirely in your browser.</p>
  <div class="tag">ulti-tools.com</div>
</div>`,
    htmlRu: `<div class="banner">
  <div class="badge">НОВОЕ &middot; 2026</div>
  <h1>Ultimate Tools</h1>
  <p>300+ бесплатных инструментов прямо в браузере.</p>
  <div class="tag">ulti-tools.com</div>
</div>`,
    css: `body { margin: 0; background: radial-gradient(ellipse at top left, #1e3a8a, #0f172a 70%); color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100%;
  display: flex; align-items: center; justify-content: center; padding: 64px; box-sizing: border-box; }
.banner { text-align: center; max-width: 900px; }
.badge { display: inline-block; background: #f59e0b; color: #0f172a; padding: 6px 16px; border-radius: 24px;
  font-size: 14px; font-weight: 700; letter-spacing: 1px; margin-bottom: 24px; }
h1 { font-size: 96px; margin: 0 0 16px; font-weight: 800; letter-spacing: -2px; }
p { font-size: 28px; margin: 0 0 32px; opacity: 0.85; }
.tag { display: inline-block; background: rgba(255,255,255,0.1); padding: 12px 28px; border-radius: 10px;
  font-family: monospace; font-size: 18px; }`,
    w: 1200,
    h: 630,
    fg: "#ffffff",
    bg: "#0f172a",
  },
];

const DEFAULT_TEMPLATE = TEMPLATES[1]; // Quote

const HTML_ENTITY_TO_XML_SAFE: Record<string, string> = {
  nbsp: "&#160;",
  ndash: "&#8211;",
  mdash: "&#8212;",
  lsquo: "&#8216;",
  rsquo: "&#8217;",
  sbquo: "&#8218;",
  ldquo: "&#8220;",
  rdquo: "&#8221;",
  bdquo: "&#8222;",
  hellip: "&#8230;",
  middot: "&#183;",
  bull: "&#8226;",
  times: "&#215;",
  copy: "&#169;",
  reg: "&#174;",
  trade: "&#8482;",
  euro: "&#8364;",
  rarr: "&#8594;",
  larr: "&#8592;",
};

function normalizeHtmlForSvg(html: string): string {
  return sanitizeHtmlForSvgExport(html)
    .replace(/\x00/g, "")
    .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (entity, name: string) => {
      if (["amp", "lt", "gt", "quot", "apos"].includes(name)) return entity;
      return HTML_ENTITY_TO_XML_SAFE[name] ?? `&amp;${name};`;
    })
    .replace(/&(?!#\d+;|#x[\da-fA-F]+;|amp;|lt;|gt;|quot;|apos;)/g, "&amp;")
    .replace(
      /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^<>]*?)?>/gi,
      (match, tag: string, attrs = "") =>
        match.endsWith("/>") ? match : `<${tag}${attrs} />`,
    );
}

function sanitizeCssForSvg(css: string): string {
  return css
    .replace(/@import\s+[^;]+;?/gi, "")
    .replace(/url\(\s*(['"]?)\s*javascript:[^)]*\)/gi, "none")
    .replace(/expression\s*\(/gi, "blocked(")
    .replace(/-moz-binding\s*:[^;]+;?/gi, "")
    .replace(/]]>/g, "]] ]>");
}

// Build SVG markup string with foreignObject
function buildSvgString(
  html: string,
  css: string,
  _js: string,
  width: number,
  height: number,
  bgColor: string,
  transparentBg: boolean,
): string {
  const safeHtml = normalizeHtmlForSvg(html);
  const safeCss = sanitizeCssForSvg(css);

  const bgStyle = transparentBg ? "" : `background:${bgColor};`;
  const wrapStyle = `width:${width}px;height:${height}px;box-sizing:border-box;${bgStyle}`;

  // foreignObject needs xhtml-namespaced root inside
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="${wrapStyle}">
      <style><![CDATA[
html,body{margin:0;padding:0;width:100%;height:100%;}
${safeCss}
      ]]></style>
      ${safeHtml}
    </div>
  </foreignObject>
</svg>`;
}

// Encode SVG string as data URL (UTF-8 safe)
function svgToDataUrl(svg: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

// Iframe document for live preview (sandboxed)
function buildIframeDoc(html: string, css: string, js: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
${css}
</style></head><body>${html}<script>try{${js}}catch(e){}<\/script></body></html>`;
}

function LineNumbers({ text }: { text: string }) {
  const lines = text.split("\n").length;
  return (
    <div
      aria-hidden
      className="select-none border-r border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-2 py-2.5 text-right font-mono text-[11px] leading-relaxed text-[var(--color-text-subtle)] tabular-nums"
      style={{ minWidth: 36 }}
    >
      {Array.from({ length: lines }, (_, index) => (
        <div key={index}>{index + 1}</div>
      ))}
    </div>
  );
}

export default function HtmlToImage() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [html, setHtml] = useState(() =>
    isEn ? DEFAULT_TEMPLATE.htmlEn : DEFAULT_TEMPLATE.htmlRu,
  );
  const [css, setCss] = useState(DEFAULT_TEMPLATE.css);
  const [js, setJs] = useState("");
  const [editorTab, setEditorTab] = useState<EditorTab>("html");

  const [width, setWidth] = useState(DEFAULT_TEMPLATE.w);
  const [height, setHeight] = useState(DEFAULT_TEMPLATE.h);
  const [heightAuto, setHeightAuto] = useState(false);
  const [scale, setScale] = useState<1 | 2 | 3>(2);

  const [transparentBg, setTransparentBg] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");

  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [outputName, setOutputName] = useState("html-to-image");

  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [iframeContent, setIframeContent] = useState(() =>
    buildIframeDoc(DEFAULT_TEMPLATE.htmlRu, DEFAULT_TEMPLATE.css, ""),
  );

  const [copiedDataUrl, setCopiedDataUrl] = useState(false);
  const { copy: copySvgWithToast, copied: copiedSvg } = useCopyWithToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const cssRef = useRef<HTMLTextAreaElement>(null);
  const jsRef = useRef<HTMLTextAreaElement>(null);

  // Debounced iframe content for live preview (400ms)
  useEffect(() => {
    if (iframeDebounceRef.current) clearTimeout(iframeDebounceRef.current);
    iframeDebounceRef.current = setTimeout(() => {
      setIframeContent(buildIframeDoc(html, css, js));
    }, 400);
    return () => {
      if (iframeDebounceRef.current) clearTimeout(iframeDebounceRef.current);
    };
  }, [html, css, js]);

  const currentSizePresetKey = useMemo(() => {
    const match = SIZE_PRESETS.find(
      (p) => p.w === width && p.h === height && p.key !== "custom",
    );
    return match?.key ?? "custom";
  }, [width, height]);

  // Tab-indent + line numbers helper
  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      // dispatch via React-controlled state through dataset of which editor
      const target = ta.dataset.editor;
      if (target === "html") setHtml(newValue);
      else if (target === "css") setCss(newValue);
      else if (target === "js") setJs(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  // Render to canvas via SVG foreignObject
  const renderToCanvas = useCallback(
    (
      effectiveWidth: number,
      effectiveHeight: number,
      effectiveScale: number,
    ): Promise<HTMLCanvasElement> => {
      return new Promise((resolve, reject) => {
        const svg = buildSvgString(
          html,
          css,
          js,
          effectiveWidth,
          effectiveHeight,
          bgColor,
          transparentBg,
        );
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = canvasRef.current ?? document.createElement("canvas");
          canvas.width = effectiveWidth * effectiveScale;
          canvas.height = effectiveHeight * effectiveScale;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas 2D context unavailable"));
            return;
          }
          if (!transparentBg) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas);
        };
        img.onerror = () => reject(new Error("SVG render failed"));
        img.src = svgToDataUrl(svg);
      });
    },
    [html, css, js, bgColor, transparentBg],
  );

  const handleRender = useCallback(async () => {
    setError("");
    setConverting(true);
    setPreviewUrl("");
    try {
      // For SVG we don't need raster
      if (format === "svg") {
        const svg = buildSvgString(
          html,
          css,
          js,
          width,
          height,
          bgColor,
          transparentBg,
        );
        const url = svgToDataUrl(svg);
        setPreviewUrl(url);
        setConverting(false);
        return;
      }
      const effectiveScale = format === "pdf" ? 2 : scale;
      const canvas = await renderToCanvas(width, height, effectiveScale);

      let mime: string;
      let q: number | undefined;
      if (format === "jpeg") {
        mime = "image/jpeg";
        q = quality;
      } else if (format === "webp") {
        mime = "image/webp";
        q = quality;
      } else {
        mime = "image/png";
        q = undefined;
      }
      const dataUrl =
        format === "pdf"
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL(mime, q);
      setPreviewUrl(dataUrl);
    } catch {
      setError(
        isEn
          ? "Failed to render. External fonts and some CSS properties may not work in SVG foreignObject. Try the iframe preview."
          : "Не удалось отрендерить. Часть CSS (внешние шрифты, CSS custom properties) может не работать в SVG foreignObject.",
      );
    } finally {
      setConverting(false);
    }
  }, [
    format,
    html,
    css,
    js,
    width,
    height,
    scale,
    quality,
    bgColor,
    transparentBg,
    renderToCanvas,
    isEn,
  ]);

  const handleDownload = useCallback(async () => {
    if (!previewUrl && format !== "pdf") return;
    const name = outputName.trim() || "html-to-image";
    try {
      if (format === "svg") {
        const svg = buildSvgString(
          html,
          css,
          js,
          width,
          height,
          bgColor,
          transparentBg,
        );
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        downloadBlob(blob, `${name}.svg`);
        return;
      }
      if (format === "pdf") {
        const { PDFDocument } = await import("pdf-lib");
        const canvas = await renderToCanvas(width, height, 2);
        const pngDataUrl = canvas.toDataURL("image/png");
        const pngBytes = Uint8Array.from(atob(pngDataUrl.split(",")[1]), (c) =>
          c.charCodeAt(0),
        );
        const pdf = await PDFDocument.create();
        const png = await pdf.embedPng(pngBytes);
        const page = pdf.addPage([width, height]);
        page.drawImage(png, { x: 0, y: 0, width, height });
        pdf.setCreator("ulti-tools.com");
        pdf.setProducer("ulti-tools.com / pdf-lib");
        const bytes = await pdf.save();
        downloadPdfBlob(bytes, `${name}.pdf`);
        return;
      }
      const ext = format === "jpeg" ? "jpg" : format;
      triggerDownload(previewUrl, `${name}.${ext}`);
    } catch {
      setError(isEn ? "Download failed." : "Скачивание не удалось.");
    }
  }, [
    previewUrl,
    format,
    outputName,
    html,
    css,
    js,
    width,
    height,
    bgColor,
    transparentBg,
    renderToCanvas,
    isEn,
  ]);

  const handleCopyDataUrl = useCallback(async () => {
    if (!previewUrl) return;
    const ok = await copyText(previewUrl);
    if (ok) {
      setCopiedDataUrl(true);
      setTimeout(() => setCopiedDataUrl(false), 1500);
    }
  }, [previewUrl]);

  const handleCopySvg = useCallback(() => {
    const svg = buildSvgString(
      html,
      css,
      js,
      width,
      height,
      bgColor,
      transparentBg,
    );
    void copySvgWithToast(svg, {
      successMessage: isEn ? "SVG markup copied" : "SVG разметка скопирована",
    });
  }, [
    html,
    css,
    js,
    width,
    height,
    bgColor,
    transparentBg,
    copySvgWithToast,
    isEn,
  ]);

  const loadTemplate = useCallback(
    (t: Template) => {
      setHtml(isEn ? t.htmlEn : t.htmlRu);
      setCss(t.css);
      setJs("");
      setWidth(t.w);
      setHeight(t.h);
      setBgColor(t.bg);
      setTransparentBg(false);
      setPreviewUrl("");
    },
    [isEn],
  );

  const applySize = useCallback((preset: SizePreset) => {
    setWidth(preset.w);
    setHeight(preset.h);
    setPreviewUrl("");
  }, []);

  const FORMAT_TABS: { value: OutputFormat; label: string }[] = [
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPEG" },
    { value: "webp", label: "WebP" },
    { value: "svg", label: "SVG" },
    { value: "pdf", label: "PDF" },
  ];

  const SCALE_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
    { value: 1, label: "1x" },
    { value: 2, label: "2x" },
    { value: 3, label: "3x" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Code editor */}
      <Card className="mb-3 p-3 sm:p-4">
        <Tabs
          value={editorTab}
          onValueChange={(v) => setEditorTab(v as EditorTab)}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Code size={16} className="text-[var(--color-primary)]" />
              {isEn ? "HTML + CSS + JS Editor" : "Редактор HTML + CSS + JS"}
            </div>
            <TabsList className="h-auto min-h-11">
              <TabsTrigger
                value="html"
                style={{ minWidth: 44 }}
                className="min-h-11 px-3 text-xs"
              >
                HTML
              </TabsTrigger>
              <TabsTrigger
                value="css"
                style={{ minWidth: 44 }}
                className="min-h-11 px-3 text-xs"
              >
                CSS
              </TabsTrigger>
              <TabsTrigger
                value="js"
                style={{ minWidth: 44 }}
                className="min-h-11 px-3 text-xs"
              >
                JS
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="html" className="mt-2">
            <div className="tool-short-landscape-editor flex h-72 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] font-mono">
              <LineNumbers text={html} />
              <textarea
                ref={htmlRef}
                data-editor="html"
                name="html-source"
                aria-label={isEn ? "HTML source" : "HTML-код"}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                onKeyDown={handleTabKey}
                spellCheck={false}
                placeholder="<div>...</div>"
                className="flex-1 resize-none border-0 bg-transparent p-2.5 font-mono text-[12.5px] leading-relaxed text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)]"
                style={{
                  fontFamily:
                    "'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, Menlo, monospace",
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="css" className="mt-2">
            <div className="tool-short-landscape-editor flex h-72 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] font-mono">
              <LineNumbers text={css} />
              <textarea
                ref={cssRef}
                data-editor="css"
                name="css-source"
                aria-label={isEn ? "CSS source" : "CSS-код"}
                value={css}
                onChange={(e) => setCss(e.target.value)}
                onKeyDown={handleTabKey}
                spellCheck={false}
                placeholder=".card { ... }"
                className="flex-1 resize-none border-0 bg-transparent p-2.5 font-mono text-[12.5px] leading-relaxed text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)]"
                style={{
                  fontFamily:
                    "'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, Menlo, monospace",
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="js" className="mt-2">
            <div className="tool-short-landscape-editor flex h-72 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] font-mono">
              <LineNumbers text={js} />
              <textarea
                ref={jsRef}
                data-editor="js"
                name="javascript-source"
                aria-label={isEn ? "JavaScript source" : "JavaScript-код"}
                value={js}
                onChange={(e) => setJs(e.target.value)}
                onKeyDown={handleTabKey}
                spellCheck={false}
                placeholder={
                  isEn
                    ? "// optional JS (runs in iframe preview, not in SVG export)"
                    : "// JS опционально (работает в iframe-предпросмотре, не в SVG-экспорте)"
                }
                className="flex-1 resize-none border-0 bg-transparent p-2.5 font-mono text-[12.5px] leading-relaxed text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)]"
                style={{
                  fontFamily:
                    "'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, Menlo, monospace",
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
              {isEn
                ? "JS executes in the sandboxed iframe preview only. SVG foreignObject does not run scripts during export."
                : "JS выполняется только в sandbox-iframe. SVG foreignObject не запускает скрипты при экспорте."}
            </p>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="mb-3 grid gap-2 sm:flex sm:flex-wrap">
        {previewUrl || format === "pdf" ? (
          <>
            <Button
              data-primary-action="html-image"
              data-primary-state="download"
              onClick={handleDownload}
              className="order-1 gap-1.5"
            >
              {format === "pdf" ? (
                <FilePdf size={16} />
              ) : format === "svg" ? (
                <FileSvg size={16} />
              ) : (
                <Download size={16} />
              )}
              {isEn ? "Download" : "Скачать"}
            </Button>
            <Button
              onClick={handleRender}
              disabled={converting}
              variant="outline"
              className="order-2 gap-1.5"
            >
              <ArrowsClockwise size={16} />
              {converting
                ? isEn
                  ? "Rendering..."
                  : "Рендер..."
                : isEn
                  ? "Update"
                  : "Обновить"}
            </Button>
          </>
        ) : (
          <Button
            data-primary-action="html-image"
            data-primary-state="render"
            onClick={handleRender}
            disabled={converting}
            className="gap-1.5"
          >
            <ArrowsClockwise size={16} />
            {converting
              ? isEn
                ? "Rendering..."
                : "Рендер..."
              : isEn
                ? "Render"
                : "Рендер"}
          </Button>
        )}
      </div>

      {/* Templates */}
      <AdvancedSettings
        title={isEn ? "Starting template" : "Стартовый шаблон"}
        className="mb-3"
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {isEn ? "Templates" : "Шаблоны"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => loadTemplate(t)}
              className="rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
            >
              {isEn ? t.en : t.ru}
              <span className="ml-1 text-[10px] opacity-60 tabular-nums">
                {t.w}x{t.h}
              </span>
            </button>
          ))}
        </div>
      </AdvancedSettings>

      <AdvancedSettings
        title={isEn ? "Advanced output settings" : "Расширенные настройки"}
        description={
          isEn
            ? "Canvas size, scale, background, format and filename"
            : "Размер холста, масштаб, фон, формат и имя файла"
        }
        className="mb-3"
      >
        {/* Render options */}
        <Card className="mb-3 p-4 sm:p-5">
          <div className="mb-3 text-sm font-semibold">
            {isEn ? "Render options" : "Параметры рендера"}
          </div>

          {/* Size presets */}
          <Label id="html-image-size-label" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {isEn ? "Canvas size" : "Размер холста"}
          </Label>
          <div role="radiogroup" aria-labelledby="html-image-size-label" className="mb-3 flex flex-wrap gap-1.5">
            {SIZE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={currentSizePresetKey === p.key}
                onClick={() => applySize(p)}
                className={cn(
                  "min-h-8 rounded-[var(--radius-pill)] border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                  currentSizePresetKey === p.key
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                {p.label}{" "}
                <span className="text-[10px] opacity-70 tabular-nums">
                  {p.key === "custom" ? "" : `${p.w}x${p.h}`}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MobileSlider
              label={isEn ? "Width" : "Ширина"}
              value={width}
              min={320}
              max={1920}
              step={8}
              unit="px"
              onChange={setWidth}
            />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-[var(--color-text)]">
                  {isEn ? "Height" : "Высота"}
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <input
                    type="checkbox"
                    checked={heightAuto}
                    onChange={(e) => setHeightAuto(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--color-primary)]"
                  />
                  {isEn ? "Auto" : "Авто"}
                </label>
              </div>
              <MobileSlider
                label=""
                value={height}
                min={120}
                max={2400}
                step={8}
                unit="px"
                onChange={setHeight}
                disabled={heightAuto}
                className={cn(heightAuto && "opacity-50 pointer-events-none")}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label id="html-image-scale-label" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Pixel scale (DPR)" : "Множитель DPR"}
              </Label>
              <div
                role="radiogroup"
                aria-labelledby="html-image-scale-label"
                className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5"
              >
                {SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={scale === opt.value}
                    onClick={() => setScale(opt.value)}
                    style={{ minWidth: 44 }}
                    className={cn(
                      "min-h-9 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors",
                      scale === opt.value
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Background" : "Фон"}
              </Label>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--color-primary)]"
                  />
                  {isEn ? "Transparent" : "Прозрачный"}
                </label>
                {!transparentBg && (
                  <ColorPickerInput
                    value={bgColor}
                    onChange={setBgColor}
                    label={isEn ? "Background color" : "Цвет фона"}
                    size="small"
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Export tabs */}
        <Card className="mb-3 p-4 sm:p-5">
          <div className="mb-3 text-sm font-semibold">
            {isEn ? "Export format" : "Формат экспорта"}
          </div>
          <Tabs
            value={format}
            onValueChange={(v) => setFormat(v as OutputFormat)}
          >
            <TabsList className="mb-3 w-full">
              {FORMAT_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {(format === "jpeg" || format === "webp") && (
              <div className="mb-3">
                <MobileSlider
                  label={
                    isEn
                      ? `${format.toUpperCase()} quality`
                      : `Качество ${format.toUpperCase()}`
                  }
                  value={Math.round(quality * 100)}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(v) => setQuality(v / 100)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <Label htmlFor="html-image-filename" className="mb-1 block text-xs text-[var(--color-text-muted)]">
                  {isEn ? "Filename" : "Имя файла"}
                </Label>
                <div className="flex">
                  <Input
                    id="html-image-filename"
                    value={outputName}
                    onChange={(e) => setOutputName(e.target.value)}
                    placeholder="html-to-image"
                    className="rounded-r-none text-xs"
                  />
                  <span className="flex items-center rounded-r-[var(--radius-md)] border border-l-0 border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 text-xs text-[var(--color-text-muted)] tabular-nums">
                    .{format === "jpeg" ? "jpg" : format}
                  </span>
                </div>
              </div>
            </div>
          </Tabs>
        </Card>

        <div className="flex flex-wrap gap-2">
          {previewUrl && format !== "pdf" && (
            <Button
              variant="outline"
              onClick={handleCopyDataUrl}
              className="gap-1.5"
            >
              {copiedDataUrl ? (
                <Check size={16} className="text-[var(--color-success)]" />
              ) : (
                <Copy size={16} />
              )}
              {isEn
                ? copiedDataUrl
                  ? "Copied!"
                  : "Copy data URL"
                : copiedDataUrl
                  ? "Скопировано!"
                  : "Копировать data URL"}
            </Button>
          )}
          <Button variant="outline" onClick={handleCopySvg} className="gap-1.5">
            {copiedSvg ? (
              <Check size={16} className="text-[var(--color-success)]" />
            ) : (
              <FileSvg size={16} />
            )}
            {isEn ? "Copy SVG markup" : "Копировать SVG разметку"}
          </Button>
        </div>
      </AdvancedSettings>

      {error && (
        <div
          role="alert"
          className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <Eye size={14} className="text-[var(--color-text-muted)]" />
            <div className="text-sm font-semibold">
              {isEn ? "Live preview" : "Живой предпросмотр"}
            </div>
            <Badge variant="outline" className="ml-auto">
              iframe
            </Badge>
          </div>
          <div
            className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]"
            style={{
              background:
                "repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%) 0 0 / 16px 16px",
              aspectRatio: `${width}/${height}`,
              maxHeight: 420,
            }}
          >
            <iframe
              srcDoc={iframeContent}
              sandbox="allow-scripts"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
              title="HTML Preview"
            />
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2">
            <ImageIcon size={14} className="text-[var(--color-primary)]" />
            <div className="text-sm font-semibold">
              {isEn ? "Export preview" : "Предпросмотр экспорта"}
            </div>
            {previewUrl && format !== "pdf" && (
              <Badge variant="primary" className="ml-auto tabular-nums">
                {`${width * (format === "svg" ? 1 : scale)}x${height * (format === "svg" ? 1 : scale)} ${format.toUpperCase()}`}
              </Badge>
            )}
          </div>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Rendered output"
              style={{
                width: "100%",
                maxHeight: 420,
                objectFit: "contain",
                display: "block",
                background: transparentBg
                  ? "repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%) 0 0 / 16px 16px"
                  : "transparent",
              }}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)]"
            />
          ) : (
            <div className="flex h-[280px] w-full items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <span className="text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? 'Click "Render" to generate'
                  : 'Нажмите "Рендер" для генерации'}
              </span>
            </div>
          )}
        </Card>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <output aria-live="polite" className="sr-only">
        {previewUrl
          ? isEn
            ? `Rendered ${width}x${height} ${format.toUpperCase()}.`
            : `Готово ${width}x${height} ${format.toUpperCase()}.`
          : ""}
      </output>
    </div>
  );
}
