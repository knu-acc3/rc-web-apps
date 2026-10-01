"use client";

import { ChevronLeft, ChevronRight, Eraser, GripVertical, Save, Type, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { Field, Select } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { loadUnicodeFont } from "./lib/client";
import { EDIT_LINE_HEIGHT, type EditItem } from "./lib/edit-types";
import { PageStage } from "./ui/PageStage";
import { Caption, PrimaryButton, workerJob } from "./ui/bits";
import { FilePanel } from "./ui/FilePanel";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { useJob } from "./ui/use-job";
import { usePdfFiles, type PdfFile } from "./ui/use-pdf-files";
import { Controls, Summary, Workspace } from "./ui/Workspace";

const T = {
  ru: {
    tool: "Инструмент",
    text: "Текст",
    box: "Замазать",
    size: "Размер",
    color: "Цвет",
    colors: { black: "Чёрный", blue: "Синий", red: "Красный", white: "Белый" },
    page: (n: number, total: number) => `Страница ${n} из ${total}`,
    prev: "Предыдущая страница",
    next: "Следующая страница",
    hintText: "Нажмите на страницу и печатайте; ⋮ — передвинуть",
    hintBox: "Проведите по странице, чтобы закрасить лишнее",
    boxNote: "Закрашенный текст остаётся в файле под прямоугольником — для персональных данных этого мало.",
    placeholder: "Текст",
    remove: "Удалить",
    move: "Передвинуть",
    save: "Сохранить PDF",
    count: (n: number) => (n ? `Добавлено элементов: ${n}` : "Пока ничего не добавлено"),
    stage: (n: number) => `Страница ${n}`,
    resize: "Изменить размер",
  },
  en: {
    tool: "Tool",
    text: "Text",
    box: "White-out",
    size: "Size",
    color: "Colour",
    colors: { black: "Black", blue: "Blue", red: "Red", white: "White" },
    page: (n: number, total: number) => `Page ${n} of ${total}`,
    prev: "Previous page",
    next: "Next page",
    hintText: "Tap the page and type; drag ⋮ to move",
    hintBox: "Drag across the page to cover something",
    boxNote: "Covered text stays in the file under the box — not enough for personal data.",
    placeholder: "Text",
    remove: "Remove",
    move: "Move",
    save: "Save PDF",
    count: (n: number) => (n ? `Items added: ${n}` : "Nothing added yet"),
    stage: (n: number) => `Page ${n}`,
    resize: "Resize",
  },
} as const;

const COLORS = { black: [0, 0, 0], blue: [0.1, 0.31, 0.84], red: [0.84, 0.13, 0.13], white: [1, 1, 1] } as const;
type ColorId = keyof typeof COLORS;
const SIZES = [8, 10, 12, 14, 18, 24, 36] as const;
const FONT_FAMILY = "PdfEditNoto, 'Noto Sans', sans-serif";

const css = (c: readonly number[]) => `rgb(${c.map((v) => Math.round(v * 255)).join(" ")})`;

/** Load the same font the PDF will get, so the boxes on screen match the result. */
function useEditorFont() {
  useEffect(() => {
    if (typeof FontFace === "undefined" || [...document.fonts].some((f) => f.family === "PdfEditNoto")) return;
    loadUnicodeFont()
      .then((buf) => new FontFace("PdfEditNoto", buf.slice(0)).load())
      .then((f) => document.fonts.add(f))
      .catch(() => {});
  }, []);
}

export default function EditTool({ locale, tool = "text" }: { locale: Locale; tool?: "text" | "box" }) {
  const pdf = usePdfFiles({ thumbnails: false });
  const job = useJob(locale);
  const file = pdf.ready[0] ?? null;
  const files = <FilePanel locale={locale} pdf={pdf} disabled={job.running} />;
  return <div className="flex flex-col gap-4">{file?.doc ? <Editor key={file.id} locale={locale} file={file} job={job} tool0={tool} onClear={pdf.clear} files={files} /> : files}</div>;
}

function Editor({ locale, file, job, tool0, onClear, files }: { locale: Locale; file: PdfFile; job: ReturnType<typeof useJob>; tool0: "text" | "box"; onClear: () => void; files: ReactNode }) {
  const t = T[locale];
  const uid = useId();
  useEditorFont(); // only now: the font (~500 KB) isn't needed until a PDF is open
  const [page, setPage] = useState(0);
  const [tool, setTool] = useState<"text" | "box">(tool0);
  const [items, setItems] = useState<EditItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [size, setSize] = useState<number>(14);
  const [color, setColor] = useState<ColorId>("black");
  const [pt, setPt] = useState<{ page: number; width: number } | null>(null);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const focusNew = useRef<number | null>(null);
  const count = file.pages;

  // Page width in points: converts font sizes in pt to screen pixels.
  useEffect(() => {
    let live = true;
    import("./lib/pdfjs").then(async (m) => {
      const s = await m.pageSize(file.doc!, page);
      if (live) setPt({ page, width: s.width });
    });
    return () => {
      live = false;
    };
  }, [file.doc, page]);

  const update = (i: number, patch: Partial<EditItem>) => {
    setResult(null);
    setItems((list) => list.map((it, k) => (k === i ? ({ ...it, ...patch } as EditItem) : it)));
  };
  const remove = (i: number) => {
    setResult(null);
    setItems((list) => list.filter((_, k) => k !== i));
    setSelected(null);
  };
  const choose = (i: number | null) => {
    setSelected(i);
    const it = i === null ? null : items[i];
    if (it?.kind === "text") {
      setSize(it.size);
      const id = (Object.keys(COLORS) as ColorId[]).find((k) => COLORS[k].every((v, j) => v === it.color[j]));
      if (id) setColor(id);
    }
  };
  const setStyle = (patch: { size?: number; color?: ColorId }) => {
    if (patch.size) setSize(patch.size);
    if (patch.color) setColor(patch.color);
    if (selected !== null && items[selected]) {
      const it = items[selected];
      update(selected, {
        ...(patch.size && it.kind === "text" ? { size: patch.size } : {}),
        ...(patch.color ? { color: [...COLORS[patch.color]] as [number, number, number] } : {}),
      });
    }
  };

  async function save() {
    setResult(null);
    const clean = items.filter((it) => it.kind === "box" || it.text.trim());
    const out = await job.start(async (ctx) =>
      workerJob({ type: "edit", source: { bytes: file.bytes!.slice(0), password: file.password }, items: clean, font: (await loadUnicodeFont()).slice(0) }, ctx),
    );
    if (out) setResult([{ name: `${baseName(file.name)}-edited.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const frac = (e: ReactPointerEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };

  useEffect(() => {
    if (focusNew.current === null) return;
    const index = focusNew.current;
    focusNew.current = null;
    // After the click has finished: the browser would otherwise move focus to the page layer.
    requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>(`[data-edit-item="${index}"] textarea`)?.focus({ preventScroll: true }));
  });

  const controls = (
    <Controls>
      <Segmented
        fill
        label={t.tool}
        value={tool}
        onChange={(v) => {
          setTool(v);
          setSelected(null);
        }}
        options={[
          { value: "text", label: t.text, icon: <Type className="size-4" aria-hidden /> },
          { value: "box", label: t.box, icon: <Eraser className="size-4" aria-hidden /> },
        ]}
      />
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        {tool === "text" && (
          <Field label={t.size} htmlFor={`${uid}-size`}>
            <Select id={`${uid}-size`} value={size} onChange={(e) => setStyle({ size: Number(e.target.value) })}>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} pt
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div>
          <Caption>{t.color}</Caption>
          <div role="group" aria-label={t.color} className="flex h-10 items-center gap-2 pointer-coarse:h-11">
            {(Object.keys(COLORS) as ColorId[]).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={color === id}
                aria-label={t.colors[id]}
                title={t.colors[id]}
                onClick={() => setStyle({ color: id })}
                className={cn("size-8 rounded-full border border-line-strong transition-transform duration-150 motion-safe:active:scale-90 pointer-coarse:size-10", color === id && "ring-3 ring-accent ring-offset-2 ring-offset-surface")}
                style={{ background: css(COLORS[id]) }}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-fg-3">{tool === "text" ? t.hintText : t.hintBox}</p>
      {tool === "box" && <p className="text-sm text-warn">{t.boxNote}</p>}
    </Controls>
  );

  const stage = (
    <section className="flex min-w-0 flex-col gap-3 rounded-[1.25rem] bg-surface-2 p-3 sm:p-4">
      {count > 1 && (
        <div className="flex items-center justify-center gap-1">
          <IconButton label={t.prev} icon={<ChevronLeft aria-hidden />} onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} />
          <span className="tabular min-w-28 text-center text-sm font-medium text-fg">{t.page(page + 1, count)}</span>
          <IconButton label={t.next} icon={<ChevronRight aria-hidden />} onClick={() => setPage((p) => Math.min(count - 1, p + 1))} disabled={page >= count - 1} />
        </div>
      )}
      <PageStage locale={locale} doc={file.doc!} index={page} label={t.stage(page + 1)}>
        {(stage) => {
          const k = pt && pt.page === page ? stage.width / pt.width : null; // screen px per pt
          return (
            <div
              className={cn("absolute inset-0 touch-none", tool === "text" ? "cursor-text" : "cursor-crosshair")}
              onPointerDown={(e) => {
                if (e.target !== e.currentTarget) return;
                const p = frac(e, e.currentTarget);
                if (tool === "box") {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
                  return;
                }
                e.preventDefault(); // keep focus where we put it
                if (selected !== null) {
                  (document.activeElement as HTMLElement | null)?.blur();
                  setSelected(null);
                  return;
                }
                const lineFrac = k ? (size * EDIT_LINE_HEIGHT * k) / stage.height : 0.02;
                focusNew.current = items.length;
                setResult(null);
                setItems((list) => [
                  ...list,
                  { kind: "text", page, x: p.x, y: Math.max(0, p.y - lineFrac / 2), text: "", size, color: [...COLORS[color]] as [number, number, number] },
                ]);
                setSelected(items.length);
              }}
              onPointerMove={(e) => {
                if (!draft) return;
                const p = frac(e, e.currentTarget);
                setDraft({ ...draft, x1: p.x, y1: p.y });
              }}
              onPointerUp={() => {
                if (!draft) return;
                const x = Math.min(draft.x0, draft.x1);
                const y = Math.min(draft.y0, draft.y1);
                const w = Math.abs(draft.x1 - draft.x0);
                const h = Math.abs(draft.y1 - draft.y0);
                setDraft(null);
                if (w < 0.01 || h < 0.005) return;
                setResult(null);
                setItems((list) => [...list, { kind: "box", page, x, y, w, h, color: [...COLORS[color === "black" ? "white" : color]] as [number, number, number] }]);
              }}
            >
              {draft && (
                <div
                  className="pointer-events-none absolute border-2 border-dashed border-accent bg-white/80"
                  style={{
                    left: `${Math.min(draft.x0, draft.x1) * 100}%`,
                    top: `${Math.min(draft.y0, draft.y1) * 100}%`,
                    width: `${Math.abs(draft.x1 - draft.x0) * 100}%`,
                    height: `${Math.abs(draft.y1 - draft.y0) * 100}%`,
                  }}
                />
              )}
              {items.map((it, i) =>
                it.page !== page ? null : it.kind === "box" ? (
                  <BoxView key={i} item={it} selected={selected === i} stage={stage} t={t} onSelect={() => choose(i)} onChange={(p) => update(i, p)} onRemove={() => remove(i)} />
                ) : (
                  k && (
                    <TextView
                      key={i}
                      index={i}
                      item={it}
                      k={k}
                      selected={selected === i}
                      stage={stage}
                      t={t}
                      onSelect={() => choose(i)}
                      onChange={(p) => update(i, p)}
                      onRemove={() => remove(i)}
                    />
                  )
                ),
              )}
            </div>
          );
        }}
      </PageStage>
    </section>
  );

  const ready = items.filter((it) => it.kind === "box" || it.text.trim()).length;
  return (
    <Workspace
      files={files}
      controls={controls}
      preview={stage}
      previewFirst={false}
      action={
        <>
          <Summary size="md" quiet>{t.count(ready)}</Summary>
          <PrimaryButton disabled={job.running || !ready} done={!!result} onClick={save}>
            <Save aria-hidden />
            {t.save}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
          {result && (
            <ResultCard
              locale={locale}
              items={result}
              onReset={() => {
                setResult(null);
                onClear();
                job.reset();
              }}
            />
          )}
        </>
      }
    />
  );
}

/** Drag helper: calls `onMove` with the pointer offset in page fractions. */
function useDrag(stage: { width: number; height: number }, onMove: (dx: number, dy: number) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      if (!start.current) return;
      onMove((e.clientX - start.current.x) / stage.width, (e.clientY - start.current.y) / stage.height);
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: () => {
      start.current = null;
    },
  };
}

function TextView({
  index,
  item,
  k,
  selected,
  stage,
  t,
  onSelect,
  onChange,
  onRemove,
}: {
  index: number;
  item: Extract<EditItem, { kind: "text" }>;
  k: number;
  selected: boolean;
  stage: { width: number; height: number };
  t: (typeof T)[Locale];
  onSelect: () => void;
  onChange: (p: Partial<EditItem>) => void;
  onRemove: () => void;
}) {
  const drag = useDrag(stage, (dx, dy) => onChange({ x: Math.min(0.98, Math.max(0, item.x + dx)), y: Math.min(0.98, Math.max(0, item.y + dy)) }));
  const lines = item.text.split("\n");
  const cols = Math.max(4, ...lines.map((l) => l.length + 1));
  return (
    <div data-edit-item={index} className="absolute" style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }} onPointerDown={(e) => e.stopPropagation()}>
      <textarea
        value={item.text}
        onChange={(e) => onChange({ text: e.target.value })}
        onFocus={onSelect}
        placeholder={t.placeholder}
        rows={lines.length}
        cols={cols}
        spellCheck={false}
        className={cn(
          "block resize-none overflow-hidden whitespace-pre border-0 bg-transparent p-0 outline-none",
          selected ? "ring-2 ring-accent/60" : "ring-1 ring-accent/25 hover:ring-accent/50",
        )}
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: item.size * k,
          lineHeight: EDIT_LINE_HEIGHT,
          color: css(item.color),
          width: `${cols * 0.62}em`,
          maxWidth: `${(1 - item.x) * stage.width}px`,
        }}
      />
      <div className={cn("absolute -top-8 left-0 flex gap-1", !selected && "hidden")}>
        <button
          type="button"
          {...drag}
          aria-label={t.move}
          title={t.move}
          className="flex size-7 cursor-move touch-none items-center justify-center rounded-full bg-accent text-accent-fg shadow pointer-coarse:size-9"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.remove}
          title={t.remove}
          className="flex size-7 items-center justify-center rounded-full bg-surface text-fg shadow pointer-coarse:size-9"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function BoxView({
  item,
  selected,
  stage,
  t,
  onSelect,
  onChange,
  onRemove,
}: {
  item: Extract<EditItem, { kind: "box" }>;
  selected: boolean;
  stage: { width: number; height: number };
  t: (typeof T)[Locale];
  onSelect: () => void;
  onChange: (p: Partial<EditItem>) => void;
  onRemove: () => void;
}) {
  const move = useDrag(stage, (dx, dy) => onChange({ x: Math.min(1 - item.w, Math.max(0, item.x + dx)), y: Math.min(1 - item.h, Math.max(0, item.y + dy)) }));
  const resize = useDrag(stage, (dx, dy) => onChange({ w: Math.min(1 - item.x, Math.max(0.01, item.w + dx)), h: Math.min(1 - item.y, Math.max(0.005, item.h + dy)) }));
  return (
    <div
      className={cn("absolute cursor-move touch-none", selected ? "outline-2 outline-dashed outline-accent" : "outline-1 outline-dashed outline-accent/40")}
      style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: `${item.w * 100}%`, height: `${item.h * 100}%`, background: css(item.color) }}
      {...move}
      onPointerDown={(e) => {
        onSelect();
        move.onPointerDown(e);
      }}
    >
      {selected && (
        <>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            aria-label={t.remove}
            title={t.remove}
            className="absolute -top-8 right-0 flex size-7 items-center justify-center rounded-full bg-surface text-fg shadow pointer-coarse:size-9"
          >
            <X className="size-4" aria-hidden />
          </button>
          <span
            {...resize}
            aria-label={t.resize}
            className="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-full border-2 border-white bg-accent pointer-coarse:size-6"
          />
        </>
      )}
    </div>
  );
}
