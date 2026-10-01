"use client";

/* eslint-disable @next/next/no-img-element -- SVG is shown only as an <img> (sandboxed) */
import { Download, FileCode, ImageDown, Loader2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Field } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { rasterizeSvg, svgIntrinsicSize } from "./lib/source";
import { optimizeSvg, type SvgReport } from "./lib/svg-optimize";
import type { OutFormat } from "./lib/types";
import { checker, NumberField, replaceDrop } from "./ui/controls";
import { encodeMainCanvas } from "./ui/encodeMain";
import { useEngine } from "./ui/hooks";
import { OptionsBar, ToolColumns } from "./ui/OptionsBar";
import { errorText } from "./ui/strings";

const T = {
  ru: {
    drop: "Перетащите SVG-файл сюда, вставьте Ctrl+V или нажмите, чтобы выбрать",
    or: "…или вставьте код SVG",
    code: "Код SVG",
    view: "Показать",
    optimized: "Оптимизированный",
    original: "Исходный",
    precision: "Округление координат",
    off: "Нет",
    digits: (n: number) => `${n} зн. после запятой`,
    bg: "Фон",
    transparent: "Прозрачный",
    light: "Светлый",
    dark: "Тёмный",
    saved: "экономия",
    downloadSvg: "Скачать SVG",
    export: "Экспорт в картинку",
    width: "Ширина",
    format: "Формат",
    exportBtn: "Скачать",
    report: (r: SvgReport) =>
      `Удалено: комментариев — ${r.comments}, блоков metadata — ${r.metadata}, данных редакторов — ${r.editorNodes + r.editorAttrs}, пустых текстовых узлов — ${r.whitespace}${r.rounded ? `; округлено атрибутов — ${r.rounded}` : ""}`,
    size: "Размер",
    viewBox: "viewBox",
    none: "нет",
    preview: "Предпросмотр SVG",
  },
  en: {
    drop: "Drop an SVG file here, paste with Ctrl+V or click to choose",
    or: "…or paste SVG code",
    code: "SVG code",
    view: "Show",
    optimized: "Optimised",
    original: "Original",
    precision: "Coordinate rounding",
    off: "None",
    digits: (n: number) => `${n} decimal${n === 1 ? "" : "s"}`,
    bg: "Background",
    transparent: "Transparent",
    light: "Light",
    dark: "Dark",
    saved: "saved",
    downloadSvg: "Download SVG",
    export: "Export as image",
    width: "Width",
    format: "Format",
    exportBtn: "Download",
    report: (r: SvgReport) =>
      `Removed: ${r.comments} comments, ${r.metadata} metadata blocks, ${r.editorNodes + r.editorAttrs} editor items, ${r.whitespace} empty text nodes${r.rounded ? `; ${r.rounded} attributes rounded` : ""}`,
    size: "Size",
    viewBox: "viewBox",
    none: "none",
    preview: "SVG preview",
  },
} as const;

export default function Svg({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const getEngine = useEngine();
  const [src, setSrc] = useState("");
  const [name, setName] = useState("image");
  const [precision, setPrecision] = useState<string>("off");
  const [show, setShow] = useState<"optimized" | "original">("optimized");
  const [bg, setBg] = useState<"transparent" | "light" | "dark">("transparent");
  const [width, setWidth] = useState<number | null>(null);
  const [fmt, setFmt] = useState<OutFormat>("png");
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<unknown>(null);

  const result = useMemo(() => {
    if (!src.trim()) return null;
    try {
      const out = optimizeSvg(src, { precision: precision === "off" ? null : Number(precision) });
      const doc = new DOMParser().parseFromString(out.output, "image/svg+xml");
      const size = svgIntrinsicSize(doc);
      return { ...out, size, viewBox: doc.documentElement.getAttribute("viewBox") };
    } catch (e) {
      return { error: e };
    }
  }, [src, precision]);

  const ok = result && !("error" in result) ? result : null;
  const shownText = ok ? (show === "optimized" ? ok.output : src) : "";
  const url = useMemo(() => (shownText ? URL.createObjectURL(new Blob([shownText], { type: "image/svg+xml" })) : null), [shownText]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const before = new Blob([src]).size;
  const after = ok ? new Blob([ok.output]).size : 0;
  const baseW = ok ? Math.round(ok.size.w) : 0;
  const outW = width ?? Math.max(baseW, 512);

  async function exportImage() {
    if (!ok) return;
    setBusy(true);
    setExportError(null);
    try {
      const { bitmap } = await rasterizeSvg(ok.output, outW);
      const c = document.createElement("canvas");
      c.width = bitmap.width;
      c.height = bitmap.height;
      c.getContext("2d")!.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await encodeMainCanvas(getEngine(), c, fmt, 92, "#FFFFFF");
      downloadBlob(blob, `${name}-${c.width}x${c.height}.${fmt}`);
      c.width = c.height = 1;
    } catch (e) {
      setExportError(e);
    } finally {
      setBusy(false);
    }
  }

  const loadFile = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setName(f.name.replace(/\.[^.]+$/, "") || "image");
    setSrc(await f.text());
  };

  if (!src) {
    return (
      <div className="flex flex-col gap-3">
        <Dropzone onFiles={loadFile} accept="image/svg+xml,.svg" title={t.drop} locale={locale} />
        <Field label={t.or} htmlFor={`${id}-paste`}>
          <textarea
            id={`${id}-paste`}
            rows={4}
            spellCheck={false}
            placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">…</svg>'
            className="control min-h-28 resize-y py-2.5 font-mono text-sm"
            onChange={(e) => setSrc(e.target.value)}
          />
        </Field>
      </div>
    );
  }

  const dec = (n: number) => (locale === "ru" ? (0.1 ** n).toFixed(n).replace(".", ",") : (0.1 ** n).toFixed(n));
  const side = (
    <OptionsBar locale={locale}>
      <Segmented
        fill
        label={t.view}
        value={show}
        onChange={setShow}
        options={[
          { value: "optimized", label: t.optimized },
          { value: "original", label: t.original },
        ]}
      />
      <Field label={t.precision}>
        <Segmented
          label={t.precision}
          value={precision}
          onChange={setPrecision}
          options={[{ value: "off", label: t.off }, ...[1, 2, 3].map((n) => ({ value: String(n), label: dec(n), title: t.digits(n) }))]}
        />
      </Field>
      <Field label={t.bg}>
        <Segmented
          label={t.bg}
          value={bg}
          onChange={setBg}
          options={[
            { value: "transparent", label: t.transparent },
            { value: "light", label: t.light },
            { value: "dark", label: t.dark },
          ]}
        />
      </Field>
      {ok && (
        <section className="flex flex-col gap-3 border-t border-line pt-4" aria-labelledby={`${id}-exp`}>
          <h3 id={`${id}-exp`} className="flex items-center gap-2 text-[0.9375rem] font-semibold text-fg">
            <ImageDown className="size-4 text-accent" aria-hidden />
            {t.export}
          </h3>
          <NumberField label={t.width} value={width} onChange={setWidth} min={8} max={16384} suffix="px" placeholder={String(outW)} locale={locale} />
          <Field label={t.format}>
            <Segmented
              label={t.format}
              value={fmt}
              onChange={setFmt}
              options={(["png", "jpg", "webp"] as const).map((f) => ({ value: f, label: f.toUpperCase() }))}
            />
          </Field>
          <Button variant="tonal" onClick={exportImage} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            {t.exportBtn} {fmt.toUpperCase()}
          </Button>
          {exportError ? <Notice tone="err">{errorText(locale, exportError)}</Notice> : null}
        </section>
      )}
    </OptionsBar>
  );

  return (
    <ToolColumns
      side={side}
      rest={
        <>
          {ok && (
            <Panel className="flex min-w-0 flex-col gap-2 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 px-1">
                <label htmlFor={`${id}-code`} className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <FileCode className="size-4" aria-hidden />
                  {t.code}
                </label>
                <CopyButton
                  value={ok.output}
                  variant="ghost"
                  label={locale === "ru" ? "Копировать" : "Copy"}
                  copiedLabel={locale === "ru" ? "Скопировано" : "Copied"}
                />
              </div>
              <textarea
                id={`${id}-code`}
                readOnly
                value={ok.output.length > 200_000 ? `${ok.output.slice(0, 200_000)}…` : ok.output}
                rows={8}
                spellCheck={false}
                className="block w-full resize-y rounded-[1rem] bg-surface-2 px-3.5 py-3 font-mono text-xs leading-relaxed text-fg-2 focus:outline-2 focus:outline-accent"
              />
            </Panel>
          )}
          <Dropzone onFiles={loadFile} accept="image/svg+xml,.svg" title={t.drop} locale={locale} className={replaceDrop} />
        </>
      }
    >
      {result && "error" in result ? (
        <Notice tone="err">{errorText(locale, result.error)}</Notice>
      ) : ok ? (
        <Panel className="flex min-w-0 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
          <div
            className={cn(
              "flex min-h-56 items-center justify-center rounded-[1rem] p-4",
              bg === "transparent" ? checker : bg === "light" ? "bg-white" : "bg-neutral-900",
            )}
          >
            {url && <img src={url} alt={t.preview} className="block max-h-[55vh] max-w-full" style={{ width: Math.min(baseW || 300, 1200), height: "auto" }} />}
          </div>
          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-w-0">
              <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                {formatBytes(locale, after)}{" "}
                <span className="text-lg text-ok">
                  −{formatNumber(locale, before ? Math.max(0, (1 - after / before) * 100) : 0, { maximumFractionDigits: 1 })} %
                </span>
              </p>
              <p className="tabular text-sm text-fg-3">
                {formatBytes(locale, before)} → {formatBytes(locale, after)} · {t.size} {formatNumber(locale, ok.size.w, { maximumFractionDigits: 2 })}×
                {formatNumber(locale, ok.size.h, { maximumFractionDigits: 2 })} · {t.viewBox}: {ok.viewBox ?? t.none}
              </p>
            </div>
            <Button variant="filled" size="lg" onClick={() => downloadText(ok.output, `${name}.min.svg`, "image/svg+xml")}>
              <Download aria-hidden />
              {t.downloadSvg}
            </Button>
          </div>
          <p className="px-1 text-[0.8125rem] text-fg-3">{t.report(ok.report)}</p>
        </Panel>
      ) : null}
    </ToolColumns>
  );
}
