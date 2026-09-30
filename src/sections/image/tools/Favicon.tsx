"use client";

import { Download, Loader2, Settings2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { writeIco } from "../engine/container";
import { IMAGE_ACCEPT } from "../engine/detect";
import { normalizeHex } from "../engine/palette";
import { roundRectPath } from "../engine/pipeline";
import { previewFile } from "../engine/run";
import { prepareFile } from "../engine/source";
import { checker, ColorField, RangeField } from "../ui/controls";
import { FONTS, fontCss } from "../ui/fonts";
import { useBitmap, useEngine } from "../ui/hooks";
import { errorText, S } from "../ui/strings";
import { downloadZip } from "../ui/useBatch";

const T = {
  ru: {
    source: "Источник",
    image: "Картинка",
    text: "Текст",
    emoji: "Эмодзи",
    textLabel: "Буквы (1–3 символа)",
    emojiLabel: "Один эмодзи",
    font: "Шрифт",
    shape: "Форма",
    square: "Квадрат",
    rounded: "Скруглённая",
    circle: "Круг",
    bg: "Фон",
    transparentBg: "Прозрачный фон",
    fill: "Заливка",
    fg: "Цвет текста",
    padding: "Отступ",
    appName: "Название сайта (manifest)",
    shortName: "Короткое название",
    theme: "theme_color",
    download: "Скачать набор (ZIP)",
    files: "Файлы в архиве",
    html: "Код для <head>",
    pickImage: "Перетащите картинку (лучше квадратную, от 512 px) или нажмите",
    preview: (n: number) => `Иконка ${n}×${n}`,
    onlyOne: "Оставлен только первый эмодзи",
  },
  en: {
    source: "Source",
    image: "Image",
    text: "Text",
    emoji: "Emoji",
    textLabel: "Letters (1–3 characters)",
    emojiLabel: "One emoji",
    font: "Font",
    shape: "Shape",
    square: "Square",
    rounded: "Rounded",
    circle: "Circle",
    bg: "Background",
    transparentBg: "Transparent background",
    fill: "Fill",
    fg: "Text colour",
    padding: "Padding",
    appName: "Site name (manifest)",
    shortName: "Short name",
    theme: "theme_color",
    download: "Download the set (ZIP)",
    files: "Files in the archive",
    html: "Code for <head>",
    pickImage: "Drop an image (square, 512 px or more works best) or click",
    preview: (n: number) => `Icon ${n}×${n}`,
    onlyOne: "Only the first emoji was kept",
  },
} as const;

const PNG_SIZES: [number, string][] = [
  [16, "favicon-16x16.png"],
  [32, "favicon-32x32.png"],
  [48, "favicon-48x48.png"],
  [180, "apple-touch-icon.png"],
  [192, "android-chrome-192x192.png"],
  [512, "android-chrome-512x512.png"],
];
const ICO_SIZES = [16, 32, 48];
const PREVIEW = [16, 32, 48, 180];

/** Grapheme clusters (emoji with modifiers/ZWJ count as one). */
function graphemes(s: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } })
    .Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(s), (x) => x.segment);
  return Array.from(s);
}

interface Design {
  mode: "image" | "text" | "emoji";
  text: string;
  emoji: string;
  font: string;
  shape: "square" | "rounded" | "circle";
  bg: string;
  transparent: boolean;
  fg: string;
  padding: number;
}

function render(size: number, d: Design, img: ImageBitmap | null): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.save();
  ctx.beginPath();
  if (d.shape === "circle") ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  else roundRectPath(ctx, 0, 0, size, size, d.shape === "rounded" ? size * 0.22 : 0);
  ctx.clip();
  if (!d.transparent) {
    ctx.fillStyle = d.bg;
    ctx.fillRect(0, 0, size, size);
  }
  const inner = size * (1 - (2 * d.padding) / 100);
  const off = (size - inner) / 2;
  if (d.mode === "image" && img) {
    const k = Math.min(inner / img.width, inner / img.height);
    const w = img.width * k;
    const h = img.height * k;
    // step down for small sizes to keep details crisp
    let src: CanvasImageSource = img;
    let sw = img.width;
    let sh = img.height;
    while (sw / 2 >= w * 1.5) {
      const tmp = document.createElement("canvas");
      tmp.width = Math.max(1, Math.round(sw / 2));
      tmp.height = Math.max(1, Math.round(sh / 2));
      const tc = tmp.getContext("2d")!;
      tc.imageSmoothingQuality = "high";
      tc.drawImage(src, 0, 0, tmp.width, tmp.height);
      src = tmp;
      sw = tmp.width;
      sh = tmp.height;
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, (size - w) / 2, (size - h) / 2, w, h);
  } else {
    const txt = d.mode === "emoji" ? d.emoji : d.text;
    if (txt) {
      const family = d.mode === "emoji" ? "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif" : fontCss(d.font);
      let px = inner;
      ctx.font = `700 ${px}px ${family}`;
      const m = ctx.measureText(txt);
      const wd = m.width || px;
      if (wd > inner) px = (px * inner) / wd;
      ctx.font = `700 ${px}px ${family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = d.fg;
      const mm = ctx.measureText(txt);
      const asc = mm.actualBoundingBoxAscent || px * 0.7;
      const desc = mm.actualBoundingBoxDescent || px * 0.2;
      ctx.fillText(txt, size / 2, off + inner / 2 + (asc - desc) / 2);
    }
  }
  ctx.restore();
  return c;
}

const toPng = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("ENCODE_FAILED"))), "image/png"));

export default function Favicon({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const getEngine = useEngine();
  const [d, setD] = useState<Design>({
    mode: "text",
    text: "A",
    emoji: "🚀",
    font: "arial",
    shape: "rounded",
    bg: "#2952FF",
    transparent: false,
    fg: "#FFFFFF",
    padding: 12,
  });
  const [img, setImg] = useBitmap();
  const [imgName, setImgName] = useState("");
  const [appName, setAppName] = useState(locale === "ru" ? "Мой сайт" : "My site");
  const [shortName, setShortName] = useState(locale === "ru" ? "Сайт" : "Site");
  const [theme, setTheme] = useState("#2952FF");
  const [busy, setBusy] = useState(false);
  const [zipSize, setZipSize] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [emojiTrimmed, setEmojiTrimmed] = useState(false);
  const previews = useRef<(HTMLCanvasElement | null)[]>([]);
  const set = (p: Partial<Design>) => setD((x) => ({ ...x, ...p }));

  const designKey = JSON.stringify(d);
  const drawPreviews = useCallback(() => {
    PREVIEW.forEach((n, i) => {
      const target = previews.current[i];
      if (!target) return;
      const src = render(n, JSON.parse(designKey), img);
      target.width = n;
      target.height = n;
      const ctx = target.getContext("2d")!;
      ctx.clearRect(0, 0, n, n);
      ctx.drawImage(src, 0, 0);
    });
  }, [designKey, img]);
  useEffect(drawPreviews, [drawPreviews]);

  async function pick(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const p = await prepareFile(f);
      const r = await previewFile(getEngine(), p, 1024, { svgWidth: 1024 });
      setImg(r.bitmap);
      setImgName(f.name);
      set({ mode: "image", padding: 0 });
    } catch (e) {
      setError(e);
    }
  }

  const themeHex = normalizeHex(theme) ?? "#FFFFFF";
  const manifest = JSON.stringify(
    {
      name: appName.trim() || "Site",
      short_name: shortName.trim() || appName.trim() || "Site",
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: themeHex,
      background_color: d.transparent ? "#FFFFFF" : d.bg,
      display: "standalone",
    },
    null,
    2,
  );
  const html = [
    '<link rel="icon" href="/favicon.ico" sizes="48x48">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    `<meta name="theme-color" content="${themeHex}">`,
  ].join("\n");

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const files: { name: string; blob: Blob }[] = [];
      for (const [n, name] of PNG_SIZES) files.push({ name, blob: await toPng(render(n, d, img)) });
      const icoImages = [];
      for (const n of ICO_SIZES) icoImages.push({ width: n, height: n, png: new Uint8Array(await (await toPng(render(n, d, img))).arrayBuffer()) });
      files.unshift({ name: "favicon.ico", blob: new Blob([writeIco(icoImages) as BlobPart], { type: "image/x-icon" }) });
      files.push({ name: "site.webmanifest", blob: new Blob([manifest], { type: "application/manifest+json" }) });
      files.push({ name: "favicon-head.html", blob: new Blob([html], { type: "text/html" }) });
      setZipSize(files.reduce((a, f) => a + f.blob.size, 0));
      await downloadZip(files, "favicon.zip");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] border border-line bg-surface">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 px-4 py-3">
          <Field label={t.source}>
            <Segmented
              wrap
              label={t.source}
              value={d.mode}
              onChange={(m) => set({ mode: m })}
              options={[
                { value: "text", label: t.text },
                { value: "emoji", label: t.emoji },
                { value: "image", label: t.image },
              ]}
            />
          </Field>
          {d.mode === "text" && (
            <Field label={t.textLabel} htmlFor={`${id}-txt`} className="w-40">
              <Input id={`${id}-txt`} value={d.text} onChange={(e) => set({ text: graphemes(e.target.value).slice(0, 3).join("") })} autoComplete="off" />
            </Field>
          )}
          {d.mode === "emoji" && (
            <Field label={t.emojiLabel} htmlFor={`${id}-emo`} className="w-32" hint={emojiTrimmed ? t.onlyOne : undefined}>
              <Input
                id={`${id}-emo`}
                value={d.emoji}
                autoComplete="off"
                onChange={(e) => {
                  const g = graphemes(e.target.value.trim());
                  // keep the newest emoji typed or pasted
                  setEmojiTrimmed(g.length > 1);
                  set({ emoji: g.length ? g[g.length - 1] : "" });
                }}
              />
            </Field>
          )}
          {d.mode === "image" && (
            <Dropzone onFiles={pick} accept={IMAGE_ACCEPT} compact title={imgName || t.pickImage} className="min-h-14! max-w-sm flex-1 py-2!" />
          )}
          <Field label={t.shape}>
            <Segmented
              wrap
              label={t.shape}
              value={d.shape}
              onChange={(v) => set({ shape: v })}
              options={[
                { value: "square", label: t.square },
                { value: "rounded", label: t.rounded },
                { value: "circle", label: t.circle },
              ]}
            />
          </Field>
          <ColorField label={t.bg} value={d.bg} onChange={(c) => set({ bg: c, transparent: false })} locale={locale} className="w-44" />
        </div>
        <details className="border-t border-line">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-fg-2 hover:text-fg">
            <Settings2 className="size-4" aria-hidden />
            {locale === "ru" ? "Дополнительно" : "More options"}
          </summary>
          <div className="grid gap-4 px-4 pb-4 pt-1 sm:grid-cols-2">
            <Field label={t.fill}>
              <Segmented
                wrap
                label={t.fill}
                value={d.transparent ? "t" : "c"}
                onChange={(v) => set({ transparent: v === "t" })}
                options={[
                  { value: "c", label: t.bg },
                  { value: "t", label: t.transparentBg },
                ]}
              />
            </Field>
            {d.mode === "text" && (
              <>
                <ColorField label={t.fg} value={d.fg} onChange={(c) => set({ fg: c })} locale={locale} />
                <Field label={t.font} htmlFor={`${id}-font`}>
                  <Select id={`${id}-font`} value={d.font} onChange={(e) => set({ font: e.target.value })}>
                    {FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
            <RangeField label={t.padding} value={d.padding} onChange={(v) => set({ padding: v })} min={0} max={30} unit="%" locale={locale} />
            <Field label={t.appName} htmlFor={`${id}-app`}>
              <Input id={`${id}-app`} value={appName} onChange={(e) => setAppName(e.target.value)} maxLength={60} />
            </Field>
            <Field label={t.shortName} htmlFor={`${id}-short`}>
              <Input id={`${id}-short`} value={shortName} onChange={(e) => setShortName(e.target.value)} maxLength={20} />
            </Field>
            <ColorField label={t.theme} value={themeHex} onChange={setTheme} locale={locale} />
          </div>
        </details>
      </div>

      <Panel className="overflow-hidden">
        <div className={`flex flex-wrap items-end justify-center gap-6 p-6 ${checker}`}>
          {PREVIEW.map((n, i) => (
            <figure key={n} className="flex flex-col items-center gap-2">
              <canvas
                ref={(el) => {
                  previews.current[i] = el;
                }}
                role="img"
                aria-label={t.preview(n)}
                width={n}
                height={n}
                style={{
                  width: n === 16 ? 32 : n === 180 ? 120 : n,
                  height: n === 16 ? 32 : n === 180 ? 120 : n,
                  imageRendering: n <= 32 ? "pixelated" : "auto",
                }}
              />
              <figcaption className="text-xs text-fg-2">
                {n}×{n}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            <p className="text-lg font-semibold text-fg">favicon.ico + 6 PNG + site.webmanifest</p>
            <p className="text-sm text-fg-3">
              {zipSize ? formatBytes(locale, zipSize) : `ICO: ${ICO_SIZES.join(", ")} px · PNG: ${PNG_SIZES.map(([n]) => n).join(", ")} px`}
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={download} disabled={busy || (d.mode === "image" && !img)}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            {t.download}
          </Button>
        </div>
      </Panel>

      <div className="overflow-hidden rounded-[12px] border border-line bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5">
          <label htmlFor={`${id}-html`} className="text-sm font-semibold text-fg">
            {t.html}
          </label>
          <CopyButton value={html} variant="ghost" label={locale === "ru" ? "Копировать" : "Copy"} copiedLabel={locale === "ru" ? "Скопировано" : "Copied"} />
        </div>
        <textarea
          id={`${id}-html`}
          readOnly
          value={html}
          rows={6}
          spellCheck={false}
          className="block w-full resize-y bg-transparent px-3 py-2.5 font-mono text-xs leading-relaxed text-fg-2 focus:outline-none"
        />
      </div>
      {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
      <p className="sr-only">{s.processingIn}</p>
    </div>
  );
}
