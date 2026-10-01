"use client";

import { Download, Loader2, RotateCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Switch } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { centeredAspectRect, roundRect, type Rect } from "./lib/geometry";
import { setJpegDpi } from "./lib/jpeg";
import { mmToPx } from "./lib/passport";
import { processFile, toBlob } from "./lib/run";
import type { Op } from "./lib/types";
import { IMAGE_ACCEPT } from "./lib/detect";
import { useEngine } from "./ui/hooks";
import { ImageStage } from "./ui/ImageStage";
import { usePreviewBitmap } from "./ui/LiveStage";
import { RectEditor } from "./ui/RectEditor";
import { useSingleFile } from "./ui/SingleImage";

type Doc = "id" | "passport";
/** Real sizes, landscape, mm: ID-1 cards (ID cards, driving licences, bank cards) and a passport spread. */
const DOCS: Record<Doc, { w: number; h: number }> = { id: { w: 85.6, h: 54 }, passport: { w: 176, h: 125 } };
const DPI = 300;
const A4 = { w: 210, h: 297 };

const T = {
  ru: {
    doc: "Документ",
    docs: { id: "Удостоверение, ID-карта, права", passport: "Паспорт (разворот)" },
    sides: { id: ["Лицевая сторона", "Обратная сторона"], passport: ["Разворот с фото", "Прописка или другой разворот"] },
    drop: "Перетащите фото или скан сюда или нажмите, чтобы выбрать",
    frame: "Рамка документа",
    turn: "Повернуть",
    remove: "Убрать",
    gray: "Чёрно-белая копия",
    format: "Формат",
    pdf: "PDF (A4)",
    jpg: "JPG (A4)",
    make: "Скачать копию на одном листе",
    busy: "Собираем лист…",
    hint: "Подгоните рамку по краям документа. Обе стороны лягут на лист A4 в натуральную величину — печатайте без масштабирования.",
    needOne: "Добавьте хотя бы одну сторону.",
  },
  en: {
    doc: "Document",
    docs: { id: "ID card, driving licence", passport: "Passport (spread)" },
    sides: { id: ["Front", "Back"], passport: ["Photo page spread", "Another spread"] },
    drop: "Drop a photo or scan here or click to choose",
    frame: "Document frame",
    turn: "Rotate",
    remove: "Remove",
    gray: "Black-and-white copy",
    format: "Format",
    pdf: "PDF (A4)",
    jpg: "JPG (A4)",
    make: "Download the one-page copy",
    busy: "Building the sheet…",
    hint: "Fit the frame to the document's edges. Both sides go onto an A4 sheet at actual size — print without scaling.",
    needOne: "Add at least one side.",
  },
} as const;

interface SideState {
  rect: Rect | null;
  /** Clockwise quarter turns that make the document upright. */
  rot: number;
  /** Source size, px. */
  w: number;
  h: number;
}

const EMPTY: SideState = { rect: null, rot: 0, w: 0, h: 0 };

/** The upright document as it will be printed: the framed part of the preview, turned. */
function ResultThumb({ bitmap, scale, state, doc }: { bitmap: ImageBitmap | null; scale: number; state: SideState; doc: Doc }) {
  const d = DOCS[doc];
  const draw = (c: HTMLCanvasElement | null) => {
    if (!c || !bitmap || !state.rect) return;
    const W = 240;
    const H = Math.round((W * d.h) / d.w);
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    const r = state.rect;
    const odd = state.rot % 2 === 1;
    ctx.translate(W / 2, H / 2);
    ctx.rotate((state.rot * Math.PI) / 2);
    const dw = odd ? H : W;
    const dh = odd ? W : H;
    ctx.drawImage(bitmap, r.x * scale, r.y * scale, r.w * scale, r.h * scale, -dw / 2, -dh / 2, dw, dh);
  };
  return <canvas ref={draw} className="h-auto w-28 rounded-[0.25rem] border border-line-strong bg-white" aria-hidden />;
}

function Side({ locale, label, doc, file, onState }: { locale: Locale; label: string; doc: Doc; file: ReturnType<typeof useSingleFile>; onState: (s: SideState) => void }) {
  const t = T[locale];
  const { bitmap, info } = usePreviewBitmap(file.prepared ?? undefined, 1600);
  const d = DOCS[doc];
  const W = info?.srcWidth ?? 0;
  const H = info?.srcHeight ?? 0;
  const aspectOf = (rot: number) => (rot % 2 ? d.h / d.w : d.w / d.h);
  const [state, setState] = useState<SideState>(EMPTY);
  const key = W && H ? `${file.prepared?.id}:${W}x${H}:${doc}` : "";
  const [rectFor, setRectFor] = useState("");
  if (key !== rectFor) {
    setRectFor(key);
    // A portrait photo of a landscape card: start with a portrait frame, turned clockwise.
    const rot = W && H > W ? 1 : 0;
    setState(key ? { rot, w: W, h: H, rect: centeredAspectRect(W, H, aspectOf(rot), 0.9) } : EMPTY);
  }
  // The sheet is built by the parent: keep it informed.
  useEffect(() => onState(state), [state, onState]);
  const turn = () => {
    const rot = (state.rot + 1) % 4;
    setState({ ...state, rot, rect: rot % 2 === state.rot % 2 ? state.rect : centeredAspectRect(W, H, aspectOf(rot), 0.9) });
  };

  return (
    <Panel className="flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{label}</h3>
        {file.prepared && (
          <Button size="icon-sm" variant="ghost" aria-label={t.remove} title={t.remove} onClick={file.reset}>
            <X aria-hidden />
          </Button>
        )}
      </div>
      {file.prepared ? (
        <>
          <ImageStage bitmap={bitmap} srcWidth={W} locale={locale} maxHeightVh={45}>
            {(factor) => state.rect && <RectEditor rect={state.rect} onChange={(r) => setState({ ...state, rect: r })} imgW={W} imgH={H} factor={factor} aspect={aspectOf(state.rot)} locale={locale} label={t.frame} />}
          </ImageStage>
          <div className="flex items-center gap-3">
            <ResultThumb bitmap={bitmap} scale={info?.scale ?? 1} state={state} doc={doc} />
            <Button variant="outline" size="sm" onClick={turn}>
              <RotateCw aria-hidden />
              {t.turn}
            </Button>
          </div>
        </>
      ) : (
        <Dropzone onFiles={(f) => f[0] && file.load(f[0])} accept={IMAGE_ACCEPT} title={t.drop} compact />
      )}
      {file.loading && <Loader2 className="size-4 animate-spin text-fg-3" aria-hidden />}
    </Panel>
  );
}

export default function IdCopy({ locale, doc: doc0 = "id" }: { locale: Locale; doc?: Doc }) {
  const t = T[locale];
  const getEngine = useEngine();
  const [doc, setDoc] = useState<Doc>(doc0);
  const front = useSingleFile();
  const back = useSingleFile();
  const [a, setA] = useState<SideState>(EMPTY);
  const [b, setB] = useState<SideState>(EMPTY);
  const [gray, setGray] = useState(true);
  const [format, setFormat] = useState<"pdf" | "jpg">("pdf");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function make() {
    const sides = [
      { f: front, s: a },
      { f: back, s: b },
    ].filter((x) => x.f.prepared && x.s.rect);
    if (!sides.length) {
      setError(t.needOne);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const d = DOCS[doc];
      const canvas = document.createElement("canvas");
      canvas.width = mmToPx(A4.w, DPI);
      canvas.height = mmToPx(A4.h, DPI);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const gap = 15;
      const total = sides.length * d.h + (sides.length - 1) * gap;
      let y = Math.max(15, (A4.h - total) / 2 - 40); // nearer the top, like a photocopy
      for (const { f, s } of sides) {
        const p = f.prepared!;
        const r = roundRect(s.rect!, s.w, s.h);
        const odd = s.rot % 2 === 1;
        const ops: Op[] = [{ t: "crop", rect: r }, { t: "size", w: mmToPx(odd ? d.h : d.w, DPI), h: mmToPx(odd ? d.w : d.h, DPI) }];
        if (s.rot) ops.push({ t: "orient", flip: false, rot: s.rot });
        if (gray) ops.push({ t: "filter", id: "grayscale", params: { amount: 100 } });
        const res = await processFile(getEngine(), p, ops, { format: "jpg", quality: 92, background: "#ffffff" });
        const bmp = await createImageBitmap(toBlob(res));
        const x = mmToPx((A4.w - d.w) / 2, DPI);
        ctx.drawImage(bmp, x, mmToPx(y, DPI), mmToPx(d.w, DPI), mmToPx(d.h, DPI));
        bmp.close();
        y += d.h + gap;
      }
      const jpeg = await new Promise<Blob>((ok, bad) => canvas.toBlob((bl) => (bl ? ok(bl) : bad(new Error("toBlob"))), "image/jpeg", 0.9));
      const bytes = setJpegDpi(new Uint8Array(await jpeg.arrayBuffer()), DPI);
      const name = doc === "id" ? "id-card-copy" : "passport-copy";
      if (format === "jpg") downloadBlob(new Blob([bytes.slice()], { type: "image/jpeg" }), `${name}.jpg`);
      else {
        const { PDFDocument } = await import("@cantoo/pdf-lib");
        const pdf = await PDFDocument.create();
        const page = pdf.addPage([(A4.w / 25.4) * 72, (A4.h / 25.4) * 72]);
        const img = await pdf.embedJpg(bytes);
        page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
        downloadBlob(new Blob([(await pdf.save()).slice()], { type: "application/pdf" }), `${name}.pdf`);
      }
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Segmented wrap label={t.doc} value={doc} onChange={setDoc} options={(["id", "passport"] as const).map((v) => ({ value: v, label: t.docs[v] }))} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Side locale={locale} label={t.sides[doc][0]} doc={doc} file={front} onState={setA} />
        <Side locale={locale} label={t.sides[doc][1]} doc={doc} file={back} onState={setB} />
      </div>
      <p className="text-sm text-fg-3">{t.hint}</p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Segmented label={t.format} value={format} onChange={setFormat} options={[{ value: "pdf", label: t.pdf }, { value: "jpg", label: t.jpg }]} />
        <Switch label={t.gray} checked={gray} onChange={(e) => setGray(e.target.checked)} />
      </div>
      <Button size="lg" variant="primary" className={cn("w-full sm:w-auto sm:self-start")} disabled={busy || (!front.prepared && !back.prepared)} onClick={make}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
        {busy ? t.busy : t.make}
      </Button>
      {error && <Notice tone="err">{error}</Notice>}
    </div>
  );
}
