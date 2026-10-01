"use client";

import { FilePlus2, ImageIcon, ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { mmToPt, type PaperId } from "./lib/geometry";
import { moveItem, toggleSelection } from "./lib/order";
import { PrimaryButton, workerJob } from "./ui/bits";
import { PageGrid, type GridPage } from "./ui/PageGrid";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { S } from "./ui/strings";
import { useJob } from "./ui/use-job";
import { Controls, Workspace } from "./ui/Workspace";

export type ImageSource = "all" | "jpg" | "png" | "heic" | "webp";

const ACCEPT: Record<ImageSource, string> = {
  all: "image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.heic,.heif",
  jpg: "image/jpeg,.jpg,.jpeg,.jfif",
  png: "image/png,.png",
  heic: "image/heic,image/heif,.heic,.heif",
  webp: "image/webp,.webp",
};

const LABEL: Record<ImageSource, string> = { all: "JPG, PNG, WebP, HEIC, AVIF, GIF, BMP", jpg: "JPG", png: "PNG", heic: "HEIC / HEIF", webp: "WebP" };

const T = {
  ru: {
    drop: (f: string) => `Перетащите картинки (${f}) или нажмите, чтобы выбрать`,
    hint: "Можно выбрать сразу несколько — каждая станет страницей",
    add: "Добавить картинки",
    page: "Размер страницы",
    pages: { a4: "A4", letter: "Letter (США)", "fit-image": "По размеру картинки" },
    orient: "Ориентация",
    orients: { auto: "Авто", portrait: "Книжная", landscape: "Альбомная" },
    margin: "Поля",
    margins: { "0": "Без полей", "5": "5 мм", "10": "10 мм", "20": "20 мм" },
    fit: "Масштаб",
    fits: { fit: "Вписать в страницу", original: "Исходный размер" },
    remove: "Убрать выбранные",
    clear: "Очистить",
    make: (n: number) => `Создать PDF из ${count("ru", n, ["картинки", "картинок", "картинок"])}`,
    images: ["картинка", "картинки", "картинок"],
    heicNote: "JPEG и PNG вставляются без пересжатия; HEIC, WebP, AVIF, GIF и BMP сохраняются как JPEG (с прозрачностью — как PNG).",
  },
  en: {
    drop: (f: string) => `Drop images (${f}) here or click to choose`,
    hint: "Pick several at once — each becomes a page",
    add: "Add images",
    page: "Page size",
    pages: { a4: "A4", letter: "US Letter", "fit-image": "Same as image" },
    orient: "Orientation",
    orients: { auto: "Auto", portrait: "Portrait", landscape: "Landscape" },
    margin: "Margins",
    margins: { "0": "None", "5": "5 mm", "10": "10 mm", "20": "20 mm" },
    fit: "Scale",
    fits: { fit: "Fit to page", original: "Original size" },
    remove: "Remove selected",
    clear: "Clear",
    make: (n: number) => `Create PDF from ${count("en", n, ["image", "images"])}`,
    images: ["image", "images"],
    heicNote: "JPEG and PNG are embedded without re-compression; HEIC, WebP, AVIF, GIF and BMP become JPEG (PNG when transparent).",
  },
} as const;

interface Item {
  key: string;
  file: File;
  /** Preview URL (null for formats the browser can't show, like HEIC). */
  url: string | null;
}

let seq = 0;

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
/** Same rule as the dropzone's `accept`: extensions or MIME types. */
function isAccepted(file: File, accept: string): boolean {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return accept.split(",").some((r) => (r.startsWith(".") ? name.endsWith(r) : type === r));
}

const isHeic = (f: File) => /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type);

export default function ImagesToPdfTool({ locale, formats = "all" }: { locale: Locale; formats?: ImageSource }) {
  const t = T[locale];
  const s = S[locale];
  const job = useJob(locale);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);
  const [page, setPage] = useState<PaperId | "fit-image">("a4");
  const [orient, setOrient] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState<"0" | "5" | "10" | "20">("10");
  const [fit, setFit] = useState<"fit" | "original">("fit");
  const [result, setResult] = useState<OutputItem[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [over, setOver] = useState(false);

  // Revoke preview URLs on unmount.
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const set = urls.current;
    return () => {
      for (const u of set) URL.revokeObjectURL(u);
      set.clear();
    };
  }, []);

  const add = (files: File[]) => {
    const next = files.map((file) => {
      const url = isHeic(file) ? null : URL.createObjectURL(file);
      if (url) urls.current.add(url);
      return { key: `i${++seq}`, file, url };
    });
    setItems((prev) => [...prev, ...next]);
    setResult(null);
  };
  const drop = (keys: ReadonlySet<string>) => {
    setItems((prev) =>
      prev.filter((it) => {
        if (!keys.has(it.key)) return true;
        if (it.url) {
          URL.revokeObjectURL(it.url);
          urls.current.delete(it.url);
        }
        return false;
      }),
    );
    setSelected(new Set());
    setResult(null);
  };

  const grid: GridPage[] = items.map((it, index) => ({ key: it.key, file: it.key, index, rotate: 0 }));
  const byKey = new Map(items.map((it) => [it.key, it]));

  async function make() {
    setResult(null);
    const list = items.slice();
    const out = await job.start(async (ctx) => {
      const images = await Promise.all(list.map(async (it) => ({ bytes: await it.file.arrayBuffer(), name: it.file.name })));
      return workerJob({ type: "images", images, layout: { page, pageOrientation: orient, margin: mmToPt(Number(margin)), scaleMode: fit } }, ctx);
    });
    if (out) setResult([{ name: `${list.length === 1 ? baseName(list[0].file.name) : "images"}.pdf`, blob: pdfBlob(out.files[0].bytes) }]);
  }

  const take = (list: FileList | null | undefined) => {
    const accepted = Array.from(list ?? []).filter((f) => isAccepted(f, ACCEPT[formats]));
    if (accepted.length) add(accepted);
  };

  if (!items.length) {
    return (
      <div className="flex flex-col gap-3">
        <Dropzone onFiles={add} accept={ACCEPT[formats]} multiple locale={locale} title={t.drop(LABEL[formats])} hint={`${t.hint}. ${s.dropHint}.`} />
        <p className="text-sm text-fg-3">{t.heicNote}</p>
      </div>
    );
  }

  const files = (
    <Panel
      className={cn("flex flex-col gap-2 p-3 transition-[background-color,box-shadow] duration-150 sm:p-4", over && "bg-accent-soft ring-2 ring-accent")}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (hasFiles(e)) e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        take(e.dataTransfer.files);
      }}
    >
      <p className="font-semibold text-fg">
        {count(locale, items.length, t.images)}
        {selected.size > 0 && <span className="font-normal text-fg-3"> · {s.selectedCount(selected.size)}</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="tonal" onClick={() => inputRef.current?.click()} disabled={job.running}>
          <ImagePlus aria-hidden />
          {t.add}
        </Button>
        {selected.size > 0 && (
          <Button variant="text" onClick={() => drop(selected)}>
            <Trash2 aria-hidden />
            {t.remove}
          </Button>
        )}
        <Button variant="text" onClick={() => drop(new Set(items.map((i) => i.key)))} disabled={job.running}>
          <X aria-hidden />
          {t.clear}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={ACCEPT[formats]}
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </Panel>
  );

  const change = <V,>(set: (v: V) => void) => (v: V) => {
    set(v);
    setResult(null);
  };

  return (
    <Workspace
      files={files}
      previewFirst
      stickyAction
      preview={
        <PageGrid
          locale={locale}
          pages={grid}
          label={(p, i) => `${i + 1}. ${byKey.get(p.key)?.file.name ?? ""}`}
          describe={(p, i) => `${i + 1}: ${byKey.get(p.key)?.file.name ?? ""}`}
          renderThumb={(p) => {
            const it = byKey.get(p.key);
            return (
              <span className="flex aspect-square items-center justify-center overflow-hidden rounded-[0.5rem] bg-surface-2">
                {it?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                  <img src={it.url} alt="" draggable={false} decoding="async" className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon className="size-8 text-fg-3" aria-hidden />
                )}
              </span>
            );
          }}
          selected={selected}
          onToggle={(key, extend) =>
            setSelected((prev) =>
              toggleSelection(
                prev,
                grid.map((g) => g.key),
                key,
                extend,
                anchor,
              ),
            )
          }
          onMove={(from, to) => {
            setItems((prev) => moveItem(prev, from, to));
            setResult(null);
          }}
          onDelete={(key) => drop(new Set([key]))}
        />
      }
      controls={
        <Controls>
          <Field label={t.page}>
            <Segmented label={t.page} value={page} onChange={change(setPage)} options={(["a4", "letter", "fit-image"] as const).map((v) => ({ value: v, label: t.pages[v] }))} />
          </Field>
          {page !== "fit-image" && (
            <Field label={t.orient}>
              <Segmented label={t.orient} value={orient} onChange={change(setOrient)} options={(["auto", "portrait", "landscape"] as const).map((v) => ({ value: v, label: t.orients[v] }))} />
            </Field>
          )}
          <Field label={t.margin}>
            <Segmented label={t.margin} value={margin} onChange={change(setMargin)} options={(["0", "5", "10", "20"] as const).map((v) => ({ value: v, label: t.margins[v] }))} />
          </Field>
          {page !== "fit-image" && (
            <Field label={t.fit}>
              <Segmented label={t.fit} value={fit} onChange={change(setFit)} options={(["fit", "original"] as const).map((v) => ({ value: v, label: t.fits[v] }))} />
            </Field>
          )}
        </Controls>
      }
      action={
        <Panel className="flex flex-col gap-3 p-3 max-lg:shadow-elev-3 sm:p-4">
          <PrimaryButton disabled={job.running} done={!!result} onClick={make}>
            <FilePlus2 aria-hidden />
            {t.make(items.length)}
          </PrimaryButton>
          <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
        </Panel>
      }
      result={
        result && (
          <ResultCard
            locale={locale}
            items={result}
            onReset={() => {
              setResult(null);
              drop(new Set(items.map((i) => i.key)));
              job.reset();
            }}
          />
        )
      }
    />
  );
}
