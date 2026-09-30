"use client";

import { ChevronLeft, ChevronRight, Copy, PenLine, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Checkbox, Field, Input, Select } from "@/ui/field";
import { Dropzone } from "@/ui/dropzone";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { Tabs } from "@/ui/tabs";
import { PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";
import { DrawPad } from "./sign/DrawPad";
import { DraggableBox, PageStage, type Box } from "./sign/PageStage";
import { imageCanvas, trimToPng, typedCanvas, type SignatureImage } from "./sign/signature";

const FONTS = {
  script: '"Segoe Script", "Brush Script MT", "Snell Roundhand", "URW Chancery L", cursive',
  italic: 'italic Georgia, "Times New Roman", serif',
  plain: '"Onest", system-ui, sans-serif',
} as const;
const INK = { black: "#111111", blue: "#1a3fb0" } as const;

const T = {
  ru: {
    how: "Как создать подпись",
    tabs: { draw: "Нарисовать", type: "Напечатать", upload: "Загрузить" },
    pad: "Поле для подписи: рисуйте мышью, пальцем или стилусом",
    clear: "Очистить",
    name: "Ваше имя или инициалы",
    font: "Шрифт",
    fonts: { script: "Рукописный", italic: "Курсив", plain: "Обычный" },
    ink: "Цвет",
    inks: { black: "Чёрный", blue: "Синий" },
    upload: "Перетащите фото или скан подписи (PNG, JPG)",
    removeWhite: "Убрать белый фон",
    place: "Перетащите подпись на нужное место, угол — изменить размер",
    boxLabel: "Подпись на странице: стрелки — сдвинуть, плюс и минус — размер",
    prev: "Предыдущая страница",
    next: "Следующая страница",
    pageOf: (i: number, n: number) => `Страница ${formatNumber("ru", i)} из ${formatNumber("ru", n)}`,
    addHere: "Поставить на эту страницу",
    removeHere: "Убрать с этой страницы",
    allPages: "На все страницы",
    count: (n: number) => `Подпись будет на ${formatNumber("ru", n)} ${plural("ru", n, ["странице", "страницах", "страницах"])}`,
    go: "Подписать PDF",
    pageLabel: "Страница документа",
    notQes: "Это изображение подписи на странице, а не квалифицированная электронная подпись. Для госуслуг, торгов и налоговой нужна подпись с сертификатом: в Казахстане — ЭЦП НУЦ РК через NCALayer, в России — КЭП аккредитованного удостоверяющего центра.",
    needSig: "Сначала создайте подпись выше",
  },
  en: {
    how: "How to create a signature",
    tabs: { draw: "Draw", type: "Type", upload: "Upload" },
    pad: "Signature field: draw with a mouse, finger or stylus",
    clear: "Clear",
    name: "Your name or initials",
    font: "Font",
    fonts: { script: "Handwriting", italic: "Italic", plain: "Plain" },
    ink: "Colour",
    inks: { black: "Black", blue: "Blue" },
    upload: "Drop a photo or scan of your signature (PNG, JPG)",
    removeWhite: "Remove white background",
    place: "Drag the signature into place, use the corner to resize",
    boxLabel: "Signature on the page: arrows move it, plus and minus resize",
    prev: "Previous page",
    next: "Next page",
    pageOf: (i: number, n: number) => `Page ${formatNumber("en", i)} of ${formatNumber("en", n)}`,
    addHere: "Place on this page",
    removeHere: "Remove from this page",
    allPages: "On every page",
    count: (n: number) => `The signature will be on ${formatNumber("en", n)} ${n === 1 ? "page" : "pages"}`,
    go: "Sign PDF",
    pageLabel: "Document page",
    notQes: "This is an image of your signature on the page, not a qualified electronic signature: legally binding e-signatures require a certificate-based signing key.",
    needSig: "Create your signature above first",
  },
} as const;

type Mode = "draw" | "type" | "upload";

export default function SignTool({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [mode, setMode] = useState<Mode>("draw");
  const [ink, setInk] = useState<keyof typeof INK>("black");
  const [name, setName] = useState("");
  const [font, setFont] = useState<keyof typeof FONTS>("script");
  const [upload, setUpload] = useState<File | null>(null);
  const [removeWhite, setRemoveWhite] = useState(true);
  const [sig, setSig] = useState<SignatureImage | null>(null);
  // Placement belongs to one file: a newly opened file starts clean.
  const [placement, setPlacement] = useState<{ file: string; page: number; boxes: Record<number, Box> }>({ file: "", page: 0, boxes: {} });
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;
  const pages = file?.pages ?? 0;
  const pl = file && placement.file === file.id ? placement : { file: file?.id ?? "", page: 0, boxes: {} as Record<number, Box> };
  const page = pl.page;
  const boxes = pl.boxes;
  const setPage = (fn: (p: number) => number) => setPlacement({ ...pl, page: fn(pl.page) });
  const setBoxes = (fn: (b: Record<number, Box>) => Record<number, Box>) => {
    setPlacement({ ...pl, boxes: fn(pl.boxes) });
    setResult(null);
  };

  // Revoke the previous signature URL whenever it is replaced or on unmount.
  useEffect(() => () => {
    if (sig) URL.revokeObjectURL(sig.url);
  }, [sig]);

  // Typed and uploaded signatures re-render when their inputs change.
  const token = useRef(0);
  useEffect(() => {
    if (mode === "draw") return;
    const my = ++token.current;
    const timer = setTimeout(async () => {
      let canvas: HTMLCanvasElement | null = null;
      if (mode === "type" && name.trim()) canvas = typedCanvas(name.trim(), FONTS[font], INK[ink]);
      if (mode === "upload" && upload) canvas = await imageCanvas(upload, removeWhite).catch(() => null);
      const img = canvas ? await trimToPng(canvas) : null;
      if (canvas) canvas.width = canvas.height = 1;
      if (my === token.current) setSig(img);
      else if (img) URL.revokeObjectURL(img.url);
    }, 200);
    return () => clearTimeout(timer);
  }, [mode, name, font, ink, upload, removeWhite]);

  const aspect = sig ? sig.width / sig.height : 3;
  const current = boxes[page];
  const placed = Object.keys(boxes).length;
  const defaultBox: Box = { x: 0.55, y: 0.78, w: 0.3 };

  async function sign() {
    if (!file || !sig || !placed) return;
    setResult(null);
    const placements = await Promise.all(
      Object.entries(boxes).map(async ([k, b]) => {
        const p = await file.doc!.getPage(Number(k) + 1);
        const vp = p.getViewport({ scale: 1 });
        const h = (b.w * vp.width) / aspect / vp.height;
        return { page: Number(k), x: b.x, y: b.y, width: b.w, height: h };
      }),
    );
    const out = await job.start((ctx) => workerJob({ type: "sign", source: { bytes: file.bytes!.slice(0), password: file.password }, image: sig.png.slice(0), placements }, ctx));
    if (out) setResult([{ name: `${baseName(file.name)}-signed.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const changeMode = (m: Mode) => {
    setMode(m);
    setSig(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && (
        <>
          <section className="flex flex-col gap-3">
            <Tabs label={t.how} value={mode} onChange={changeMode} items={(["draw", "type", "upload"] as const).map((m) => ({ value: m, label: t.tabs[m] }))} />
            {mode === "draw" && <DrawPad color={INK[ink]} label={t.pad} clearLabel={t.clear} onStroke={async (c) => setSig(await trimToPng(c))} onClear={() => setSig(null)} />}
            {mode === "type" && (
              <div className="flex flex-col gap-3">
                <Field label={t.name} htmlFor={`${id}-n`}>
                  <Input id={`${id}-n`} size="lg" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </Field>
                <Field label={t.font} htmlFor={`${id}-f`} className="w-48">
                  <Select id={`${id}-f`} value={font} onChange={(e) => setFont(e.target.value as keyof typeof FONTS)}>
                    {(Object.keys(FONTS) as (keyof typeof FONTS)[]).map((f) => (
                      <option key={f} value={f}>
                        {t.fonts[f]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
            {mode === "upload" &&
              (upload ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 truncate text-sm text-fg">{upload.name}</span>
                  <Checkbox label={t.removeWhite} checked={removeWhite} onChange={(e) => setRemoveWhite(e.target.checked)} />
                  <Button size="sm" variant="ghost" onClick={() => setUpload(null)} aria-label={t.clear}>
                    <X aria-hidden />
                  </Button>
                </div>
              ) : (
                <Dropzone compact accept="image/png,image/jpeg,.png,.jpg,.jpeg" title={t.upload} onFiles={([f]) => setUpload(f)} />
              ))}
            {mode !== "upload" && <Segmented label={t.ink} value={ink} onChange={setInk} options={(["black", "blue"] as const).map((k) => ({ value: k, label: t.inks[k] }))} size="sm" />}
          </section>

          {sig ? (
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="ghost" aria-label={t.prev} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft />
                  </Button>
                  <span className="tabular min-w-32 text-center text-sm font-medium text-fg">{t.pageOf(page + 1, pages)}</span>
                  <Button size="icon-sm" variant="ghost" aria-label={t.next} disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {current ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setBoxes((b) => {
                          const next = { ...b };
                          delete next[page];
                          return next;
                        })
                      }
                    >
                      <X aria-hidden />
                      {t.removeHere}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setBoxes((b) => ({ ...b, [page]: Object.values(b)[0] ?? defaultBox }))}>
                      <Plus aria-hidden />
                      {t.addHere}
                    </Button>
                  )}
                  {pages > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => setBoxes(() => Object.fromEntries(Array.from({ length: pages }, (_, i) => [i, current ?? defaultBox])))}>
                      <Copy aria-hidden />
                      {t.allPages}
                    </Button>
                  )}
                </div>
              </div>
              <PageStage doc={file.doc!} index={page} label={`${t.pageLabel}: ${t.pageOf(page + 1, pages)}`}>
                {(stage) =>
                  current ? (
                    <DraggableBox
                      box={current}
                      aspect={aspect}
                      stage={stage}
                      url={sig.url}
                      label={t.boxLabel}
                      onChange={(b) => setBoxes((prev) => ({ ...prev, [page]: b }))}
                    />
                  ) : null
                }
              </PageStage>
              <p className="text-center text-sm text-fg-3">{current ? t.place : ""}</p>
            </section>
          ) : (
            <p className="text-sm text-fg-3">{t.needSig}</p>
          )}

          <Notice>{t.notQes}</Notice>
          {sig && placed > 0 && <p className="text-lg font-semibold text-fg">{t.count(placed)}</p>}
          <PrimaryButton disabled={!sig || !placed || job.running} onClick={sign}>
            <PenLine aria-hidden />
            {t.go}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              onReset={() => {
                setResult(null);
                setPlacement({ file: "", page: 0, boxes: {} });
                pdf.clear();
                job.reset();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
