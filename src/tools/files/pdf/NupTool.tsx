"use client";

import { LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Field, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { PAPER, fitInto, nupCells, nupGrid, type PaperId } from "./lib/geometry";
import { PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";
import { Controls, Summary, Workspace } from "./ui/Workspace";

const NS = ["2", "4", "6", "9", "16"] as const;
type SheetId = "a4" | "a3" | "letter" | "source";
const MARGIN = 18;
const GAP = 10;

const T = {
  ru: {
    n: "Страниц на листе",
    sheet: "Лист",
    sheets: { a4: "A4", a3: "A3", letter: "Letter", source: "Как в оригинале" } as Record<SheetId, string>,
    orient: "Ориентация",
    orients: { auto: "Авто", portrait: "Книжная", landscape: "Альбомная" },
    order: "Порядок",
    orders: { rows: "По строкам (Z)", columns: "По столбцам (N)" },
    border: "Рамка вокруг страниц",
    sheetsResult: (pages: number, sheets: number) => `${count("ru", pages, ["страница", "страницы", "страниц"])} → ${count("ru", sheets, ["лист", "листа", "листов"])}`,
    scheme: (c: number, r: number, land: boolean, pct: number) => `Сетка ${c} × ${r}, лист ${land ? "альбомный" : "книжный"}, страницы уменьшены до ${pct}%`,
    go: "Создать PDF",
  },
  en: {
    n: "Pages per sheet",
    sheet: "Sheet",
    sheets: { a4: "A4", a3: "A3", letter: "Letter", source: "Same as original" } as Record<SheetId, string>,
    orient: "Orientation",
    orients: { auto: "Auto", portrait: "Portrait", landscape: "Landscape" },
    order: "Order",
    orders: { rows: "By rows (Z)", columns: "By columns (N)" },
    border: "Border around pages",
    sheetsResult: (pages: number, sheets: number) => `${count("en", pages, ["page", "pages"])} → ${count("en", sheets, ["sheet", "sheets"])}`,
    scheme: (c: number, r: number, land: boolean, pct: number) => `${c} × ${r} grid on a ${land ? "landscape" : "portrait"} sheet, pages scaled to ${pct}%`,
    go: "Create PDF",
  },
} as const;

export default function NupTool({ locale, n: n0 = 2 }: { locale: Locale; n?: number }) {
  const t = T[locale];
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const [n, setN] = useState<string>(String(n0));
  const [sheet, setSheet] = useState<PaperId | "source">("a4");
  const [orient, setOrient] = useState<"auto" | "portrait" | "landscape">("auto");
  const [order, setOrder] = useState<"rows" | "columns">("rows");
  const [border, setBorder] = useState(false);
  const [first, setFirst] = useState<{ file: string; width: number; height: number } | null>(null);
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const file = pdf.ready[0] ?? null;

  useEffect(() => {
    const doc = file?.doc;
    if (!doc || !file) return;
    let live = true;
    void doc.getPage(1).then((p) => {
      const vp = p.getViewport({ scale: 1 });
      if (live) setFirst({ file: file.id, width: vp.width, height: vp.height });
    });
    return () => {
      live = false;
    };
  }, [file]);

  const page = first && file && first.file === file.id ? first : { width: PAPER.a4[0], height: PAPER.a4[1] };
  const perSheet = Number(n);
  const sheetSize: readonly [number, number] = sheet === "source" ? [page.width, page.height] : PAPER[sheet];
  const grid = nupGrid({ n: perSheet, sheet: sheetSize, orientation: orient, page, margin: MARGIN, gap: GAP });
  const cells = nupCells(grid, MARGIN, GAP, order);
  const sheets = file ? Math.ceil(file.pages / perSheet) : 0;

  async function make() {
    if (!file) return;
    setResult(null);
    const out = await job.start((ctx) =>
      workerJob({ type: "nup", source: { bytes: file.bytes!.slice(0), password: file.password }, options: { n: perSheet, sheet, orientation: orient, margin: MARGIN, gap: GAP, order, border } }, ctx),
    );
    if (out) setResult([{ name: `${baseName(file.name)}-${perSheet}-up.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const change = <V,>(set: (v: V) => void) => (v: V) => {
    set(v);
    setResult(null);
  };

  const files = <FilePanel locale={locale} pdf={pdf} disabled={job.running} />;
  if (!file) return <div className="flex flex-col gap-4">{files}</div>;

  const landscape = grid.sheetWidth > grid.sheetHeight;
  const schematic = (
    <div className="flex flex-col items-center gap-4 rounded-[1.25rem] bg-surface-2 p-4 sm:p-6">
      <svg
        viewBox={`0 0 ${grid.sheetWidth} ${grid.sheetHeight}`}
        className={cn("h-auto rounded-[0.25rem] bg-white shadow-[0_1px_4px_rgb(0_0_0/0.18)] transition-[width] duration-200", landscape ? "w-full max-w-[34rem]" : "w-3/4 max-w-[24rem]")}
        aria-hidden
      >
        {cells.map((c, i) => {
          const f = fitInto(c, page.width, page.height);
          const x = f.x;
          const y = grid.sheetHeight - f.y - page.height * f.scale;
          return (
            <g key={i}>
              <rect x={x} y={y} width={page.width * f.scale} height={page.height * f.scale} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={Math.max(1, grid.sheetWidth / 300)} />
              <text x={x + (page.width * f.scale) / 2} y={y + (page.height * f.scale) / 2} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(page.width * f.scale, page.height * f.scale) * 0.4} fill="var(--accent)" fontWeight="600">
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-center text-sm text-fg-2">{t.scheme(grid.cols, grid.rows, landscape, Math.round(grid.scale * 100))}</p>
    </div>
  );

  return (
    <Workspace
      files={files}
      preview={schematic}
      controls={
        <Controls>
          <Field label={t.n}>
            <Segmented fill label={t.n} value={n} onChange={change(setN)} options={NS.map((v) => ({ value: v, label: v }))} />
          </Field>
          <Field label={t.sheet}>
            <Segmented label={t.sheet} value={sheet} onChange={change(setSheet)} options={(Object.keys(t.sheets) as SheetId[]).map((v) => ({ value: v, label: t.sheets[v] }))} />
          </Field>
          <Field label={t.orient}>
            <Segmented label={t.orient} value={orient} onChange={change(setOrient)} options={(["auto", "portrait", "landscape"] as const).map((v) => ({ value: v, label: t.orients[v] }))} />
          </Field>
          <Field label={t.order}>
            <Segmented label={t.order} value={order} onChange={change(setOrder)} options={(["rows", "columns"] as const).map((v) => ({ value: v, label: t.orders[v] }))} />
          </Field>
          <Switch label={t.border} checked={border} onChange={(e) => change(setBorder)(e.target.checked)} />
        </Controls>
      }
      action={
        <>
          <Summary size="xl">{t.sheetsResult(file.pages, sheets)}</Summary>
          <PrimaryButton disabled={job.running} done={!!result} onClick={make}>
            <LayoutGrid aria-hidden />
            {t.go}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              onReset={() => {
                setResult(null);
                pdf.clear();
                job.reset();
              }}
            />
          )}
        </>
      }
    />
  );
}
