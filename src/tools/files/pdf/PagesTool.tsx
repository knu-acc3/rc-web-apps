"use client";

import { ArrowDownUp, Copy, FileOutput, RotateCcw, RotateCw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { formatPageRanges, parsePageRanges } from "./lib/ranges";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { PageGrid, moveItem, toggleSelection, type GridPage } from "./ui/PageGrid";
import { RangeField } from "./ui/RangeField";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { S, pagesCount } from "./ui/strings";
import { useJob, type Job } from "./ui/use-job";
import { usePdfFiles, type PdfFile } from "./ui/use-pdf-files";

export type PagesMode = "organize" | "delete" | "extract" | "rotate" | "reverse" | "blank";

const T = {
  ru: {
    selected: (n: number) => `Выбрано: ${n}`,
    selectAll: "Выбрать все",
    duplicate: "Дублировать",
    reverse: "Обратный порядок",
    save: "Сохранить PDF",
    deleteLabel: "Удалить страницы",
    extractLabel: "Извлечь страницы",
    remain: (n: number, total: number) => `Останется ${pagesCount("ru", n)} из ${formatNumber("ru", total)}`,
    cantDeleteAll: "Нельзя удалить все страницы — в PDF должна остаться хотя бы одна",
    deleteBtn: (n: number) => `Удалить ${pagesCount("ru", n)}`,
    extractInfo: (n: number) => (n ? `Будет извлечено: ${pagesCount("ru", n)}` : "Выберите страницы — нажмите на них или введите номера"),
    extractBtn: (n: number) => `Извлечь ${pagesCount("ru", n)}`,
    separate: "Каждую страницу отдельным файлом",
    angle: "Угол поворота",
    angles: { 90: "90° по часовой", 180: "180°", 270: "90° против часовой" } as Record<number, string>,
    rotateScope: (n: number, total: number) =>
      n ? `Повернутся выбранные страницы: ${formatNumber("ru", n)} из ${formatNumber("ru", total)}` : `Повернутся все ${pagesCount("ru", total)}. Чтобы повернуть только некоторые — выберите их.`,
    rotateBtn: "Повернуть PDF",
    organizeInfo: (n: number) => `В новом файле: ${pagesCount("ru", n)}`,
    reverseInfo: (n: number) => `Страницы пойдут с ${formatNumber("ru", n)}-й по 1-ю`,
    reverseBtn: "Сохранить в обратном порядке",
    scanning: (done: number, total: number) => `Проверяем страницы: ${formatNumber("ru", done)} из ${formatNumber("ru", total)}…`,
    blankFound: (n: number, total: number) => (n ? `Пустых страниц: ${formatNumber("ru", n)} из ${formatNumber("ru", total)}. Нажмите на страницу, чтобы оставить или убрать её.` : "Пустых страниц не найдено"),
    blankBtn: (n: number) => `Удалить пустые: ${pagesCount("ru", n)}`,
    sensitivity: "Что считать пустой страницей",
    levels: { strict: "Совсем белую", normal: "Почти белую", scan: "Скан с пятнами" },
  },
  en: {
    selected: (n: number) => `Selected: ${n}`,
    selectAll: "Select all",
    duplicate: "Duplicate",
    reverse: "Reverse order",
    save: "Save PDF",
    deleteLabel: "Pages to delete",
    extractLabel: "Pages to extract",
    remain: (n: number, total: number) => `${pagesCount("en", n)} of ${formatNumber("en", total)} will remain`,
    cantDeleteAll: "You can't delete every page — a PDF needs at least one",
    deleteBtn: (n: number) => `Delete ${pagesCount("en", n)}`,
    extractInfo: (n: number) => (n ? `${pagesCount("en", n)} will be extracted` : "Choose pages — click them or type their numbers"),
    extractBtn: (n: number) => `Extract ${pagesCount("en", n)}`,
    separate: "Each page as a separate file",
    angle: "Rotation",
    angles: { 90: "90° clockwise", 180: "180°", 270: "90° counter-clockwise" } as Record<number, string>,
    rotateScope: (n: number, total: number) =>
      n ? `Selected pages will rotate: ${formatNumber("en", n)} of ${formatNumber("en", total)}` : `All ${pagesCount("en", total)} will rotate. Select pages to rotate only some.`,
    rotateBtn: "Rotate PDF",
    organizeInfo: (n: number) => `${pagesCount("en", n)} in the new file`,
    reverseInfo: (n: number) => `Pages will run from ${formatNumber("en", n)} back to 1`,
    reverseBtn: "Save in reverse order",
    scanning: (done: number, total: number) => `Checking pages: ${formatNumber("en", done)} of ${formatNumber("en", total)}…`,
    blankFound: (n: number, total: number) => (n ? `Blank pages: ${formatNumber("en", n)} of ${formatNumber("en", total)}. Tap a page to keep or remove it.` : "No blank pages found"),
    blankBtn: (n: number) => `Remove blank: ${pagesCount("en", n)}`,
    sensitivity: "What counts as blank",
    levels: { strict: "Pure white", normal: "Nearly white", scan: "Scan with specks" },
  },
} as const;

export default function PagesTool({ locale, mode, angle = 90 }: { locale: Locale; mode: PagesMode; angle?: 90 | 180 | 270 }) {
  const pdf = usePdfFiles();
  const job = useJob(locale);
  const file = pdf.ready[0] ?? null;
  return (
    <div className="flex flex-col gap-4">
      <FilePanel locale={locale} pdf={pdf} disabled={job.running} />
      {/* Keyed by file: selection and arrangement never leak into a newly opened file. */}
      {file && <PagesBody key={file.id} locale={locale} mode={mode} angle0={angle} file={file} job={job} onClear={pdf.clear} />}
    </div>
  );
}

function PagesBody({ locale, mode, angle0, file, job, onClear }: { locale: Locale; mode: PagesMode; angle0: 90 | 180 | 270; file: PdfFile; job: Job; onClear: () => void }) {
  const t = T[locale];
  const s = S[locale];
  const count = file.pages;
  const fileId = file.id;

  // Organize: the user's arrangement (null until the first edit).
  const [edited, setEdited] = useState<{ file: string; pages: GridPage[] } | null>(null);
  const dup = useRef(0);
  const initial = useMemo(() => Array.from({ length: count }, (_, index) => ({ key: String(index), file: fileId, index, rotate: 0 })), [count, fileId]);
  const pages = edited && edited.file === fileId ? edited.pages : initial;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rangeText, setRangeText] = useState("");
  const anchor = useRef<string | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(angle0);
  const [separate, setSeparate] = useState(false);
  const [result, setResult] = useState<OutputItem[] | null>(null);
  // Blank pages: share of dark pixels per page (null while scanning), then a threshold picks the blank ones.
  const [ink, setInk] = useState<{ done: number; values: number[] } | null>(null);
  const [level, setLevel] = useState<BlankLevel>("normal");

  useEffect(() => {
    if (mode !== "blank" || !file.doc) return;
    let live = true;
    (async () => {
      const m = await import("./lib/pdfjs");
      const values: number[] = [];
      for (let i = 1; i <= count && live; i++) {
        values.push(await inkShare(m, file, i));
        if (live) setInk({ done: i, values: values.slice() });
      }
      if (live) setSelected(new Set(blankKeys(values, "normal")));
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [mode, file, count]);

  const setPages = (next: GridPage[]) => {
    setEdited({ file: fileId, pages: next });
    setResult(null);
  };
  const select = (next: Set<string>) => {
    setSelected(next);
    setResult(null);
    if (mode === "delete" || mode === "extract") setRangeText(formatPageRanges([...next].map((k) => Number(k) + 1).sort((a, b) => a - b)));
  };

  const rangeResult = rangeText.trim() ? parsePageRanges(rangeText, Math.max(1, count)) : null;
  const onRangeText = (v: string) => {
    setRangeText(v);
    setResult(null);
    const r = v.trim() ? parsePageRanges(v, Math.max(1, count)) : null;
    if (!v.trim()) setSelected(new Set());
    else if (r?.ok) setSelected(new Set(r.pages.map((p) => String(p - 1))));
  };

  const run = async (build: () => Parameters<typeof workerJob>[0], name: (i: number) => string) => {
    if (!file) return;
    setResult(null);
    const out = await job.start((ctx) => workerJob(build(), ctx));
    if (out) setResult(out.files.map((f, i) => ({ name: name(i), blob: pdfBlob(f.bytes) })));
  };
  const source = () => [{ bytes: file!.bytes!.slice(0), password: file!.password }];
  const base = file ? baseName(file.name) : "document";

  const reset = () => {
    setResult(null);
    setEdited(null);
    setSelected(new Set());
    setRangeText("");
    onClear();
    job.reset();
  };

  const rotated = (p: GridPage) => (mode === "rotate" && (selected.size === 0 || selected.has(p.key)) ? { ...p, rotate: angle } : p);
  const toggle = (key: string, extend: boolean) =>
    select(
      toggleSelection(
        selected,
        pages.map((p) => p.key),
        key,
        extend,
        anchor,
      ),
    );

  let info = "";
  let action: { label: string; icon: ReactNode; disabled: boolean; go: () => void } | null = null;
  if (file) {
    if (mode === "organize") {
      info = t.organizeInfo(pages.length);
      action = {
        label: t.save,
        icon: <Save aria-hidden />,
        disabled: !pages.length,
        go: () =>
          run(
            () => ({ type: "assemble", sources: source(), outputs: [{ name: "o", pages: pages.map((p) => ({ src: 0, index: p.index, rotate: p.rotate })) }], keepInfo: true }),
            () => `${base}-organized.pdf`,
          ),
      };
    } else if (mode === "delete") {
      const n = selected.size;
      info = n >= count ? t.cantDeleteAll : t.remain(count - n, count);
      action = {
        label: t.deleteBtn(n),
        icon: <Trash2 aria-hidden />,
        disabled: !n || n >= count,
        go: () =>
          run(
            () => ({ type: "assemble", sources: source(), outputs: [{ name: "d", pages: pages.filter((p) => !selected.has(p.key)).map((p) => ({ src: 0, index: p.index })) }], keepInfo: true }),
            () => `${base}-edited.pdf`,
          ),
      };
    } else if (mode === "extract") {
      const keep = rangeResult?.ok ? rangeResult.pages : [...selected].map((k) => Number(k) + 1).sort((a, b) => a - b);
      info = t.extractInfo(keep.length);
      action = {
        label: t.extractBtn(keep.length),
        icon: <FileOutput aria-hidden />,
        disabled: !keep.length,
        go: () =>
          run(
            () => ({
              type: "assemble",
              sources: source(),
              keepInfo: true,
              outputs: separate ? keep.map((p) => ({ name: String(p), pages: [{ src: 0, index: p - 1 }] })) : [{ name: "e", pages: keep.map((p) => ({ src: 0, index: p - 1 })) }],
            }),
            (i) => (separate ? `${base}-page-${keep[i]}.pdf` : `${base}-pages-${formatPageRanges(keep).replace(/, /g, "_")}.pdf`.slice(0, 120)),
          ),
      };
    } else if (mode === "reverse") {
      info = t.reverseInfo(count);
      action = {
        label: t.reverseBtn,
        icon: <ArrowDownUp aria-hidden />,
        disabled: count < 2,
        go: () =>
          run(
            () => ({ type: "assemble", sources: source(), outputs: [{ name: "r", pages: pages.slice().reverse().map((p) => ({ src: 0, index: p.index })) }], keepInfo: true }),
            () => `${base}-reversed.pdf`,
          ),
      };
    } else if (mode === "blank") {
      const n = selected.size;
      info = !ink || ink.done < count ? t.scanning(ink?.done ?? 0, count) : n >= count ? t.cantDeleteAll : t.blankFound(n, count);
      action = {
        label: t.blankBtn(n),
        icon: <Trash2 aria-hidden />,
        disabled: !n || n >= count || !ink || ink.done < count,
        go: () =>
          run(
            () => ({ type: "assemble", sources: source(), outputs: [{ name: "b", pages: pages.filter((p) => !selected.has(p.key)).map((p) => ({ src: 0, index: p.index })) }], keepInfo: true }),
            () => `${base}-no-blank-pages.pdf`,
          ),
      };
    } else {
      info = t.rotateScope(selected.size, count);
      const targets = pages.filter((p) => selected.size === 0 || selected.has(p.key));
      action = {
        label: t.rotateBtn,
        icon: <RotateCw aria-hidden />,
        disabled: !targets.length,
        go: () =>
          run(
            () => ({ type: "rotate", source: source()[0], rotations: targets.map((p) => ({ index: p.index, delta: angle })) }),
            () => `${base}-rotated.pdf`,
          ),
      };
    }
  }

  const toolbar =
    mode === "organize" ? (
      <OptionsRow className="items-center! gap-x-1!">
        <span className="mr-2 text-sm text-fg-2">{t.selected(selected.size)}</span>
        <Button
          size="sm"
          variant="ghost"
          disabled={!selected.size}
          aria-label={s.rotateLeft}
          title={s.rotateLeft}
          onClick={() => setPages(pages.map((p) => (selected.has(p.key) ? { ...p, rotate: (p.rotate + 270) % 360 } : p)))}
        >
          <RotateCcw aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!selected.size}
          aria-label={s.rotateRight}
          title={s.rotateRight}
          onClick={() => setPages(pages.map((p) => (selected.has(p.key) ? { ...p, rotate: (p.rotate + 90) % 360 } : p)))}
        >
          <RotateCw aria-hidden />
        </Button>
        <Button size="sm" variant="ghost" disabled={!selected.size} onClick={() => setPages(pages.flatMap((p) => (selected.has(p.key) ? [p, { ...p, key: `${p.index}:d${++dup.current}` }] : [p])))}>
          <Copy aria-hidden />
          <span className="max-sm:sr-only">{t.duplicate}</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!selected.size || selected.size >= pages.length}
          onClick={() => {
            setPages(pages.filter((p) => !selected.has(p.key)));
            setSelected(new Set());
          }}
        >
          <Trash2 aria-hidden />
          <span className="max-sm:sr-only">{s.deletePage}</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setPages(pages.slice().reverse())}>
          <ArrowDownUp aria-hidden />
          <span className="max-sm:sr-only">{t.reverse}</span>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSelected(selected.size ? new Set() : new Set(pages.map((p) => p.key)))}>
          {selected.size ? s.selectNone : t.selectAll}
        </Button>
      </OptionsRow>
    ) : mode === "reverse" ? null : mode === "blank" ? (
      <OptionsRow className="items-center!">
        <Segmented
          label={t.sensitivity}
          value={level}
          onChange={(v) => {
            setLevel(v);
            setResult(null);
            if (ink) setSelected(new Set(blankKeys(ink.values, v)));
          }}
          options={(["strict", "normal", "scan"] as const).map((v) => ({ value: v, label: t.levels[v] }))}
        />
      </OptionsRow>
    ) : mode === "rotate" ? (
      <OptionsRow className="items-center!">
        <Segmented
          label={t.angle}
          value={String(angle) as "90" | "180" | "270"}
          onChange={(v) => {
            setAngle(Number(v) as 90 | 180 | 270);
            setResult(null);
          }}
          options={[
            { value: "90", label: t.angles[90] },
            { value: "180", label: t.angles[180] },
            { value: "270", label: t.angles[270] },
          ]}
        />
        {selected.size > 0 && (
          <button type="button" className="text-sm text-accent hover:underline" onClick={() => setSelected(new Set())}>
            {s.selectNone}
          </button>
        )}
      </OptionsRow>
    ) : (
      <OptionsRow>
        <RangeField
          locale={locale}
          label={mode === "delete" ? t.deleteLabel : t.extractLabel}
          value={rangeText}
          onChange={onRangeText}
          result={rangeResult ?? { ok: true, segments: [], pages: [] }}
          pageCount={count}
          placeholder="2, 5-7"
          className="w-full sm:w-80"
        />
        {mode === "extract" && <Checkbox label={t.separate} checked={separate} onChange={(e) => setSeparate(e.target.checked)} className="pb-7" />}
      </OptionsRow>
    );

  if (!action) return null;
  return (
    <>
      <PageGrid
        locale={locale}
        pages={mode === "reverse" ? pages.slice().reverse() : pages.map(rotated)}
        thumbsOf={() => file.thumbs}
        label={(p) => formatNumber(locale, p.index + 1)}
        selected={selected}
        mark={mode === "delete" || mode === "blank" ? "delete" : "select"}
        onToggle={mode === "reverse" ? undefined : toggle}
        onMove={mode === "organize" ? (from, to) => setPages(moveItem(pages, from, to)) : undefined}
        onRotate={mode === "organize" ? (key, d) => setPages(pages.map((p) => (p.key === key ? { ...p, rotate: (p.rotate + d + 360) % 360 } : p))) : undefined}
        onDelete={mode === "organize" ? (key) => pages.length > 1 && setPages(pages.filter((p) => p.key !== key)) : mode === "delete" || mode === "blank" ? (key) => toggle(key, false) : undefined}
        toolbar={toolbar}
      />
      <p className="text-lg font-semibold text-fg">{info}</p>
      <PrimaryButton disabled={action.disabled || job.running} onClick={action.go}>
        {action.icon}
        {action.label}
      </PrimaryButton>
      <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
      {result && <ResultCard locale={locale} items={result} originalSize={result.length === 1 ? file.size : undefined} zipName={`${base}-pages.zip`} onReset={reset} />}
    </>
  );
}

type BlankLevel = "strict" | "normal" | "scan";
/** Largest share of dark pixels a page may have and still count as blank. */
const BLANK_LIMIT: Record<BlankLevel, number> = { strict: 0.0002, normal: 0.002, scan: 0.012 };

/** Keys (0-based indices) of pages whose ink share is under the level's limit. */
export function blankKeys(values: readonly number[], level: BlankLevel): string[] {
  return values.flatMap((v, i) => (v <= BLANK_LIMIT[level] ? [String(i)] : []));
}

/** Share of clearly non-white pixels on a page rendered small (≈ 300 px on the long side). */
async function inkShare(m: typeof import("./lib/pdfjs"), file: PdfFile, pageNo: number): Promise<number> {
  const page = await file.doc!.getPage(pageNo);
  const vp = page.getViewport({ scale: 1 });
  const canvas = await m.renderPage(page, Math.min(1, 300 / Math.max(vp.width, vp.height)));
  const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
  let dark = 0;
  for (let k = 0; k < data.length; k += 4) if (data[k + 3] > 16 && Math.min(data[k], data[k + 1], data[k + 2]) < 200) dark++;
  const share = dark / (data.length / 4);
  m.releaseCanvas(canvas);
  page.cleanup();
  return share;
}
