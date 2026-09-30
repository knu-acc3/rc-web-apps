"use client";

import { AlignCenter, AlignLeft, AlignRight, Download, Loader2, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Select, Switch, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { drawTextBlock, paintBlank } from "../engine/pipeline";
import { processFile, toBlob } from "../engine/run";
import { baseName } from "../engine/source";
import type { ProcessResult, TextBlock } from "../engine/types";
import { checker, ColorField, RangeField } from "../ui/controls";
import { FONTS, fontCss } from "../ui/fonts";
import { DEFAULT_QUALITY, LOSSY, sameFormat } from "../ui/format";
import { useEngine } from "../ui/hooks";
import { ImageStage } from "../ui/ImageStage";
import { usePreviewBitmap } from "../ui/LiveStage";
import { SingleImageShell, useExport, useSingleFile } from "../ui/SingleImage";
import { errorText, S } from "../ui/strings";

const T = {
  ru: {
    mode: "Что делаем",
    photo: "Текст на фото",
    quote: "Карточка с цитатой",
    block: "Надпись",
    top: "Сверху",
    bottom: "Снизу",
    extra: (n: number) => `Текст ${n}`,
    add: "Добавить надпись",
    del: "Удалить надпись",
    text: "Текст",
    font: "Шрифт",
    size: "Размер, % высоты",
    color: "Цвет текста",
    stroke: "Цвет обводки",
    strokeWidth: "Толщина обводки",
    align: "Выравнивание",
    left: "Влево",
    center: "По центру",
    right: "Вправо",
    caps: "ЗАГЛАВНЫЕ",
    bold: "Жирный",
    shadow: "Тень",
    x: "По горизонтали",
    y: "По вертикали",
    width: "Ширина строки",
    dragHint: "Перетащите надпись по картинке, чтобы переместить",
    format: "Размер карточки",
    bg: "Фон",
    solid: "Цвет",
    gradient: "Градиент",
    bg1: "Цвет фона",
    bg2: "Второй цвет",
    quoteText: "«Лучший способ предсказать будущее — создать его»",
    author: "— Питер Друкер",
    download: "Скачать картинку",
  },
  en: {
    mode: "Mode",
    photo: "Text on photo",
    quote: "Quote card",
    block: "Caption",
    top: "Top",
    bottom: "Bottom",
    extra: (n: number) => `Text ${n}`,
    add: "Add caption",
    del: "Delete caption",
    text: "Text",
    font: "Font",
    size: "Size, % of height",
    color: "Text colour",
    stroke: "Outline colour",
    strokeWidth: "Outline width",
    align: "Alignment",
    left: "Left",
    center: "Centre",
    right: "Right",
    caps: "UPPERCASE",
    bold: "Bold",
    shadow: "Shadow",
    x: "Horizontal",
    y: "Vertical",
    width: "Line width",
    dragHint: "Drag a caption on the image to move it",
    format: "Card size",
    bg: "Background",
    solid: "Colour",
    gradient: "Gradient",
    bg1: "Background colour",
    bg2: "Second colour",
    quoteText: "“The best way to predict the future is to create it”",
    author: "— Peter Drucker",
    download: "Download image",
  },
} as const;

type B = TextBlock & { fontId: string };

const meme = (y: number, anchor: TextBlock["anchor"]): B => ({
  text: "",
  fontId: "impact",
  font: fontCss("impact"),
  size: 9,
  color: "#FFFFFF",
  stroke: "#000000",
  strokeWidth: 12,
  align: "center",
  x: 0.5,
  y,
  anchor,
  maxWidth: 92,
  uppercase: true,
});

const CARDS = [
  { value: "1080x1080", w: 1080, h: 1080 },
  { value: "1080x1350", w: 1080, h: 1350 },
  { value: "1080x1920", w: 1080, h: 1920 },
] as const;

function BlockEditor({ b, set, locale, compact }: { b: B; set: (p: Partial<B>) => void; locale: Locale; compact?: boolean }) {
  const t = T[locale];
  const id = useId();
  return (
    <>
      <RangeField label={t.size} value={b.size} onChange={(v) => set({ size: v })} min={1} max={30} step={0.5} unit="%" locale={locale} />
      <ColorField label={t.color} value={b.color} onChange={(c) => set({ color: c })} locale={locale} />
      <ColorField label={t.stroke} value={b.stroke} onChange={(c) => set({ stroke: c })} locale={locale} />
      <RangeField label={t.strokeWidth} value={b.strokeWidth} onChange={(v) => set({ strokeWidth: v })} min={0} max={30} unit="%" locale={locale} />
      <Field label={t.align}>
        <Segmented
          label={t.align}
          value={b.align}
          onChange={(v) => set({ align: v })}
          options={[
            { value: "left", label: <AlignLeft className="size-4" aria-label={t.left} />, title: t.left },
            { value: "center", label: <AlignCenter className="size-4" aria-label={t.center} />, title: t.center },
            { value: "right", label: <AlignRight className="size-4" aria-label={t.right} />, title: t.right },
          ]}
        />
      </Field>
      <div className="flex flex-wrap gap-4">
        <Switch label={t.caps} checked={!!b.uppercase} onChange={(e) => set({ uppercase: e.target.checked })} />
        <Switch label={t.bold} checked={!!b.bold} onChange={(e) => set({ bold: e.target.checked })} />
        <Switch label={t.shadow} checked={!!b.shadow} onChange={(e) => set({ shadow: e.target.checked })} />
      </div>
      {!compact && (
        <>
          <RangeField label={t.x} value={Math.round(b.x * 100)} onChange={(v) => set({ x: v / 100 })} min={0} max={100} unit="%" locale={locale} />
          <RangeField label={t.y} value={Math.round(b.y * 100)} onChange={(v) => set({ y: v / 100 })} min={0} max={100} unit="%" locale={locale} />
        </>
      )}
      <RangeField label={t.width} value={b.maxWidth} onChange={(v) => set({ maxWidth: v })} min={20} max={100} unit="%" locale={locale} />
      <span className="sr-only" id={id} />
    </>
  );
}

export default function AddText({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const getEngine = useEngine();
  const [mode, setMode] = useState<"photo" | "quote">("photo");
  const file = useSingleFile();
  const exp = useExport();
  const { bitmap, info } = usePreviewBitmap(mode === "photo" ? (file.prepared ?? undefined) : undefined, 1600);
  const [blocks, setBlocks] = useState<B[]>(() => [meme(0.03, "top"), meme(0.97, "bottom")]);
  const [sel, setSel] = useState(0);
  const cur = blocks[sel] ?? blocks[0];
  const set = (p: Partial<B>) => setBlocks((bs) => bs.map((b, i) => (i === sel ? { ...b, ...p, font: p.fontId ? fontCss(p.fontId) : (p.font ?? b.font) } : b)));
  const names = (i: number) => (i === 0 ? t.top : i === 1 ? t.bottom : t.extra(i + 1));

  const blocksKey = JSON.stringify(blocks);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, bmp: ImageBitmap) => {
      ctx.drawImage(bmp, 0, 0);
      for (const b of JSON.parse(blocksKey) as B[]) drawTextBlock(ctx, bmp.width, bmp.height, b);
    },
    [blocksKey],
  );

  // drag the selected caption
  const dragging = useRef(false);
  const moveTo = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    set({ x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)), anchor: "middle" });
  };

  const doExport = () => {
    const p = file.prepared;
    if (!p) return;
    exp.run(async (signal, onProgress) => {
      const fmt = sameFormat(p.format);
      const res = await processFile(getEngine(), p, [{ t: "text", blocks }], { format: fmt, quality: LOSSY.has(fmt) ? 92 : DEFAULT_QUALITY[fmt], background: "#FFFFFF" }, { signal, onProgress });
      return { blob: toBlob(res), name: `${baseName(p.file.name)}-text.${res.ext}` };
    });
  };

  const blockTabs = (
    <div className="flex items-end gap-1.5">
      <Field label={t.block}>
        <Segmented label={t.block} value={String(sel)} onChange={(v) => setSel(Number(v))} options={blocks.map((_, i) => ({ value: String(i), label: names(i) }))} />
      </Field>
      <Button variant="ghost" size="icon" aria-label={t.add} title={t.add} onClick={() => { setBlocks((bs) => [...bs, { ...meme(0.5, "middle"), size: 7 }]); setSel(blocks.length); }}>
        <Plus aria-hidden />
      </Button>
      {blocks.length > 1 && (
        <Button variant="ghost" size="icon" aria-label={t.del} title={t.del} onClick={() => { setBlocks((bs) => bs.filter((_, i) => i !== sel)); setSel(0); }}>
          <Trash2 aria-hidden />
        </Button>
      )}
    </div>
  );

  const textField = (
    <Field label={`${t.text}: ${names(sel).toLowerCase()}`} htmlFor={`${id}-text`} className="min-w-56 flex-1">
      <Textarea id={`${id}-text`} value={cur.text} onChange={(e) => set({ text: e.target.value })} rows={2} className="min-h-0! font-sans! text-[15px]!" />
    </Field>
  );
  const fontField = (
    <Field label={t.font} htmlFor={`${id}-font`} className="w-44">
      <Select id={`${id}-font`} value={cur.fontId} onChange={(e) => set({ fontId: e.target.value })}>
        {FONTS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </Select>
    </Field>
  );

  const modeSwitch = (
    <Segmented
      label={t.mode}
      value={mode}
      onChange={(m) => {
        setMode(m);
        if (m === "quote") {
          setBlocks([
            { ...meme(0.45, "middle"), text: t.quoteText, fontId: "georgia", font: fontCss("georgia"), size: 5.5, strokeWidth: 0, uppercase: false, maxWidth: 80 },
            { ...meme(0.82, "middle"), text: t.author, fontId: "georgia", font: fontCss("georgia"), size: 3, strokeWidth: 0, uppercase: false, maxWidth: 80, color: "#E8E8F0" },
          ]);
        } else setBlocks([meme(0.03, "top"), meme(0.97, "bottom")]);
        setSel(0);
      }}
      options={[
        { value: "photo", label: t.photo },
        { value: "quote", label: t.quote },
      ]}
    />
  );

  if (mode === "quote") return <QuoteCard locale={locale} modeSwitch={modeSwitch} blockTabs={blockTabs} textField={textField} fontField={fontField} blocks={blocks} editor={<BlockEditor b={cur} set={set} locale={locale} />} />;

  return (
    <div className="flex flex-col gap-3">
      {!file.prepared && <div>{modeSwitch}</div>}
      <SingleImageShell
        locale={locale}
        file={file}
        exp={exp}
        onExport={doExport}
        exportLabel={t.download}
        options={
          <>
            {modeSwitch}
            {blockTabs}
            {textField}
            {fontField}
          </>
        }
        more={<BlockEditor b={cur} set={set} locale={locale} />}
        figure={info ? `${info.srcWidth} × ${info.srcHeight} px` : "—"}
        extra={<p className="text-fg-3">{t.dragHint}</p>}
        stage={
          <ImageStage bitmap={bitmap} srcWidth={info?.srcWidth ?? 0} locale={locale} draw={draw}>
            {() => (
              <div
                className="absolute inset-0 cursor-move touch-none"
                onPointerDown={(e) => {
                  dragging.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  moveTo(e);
                }}
                onPointerMove={(e) => dragging.current && moveTo(e)}
                onPointerUp={() => (dragging.current = false)}
                onPointerCancel={() => (dragging.current = false)}
              />
            )}
          </ImageStage>
        }
      />
      {!file.prepared && <p className="text-sm text-fg-3">{s.dropHint}</p>}
    </div>
  );
}

function QuoteCard({
  locale,
  modeSwitch,
  blockTabs,
  textField,
  fontField,
  blocks,
  editor,
}: {
  locale: Locale;
  modeSwitch: React.ReactNode;
  blockTabs: React.ReactNode;
  textField: React.ReactNode;
  fontField: React.ReactNode;
  blocks: B[];
  editor: React.ReactNode;
}) {
  const t = T[locale];
  const s = S(locale);
  const getEngine = useEngine();
  const [card, setCard] = useState<(typeof CARDS)[number]["value"]>("1080x1350");
  const [bgKind, setBgKind] = useState<"solid" | "gradient">("gradient");
  const [bg1, setBg1] = useState("#1E2A78");
  const [bg2, setBg2] = useState("#8E2DE2");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const size = CARDS.find((c) => c.value === card)!;
  const gradient: [string, string, number] | undefined = bgKind === "gradient" ? [bg1, bg2, 135] : undefined;
  const blocksKey = JSON.stringify(blocks);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const k = 540 / size.w;
    c.width = Math.round(size.w * k);
    c.height = Math.round(size.h * k);
    const ctx = c.getContext("2d")!;
    paintBlank(ctx, c.width, c.height, bg1, gradient);
    for (const b of JSON.parse(blocksKey) as B[]) drawTextBlock(ctx, c.width, c.height, b);
  }, [size.w, size.h, bg1, bgKind, bg2, blocksKey]); // eslint-disable-line react-hooks/exhaustive-deps -- gradient derives from these

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await getEngine().run<ProcessResult>({
        type: "process",
        src: { kind: "blank", w: size.w, h: size.h, background: bg1, gradient, id: "quote" },
        ops: [{ t: "text", blocks }],
        out: { format: "png", quality: 100, background: bg1 },
      });
      const { downloadBlob } = await import("@/lib/clipboard");
      downloadBlob(toBlob(res), `quote-${size.w}x${size.h}.png`);
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
          {modeSwitch}
          {blockTabs}
          {textField}
          {fontField}
        </div>
        <details className="border-t border-line">
          <summary className="cursor-pointer px-4 py-2.5 text-sm text-fg-2 hover:text-fg">{locale === "ru" ? "Дополнительно" : "More options"}</summary>
          <div className="grid gap-4 px-4 pb-4 pt-1 sm:grid-cols-2">
            <Field label={t.format}>
              <Segmented label={t.format} value={card} onChange={setCard} options={CARDS.map((c) => ({ value: c.value, label: `${c.w}×${c.h}` }))} />
            </Field>
            <Field label={t.bg}>
              <Segmented label={t.bg} value={bgKind} onChange={setBgKind} options={[{ value: "gradient", label: t.gradient }, { value: "solid", label: t.solid }]} />
            </Field>
            <ColorField label={t.bg1} value={bg1} onChange={setBg1} locale={locale} />
            {bgKind === "gradient" && <ColorField label={t.bg2} value={bg2} onChange={setBg2} locale={locale} />}
            {editor}
          </div>
        </details>
      </div>
      <Panel className="overflow-hidden">
        <div className={`flex justify-center p-3 sm:p-4 ${checker}`}>
          <canvas ref={canvasRef} role="img" aria-label={blocks.map((b) => b.text).join(" ")} className="block h-auto max-h-[65vh] w-auto max-w-full rounded-[6px]" />
        </div>
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular text-2xl font-semibold tracking-tight text-fg" aria-live="polite">
            {size.w} × {size.h} px <span className="text-base font-normal text-fg-3">PNG</span>
          </p>
          <Button variant="primary" size="lg" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            {t.download}
          </Button>
        </div>
        {error ? <p className="border-t border-line px-4 py-2.5 text-[13px] text-err" role="alert">{errorText(locale, error)}</p> : null}
      </Panel>
      <p className="sr-only">{s.processingIn}</p>
    </div>
  );
}
