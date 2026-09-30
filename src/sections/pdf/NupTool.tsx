"use client";

import { LayoutGrid } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { Checkbox, Field, Select } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { PAPER, fitInto, nupCells, nupGrid, type PaperId } from "./engine/geometry";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles } from "./ui/use-pdf-files";

const NS = ["2", "4", "6", "9", "16"] as const;
const MARGIN = 18;
const GAP = 10;

const T = {
  ru: {
    n: "Страниц на листе",
    sheet: "Лист",
    sheets: { a4: "A4", a3: "A3", letter: "Letter", source: "Как в оригинале" } as Record<string, string>,
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
    sheets: { a4: "A4", a3: "A3", letter: "Letter", source: "Same as original" } as Record<string, string>,
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
  const id = useId();
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

  // Schematic of one sheet, scaled into a 220 px box.
  const k = 220 / Math.max(grid.sheetWidth, grid.sheetHeight);
  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {file && (
        <>
          <OptionsRow>
            <Segmented label={t.n} value={n} onChange={change(setN)} options={NS.map((v) => ({ value: v, label: v }))} />
            <Field label={t.sheet} htmlFor={`${id}-s`} className="w-40">
              <Select id={`${id}-s`} value={sheet} onChange={(e) => change(setSheet)(e.target.value as PaperId | "source")}>
                {Object.entries(t.sheets).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.orient} htmlFor={`${id}-o`} className="w-36">
              <Select id={`${id}-o`} value={orient} onChange={(e) => change(setOrient)(e.target.value as typeof orient)}>
                {Object.entries(t.orients).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.order} htmlFor={`${id}-r`} className="w-44">
              <Select id={`${id}-r`} value={order} onChange={(e) => change(setOrder)(e.target.value as typeof order)}>
                {Object.entries(t.orders).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Checkbox label={t.border} checked={border} onChange={(e) => change(setBorder)(e.target.checked)} className="pb-2" />
          </OptionsRow>

          <div className="flex flex-col items-center gap-4 rounded-[12px] bg-surface-2 p-4 sm:flex-row">
            <svg width={grid.sheetWidth * k} height={grid.sheetHeight * k} viewBox={`0 0 ${grid.sheetWidth} ${grid.sheetHeight}`} className="shrink-0 rounded-[2px] bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.15)]" aria-hidden>
              {cells.map((c, i) => {
                const f = fitInto(c, page.width, page.height);
                const x = f.x;
                const y = grid.sheetHeight - f.y - page.height * f.scale;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={page.width * f.scale} height={page.height * f.scale} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={Math.max(1, 1.5 / k)} />
                    <text x={x + (page.width * f.scale) / 2} y={y + (page.height * f.scale) / 2} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(page.width * f.scale, page.height * f.scale) * 0.4} fill="var(--accent)" fontWeight="600">
                      {i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div>
              <p className="tabular text-2xl font-semibold text-fg">{t.sheetsResult(file.pages, sheets)}</p>
              <p className="mt-1 text-sm text-fg-2">{t.scheme(grid.cols, grid.rows, grid.sheetWidth > grid.sheetHeight, Math.round(grid.scale * 100))}</p>
            </div>
          </div>

          <PrimaryButton disabled={job.running} onClick={make}>
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
      )}
    </div>
  );
}
