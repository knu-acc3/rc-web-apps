"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { centeredAspectRect, roundRect, type Rect } from "./lib/geometry";
import { setJpegDpi } from "./lib/jpeg";
import { mmToPx, PHOTO_FORMATS, SHEETS, sheetLayout, type SheetId } from "./lib/passport";
import { processFile, toBlob } from "./lib/run";
import { baseName } from "./lib/source";
import type { Op } from "./lib/types";
import { useEngine } from "./ui/hooks";
import { ImageStage } from "./ui/ImageStage";
import { usePreviewBitmap } from "./ui/LiveStage";
import { RectEditor } from "./ui/RectEditor";
import { SingleImageShell, useExport, useSingleFile } from "./ui/SingleImage";

const T = {
  ru: {
    format: "Размер фото",
    sheet: "Что скачать",
    sheets: { single: "Одно фото", "10x15": "Лист 10×15 для печати", a4: "Лист A4" },
    lines: "Линии разметки",
    frame: "Рамка фото",
    download: "Скачать",
    guide: (a: number, b: number) => `Поставьте макушку на верхнюю линию, подбородок — между нижними: голова ${a}–${b} мм.`,
    noGuide: "Лицо по центру, голова занимает около 70–80 % высоты фото.",
    tips: "Фон однотонный светлый, взгляд в камеру, без улыбки с открытым ртом, без очков с бликами.",
    count: (n: number) => `${n} фото на листе`,
    gray: "Чёрно-белое",
  },
  en: {
    format: "Photo size",
    sheet: "Download as",
    sheets: { single: "One photo", "10x15": "4×6 in print sheet", a4: "A4 sheet" },
    lines: "Guide lines",
    frame: "Photo frame",
    download: "Download",
    guide: (a: number, b: number) => `Put the top of the head on the upper line and the chin between the lower ones: head ${a}–${b} mm.`,
    noGuide: "Face centred, the head taking about 70–80% of the photo height.",
    tips: "Plain light background, look at the camera, no open-mouth smile, no glasses glare.",
    count: (n: number) => `${n} photos per sheet`,
    gray: "Black and white",
  },
} as const;

const PRINT_DPI = 300;
const PHOTO_DPI = 600;

export default function PassportPhoto({ locale, format: format0 = "35x45" }: { locale: Locale; format?: string }) {
  const t = T[locale];
  const getEngine = useEngine();
  const file = useSingleFile();
  const exp = useExport();
  const { bitmap, info } = usePreviewBitmap(file.prepared ?? undefined, 1600);
  const [formatId, setFormatId] = useState(PHOTO_FORMATS.some((f) => f.id === format0) ? format0 : "35x45");
  const [sheet, setSheet] = useState<SheetId>("single");
  const [lines, setLines] = useState(true);
  const [gray, setGray] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const fmt = PHOTO_FORMATS.find((f) => f.id === formatId)!;
  const aspect = fmt.w / fmt.h;

  const W = info?.srcWidth ?? 0;
  const H = info?.srcHeight ?? 0;
  const key = W && H ? `${file.prepared?.id}:${W}x${H}:${formatId}` : "";
  const [rectFor, setRectFor] = useState("");
  if (key !== rectFor) {
    setRectFor(key);
    setRect(key ? centeredAspectRect(W, H, aspect, 0.85) : null);
  }

  const layout = sheet === "single" ? null : sheetLayout(SHEETS[sheet], fmt);

  const doExport = () => {
    const p = file.prepared;
    const r = rect && W ? roundRect(rect, W, H) : null;
    if (!p || !r) return;
    exp.run(async (signal, onProgress) => {
      const dpi = sheet === "single" ? PHOTO_DPI : PRINT_DPI;
      const ops: Op[] = [
        { t: "crop", rect: r },
        { t: "size", w: mmToPx(fmt.w, dpi), h: mmToPx(fmt.h, dpi) },
      ];
      if (gray) ops.push({ t: "filter", id: "grayscale", params: { amount: 100 } });
      const res = await processFile(
        getEngine(),
        p,
        ops,
        { format: "jpg", quality: 95, dpi, background: "#ffffff" },
        { signal, onProgress: (v) => onProgress(sheet === "single" ? v : v * 0.7) },
      );
      const name = `${baseName(p.file.name)}-${formatId}`;
      if (sheet === "single") return { blob: toBlob(res), name: `${name}.jpg` };

      // Tile copies on the sheet with light cut lines.
      const s = SHEETS[sheet];
      const canvas = document.createElement("canvas");
      canvas.width = mmToPx(s.w, PRINT_DPI);
      canvas.height = mmToPx(s.h, PRINT_DPI);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const img = await createImageBitmap(toBlob(res));
      const pw = mmToPx(fmt.w, PRINT_DPI);
      const ph = mmToPx(fmt.h, PRINT_DPI);
      ctx.strokeStyle = "#c8c8c8";
      ctx.lineWidth = 1;
      for (const c of layout!.cells) {
        const x = mmToPx(c.x, PRINT_DPI);
        const y = mmToPx(c.y, PRINT_DPI);
        ctx.drawImage(img, x, y, pw, ph);
        ctx.strokeRect(x - 0.5, y - 0.5, pw + 1, ph + 1);
      }
      img.close();
      const blob = await new Promise<Blob>((ok, bad) => canvas.toBlob((b) => (b ? ok(b) : bad(new Error("toBlob"))), "image/jpeg", 0.95));
      const bytes = setJpegDpi(new Uint8Array(await blob.arrayBuffer()), PRINT_DPI);
      onProgress(1);
      return { blob: new Blob([bytes.slice()], { type: "image/jpeg" }), name: `${name}-${sheet}.jpg` };
    });
  };

  const options = (
    <>
      <Field label={t.format}>
        <div role="radiogroup" aria-label={t.format} className="flex flex-col gap-1.5">
          {PHOTO_FORMATS.map((f) => {
            const [size, use] = f[locale].split(" — ");
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={f.id === formatId}
                onClick={() => setFormatId(f.id)}
                className="chip h-auto w-full flex-col items-start gap-0 whitespace-normal py-2 text-left"
              >
                <span className="font-semibold">{size}</span>
                {use && <span className="text-[0.8125rem] font-normal opacity-80">{use}</span>}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label={t.sheet}>
        <Segmented
          label={t.sheet}
          value={sheet}
          onChange={setSheet}
          options={(["single", "10x15", "a4"] as const).map((v) => ({ value: v, label: t.sheets[v] }))}
        />
      </Field>
    </>
  );

  const more = (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      <Switch label={t.lines} checked={lines} onChange={(e) => setLines(e.target.checked)} />
      <Switch label={t.gray} checked={gray} onChange={(e) => setGray(e.target.checked)} />
    </div>
  );

  const pxW = mmToPx(fmt.w, sheet === "single" ? PHOTO_DPI : PRINT_DPI);
  const pxH = mmToPx(fmt.h, sheet === "single" ? PHOTO_DPI : PRINT_DPI);

  return (
    <SingleImageShell
      locale={locale}
      file={file}
      options={options}
      more={more}
      exp={exp}
      exportLabel={t.download}
      onExport={doExport}
      figure={layout ? t.count(layout.cells.length) : `${fmt.w}×${fmt.h} ${locale === "ru" ? "мм" : "mm"} · ${pxW}×${pxH} px`}
      extra={
        <>
          <p className="text-fg-2">{fmt.head ? t.guide(fmt.head[0], fmt.head[1]) : t.noGuide}</p>
          <p className="text-fg-3">{t.tips}</p>
        </>
      }
      stage={
        <ImageStage bitmap={bitmap} srcWidth={W} locale={locale}>
          {(factor) =>
            rect && (
              <>
                <RectEditor rect={rect} onChange={setRect} imgW={W} imgH={H} factor={factor} aspect={aspect} locale={locale} label={t.frame} />
                {lines && <Guides rect={rect} factor={factor} fmt={fmt} />}
              </>
            )
          }
        </ImageStage>
      }
    />
  );
}

/** Head guides inside the frame: crown line, chin band and the vertical centre line. */
function Guides({ rect, factor, fmt }: { rect: Rect; factor: number; fmt: (typeof PHOTO_FORMATS)[number] }) {
  const pct = (mm: number) => `${(mm / fmt.h) * 100}%`;
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: rect.x * factor, top: rect.y * factor, width: rect.w * factor, height: rect.h * factor }}
      aria-hidden
    >
      <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-white/70 mix-blend-difference" />
      {fmt.head && fmt.top !== undefined ? (
        <>
          <div className="absolute inset-x-0 border-t-2 border-[#22c55e]" style={{ top: pct(fmt.top) }} />
          <div className="absolute inset-x-0 bg-[#22c55e]/25" style={{ top: pct(fmt.top + fmt.head[0]), height: pct(fmt.head[1] - fmt.head[0]) }} />
          <div className="absolute inset-x-0 border-t border-dashed border-[#22c55e]" style={{ top: pct(fmt.top + fmt.head[0]) }} />
          <div className="absolute inset-x-0 border-t-2 border-[#22c55e]" style={{ top: pct(fmt.top + fmt.head[1]) }} />
        </>
      ) : (
        <div className="absolute left-[18%] right-[18%] top-[8%] bottom-[14%] rounded-[50%] border-2 border-dashed border-[#22c55e]" />
      )}
    </div>
  );
}
