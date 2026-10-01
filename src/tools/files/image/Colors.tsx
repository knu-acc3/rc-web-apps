"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { IMAGE_ACCEPT } from "./lib/detect";
import { luminance, rgbToHex, rgbToHsl, type PaletteColor } from "./lib/palette";
import { materialize } from "./lib/source";
import { pixelsOf } from "./lib/run";
import type { PixelsResult } from "./lib/types";
import { checker, RangeField, replaceDrop } from "./ui/controls";
import { useDebounced, useEngine } from "./ui/hooks";
import { useSingleFile } from "./ui/SingleImage";
import { errorText, S } from "./ui/strings";
import { useWorkspace } from "./ui/useWorkspace";
import { RestoringPlaceholder, WorkspaceBar } from "./ui/Workspace";

const T = {
  ru: {
    count: "Цветов в палитре",
    export: "Экспорт",
    hex: "HEX",
    css: "CSS",
    json: "JSON",
    picked: "Цвет под курсором",
    pickHint: "Нажмите на картинку, чтобы взять цвет пикселя; с клавиатуры — стрелки (Shift — быстрее)",
    image: "Изображение: щёлкните, чтобы определить цвет",
    palette: "Палитра",
    copy: "Копировать",
    copied: "Скопировано",
    share: "доля",
    copyHex: (h: string) => `Копировать ${h}`,
  },
  en: {
    count: "Colours in the palette",
    export: "Export",
    hex: "HEX",
    css: "CSS",
    json: "JSON",
    picked: "Colour under the cursor",
    pickHint: "Click the image to pick a pixel colour; keyboard: arrow keys (Shift for bigger steps)",
    image: "Image: click to pick a colour",
    palette: "Palette",
    copy: "Copy",
    copied: "Copied",
    share: "share",
    copyHex: (h: string) => `Copy ${h}`,
  },
} as const;

export default function Colors({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const getEngine = useEngine();
  const file = useSingleFile();
  const [pxState, setPx] = useState<{ id: string; px: PixelsResult } | null>(null);
  const [palState, setPalette] = useState<{ key: string; colors: PaletteColor[] } | null>(null);
  const [count, setCount] = useState(8);
  const debCount = useDebounced(count, 250);
  const [fmt, setFmt] = useState<"hex" | "css" | "json">("hex");
  const [cursorState, setCursor] = useState<{ id: string; x: number; y: number } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const p = file.prepared;
  const px = pxState && p && pxState.id === p.id ? pxState.px : null;
  const palKey = p ? `${p.id}:${debCount}` : "";
  const palette = palState && palState.key === palKey ? palState.colors : null;
  const cursor = cursorState && p && cursorState.id === p.id ? cursorState : null;
  const { load } = file;
  // The photo stays in the tab's workspace for the next photo tool (and comes back from the previous one).
  const ws = useWorkspace({ files: p ? [p.file] : [], mode: "append", accept: IMAGE_ACCEPT, restore: (files, i) => void load(files[i] ?? files[0]) });

  useEffect(() => {
    if (!p) return;
    const ac = new AbortController();
    pixelsOf(getEngine(), p, 900, { signal: ac.signal })
      .then((r) => {
        if (ac.signal.aborted) return;
        setPx({ id: p.id, px: r });
        setCursor({ id: p.id, x: Math.floor(r.width / 2), y: Math.floor(r.height / 2) });
      })
      .catch((e) => !ac.signal.aborted && setError(e));
    return () => ac.abort();
  }, [p, getEngine]);

  useEffect(() => {
    if (!p) return;
    const ac = new AbortController();
    (async () => {
      try {
        const m = await materialize(p);
        const res = await getEngine().run<PaletteColor[]>({ type: "palette", src: m.src, count: debCount }, { signal: ac.signal, transfer: m.transfer });
        if (!ac.signal.aborted) setPalette({ key: palKey, colors: res });
      } catch (e) {
        if (!ac.signal.aborted) setError(e);
      }
    })();
    return () => ac.abort();
  }, [p, debCount, palKey, getEngine]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !px) return;
    c.width = px.width;
    c.height = px.height;
    c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(px.rgba), px.width, px.height), 0, 0);
  }, [px]);

  const pickAt = (clientX: number, clientY: number) => {
    const c = canvasRef.current;
    if (!c || !px) return;
    const r = c.getBoundingClientRect();
    setCursor({
      id: p!.id,
      x: Math.min(px.width - 1, Math.max(0, Math.floor(((clientX - r.left) / r.width) * px.width))),
      y: Math.min(px.height - 1, Math.max(0, Math.floor(((clientY - r.top) / r.height) * px.height))),
    });
  };

  if (!p) {
    return (
      <div className="flex flex-col gap-3">
        {ws.restoring || file.loading ? (
          <RestoringPlaceholder locale={locale} text={ws.restoring ? undefined : s.reading} />
        ) : (
          <Dropzone onFiles={(f) => f[0] && file.load(f[0])} accept={IMAGE_ACCEPT} title={s.dropOne} hint={s.dropHint} locale={locale} />
        )}
        {file.error ? <Notice tone="err">{errorText(locale, file.error)}</Notice> : null}
      </div>
    );
  }

  let picked: { hex: string; rgb: string; hsl: string; r: number; g: number; b: number } | null = null;
  if (px && cursor) {
    const d = new Uint8ClampedArray(px.rgba);
    const o = (cursor.y * px.width + cursor.x) * 4;
    const [r, g, b] = [d[o], d[o + 1], d[o + 2]];
    const [h, sat, l] = rgbToHsl(r, g, b);
    picked = { hex: rgbToHex(r, g, b), rgb: `rgb(${r}, ${g}, ${b})`, hsl: `hsl(${h}, ${sat}%, ${l}%)`, r, g, b };
  }

  const hexes = (palette ?? []).map((c) => rgbToHex(c.r, c.g, c.b));
  const exportText =
    fmt === "hex"
      ? hexes.join("\n")
      : fmt === "css"
        ? `:root {\n${hexes.map((h, i) => `  --color-${i + 1}: ${h};`).join("\n")}\n}`
        : JSON.stringify(
            (palette ?? []).map((c, i) => ({ hex: hexes[i], rgb: [c.r, c.g, c.b], share: Math.round(c.share * 1000) / 1000 })),
            null,
            2,
          );

  return (
    <div className="flex flex-col gap-4">
      <WorkspaceBar
        locale={locale}
        count={ws.restored}
        onStartOver={() => {
          ws.startOver();
          file.reset();
        }}
      />
      <Panel className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className={cn("relative flex min-h-56 items-center justify-center overflow-hidden rounded-[1rem]", checker)}>
          {!px && <Loader2 className="size-6 animate-spin text-accent" aria-hidden />}
          <div className={cn("relative", !px && "hidden")}>
            <canvas
              ref={canvasRef}
              tabIndex={0}
              role="img"
              aria-label={`${t.image}. ${t.pickHint}`}
              className="block max-h-[65vh] max-w-full cursor-crosshair touch-none"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                pickAt(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => e.buttons && pickAt(e.clientX, e.clientY)}
              onKeyDown={(e) => {
                if (!px || !cursor) return;
                const st = e.shiftKey ? 10 : 1;
                const d =
                  e.key === "ArrowLeft" ? [-st, 0] : e.key === "ArrowRight" ? [st, 0] : e.key === "ArrowUp" ? [0, -st] : e.key === "ArrowDown" ? [0, st] : null;
                if (!d) return;
                e.preventDefault();
                setCursor({
                  id: cursor.id,
                  x: Math.min(px.width - 1, Math.max(0, cursor.x + d[0])),
                  y: Math.min(px.height - 1, Math.max(0, cursor.y + d[1])),
                });
              }}
            />
            {px && cursor && (
              <span
                aria-hidden
                className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.5)]"
                style={{ left: `${((cursor.x + 0.5) / px.width) * 100}%`, top: `${((cursor.y + 0.5) / px.height) * 100}%` }}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 px-1" aria-live="polite">
          <p className="text-sm font-medium text-fg-2">{t.picked}</p>
          {picked ? (
            <>
              <div className="h-24 rounded-[1rem] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] motion-safe:transition-colors" style={{ background: picked.hex }} />
              <p className="tabular text-4xl font-semibold tracking-tight text-fg">{picked.hex}</p>
              <ul className="flex flex-col gap-1 text-sm">
                {[picked.hex, picked.rgb, picked.hsl].map((v) => (
                  <li key={v} className="flex items-center justify-between gap-2">
                    <code className="break-all text-fg-2">{v}</code>
                    <CopyButton value={v} size="icon-sm" variant="ghost" label={t.copy} copiedLabel={t.copied} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-fg-3">—</p>
          )}
          <p className="text-[0.8125rem] text-fg-3">{t.pickHint}</p>
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="text-base font-semibold text-fg">{t.palette}</h2>
          <div className="w-full max-w-xs">
            <RangeField label={t.count} value={count} onChange={setCount} min={3} max={16} locale={locale} />
          </div>
        </div>
        {!palette ? (
          <div className="flex min-h-24 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-accent" aria-hidden />
          </div>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
            {palette.map((c, i) => {
              const hex = hexes[i];
              const dark = luminance(c.r, c.g, c.b) < 0.4;
              return (
                <li key={hex + i}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (await copyText(hex)) setCopiedHex(hex);
                    }}
                    aria-label={t.copyHex(hex)}
                    className={cn(
                      "flex h-20 w-full flex-col justify-end rounded-[1rem] p-2.5 text-left text-xs font-medium shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] transition-transform hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      dark ? "text-white" : "text-black",
                    )}
                    style={{ background: hex }}
                  >
                    <span className="font-mono">{copiedHex === hex ? t.copied : hex}</span>
                    <span className="opacity-80">{formatNumber(locale, c.share * 100, { maximumFractionDigits: 1 })} %</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented
              label={t.export}
              value={fmt}
              onChange={setFmt}
              size="sm"
              options={[
                { value: "hex", label: t.hex },
                { value: "css", label: t.css },
                { value: "json", label: t.json },
              ]}
            />
            <CopyButton value={exportText} label={t.copy} copiedLabel={t.copied} variant="secondary" />
          </div>
          <label htmlFor={`${id}-exp`} className="sr-only">
            {t.export}
          </label>
          <textarea
            id={`${id}-exp`}
            readOnly
            value={exportText}
            rows={Math.min(10, exportText.split("\n").length)}
            spellCheck={false}
            className="block w-full resize-y rounded-[1rem] bg-surface-2 px-3.5 py-3 font-mono text-xs leading-relaxed text-fg-2 focus:outline-2 focus:outline-accent"
          />
        </div>
      </Panel>
      {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
      <Dropzone onFiles={(f) => f[0] && file.load(f[0])} accept={IMAGE_ACCEPT} title={s.dropOne} locale={locale} className={replaceDrop} />
    </div>
  );
}
