"use client";

import { FilePlus2, ImageIcon, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Select } from "@/ui/field";
import { mmToPt, type PaperId } from "./engine/geometry";
import { OptionsRow, PrimaryButton, workerJob } from "./ui/bits";
import { PageGrid, moveItem, toggleSelection, type GridPage } from "./ui/PageGrid";
import { JobStatus, ResultCard, baseName, pdfBlob, type OutputItem } from "./ui/Result";
import { S } from "./ui/strings";
import { useJob } from "./ui/use-job";

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
    add: "Добавить ещё",
    page: "Размер страницы",
    pages: { a4: "A4", letter: "Letter (США)", "fit-image": "По размеру картинки" } as Record<string, string>,
    orient: "Ориентация",
    orients: { auto: "Авто", portrait: "Книжная", landscape: "Альбомная" },
    margin: "Поля",
    margins: { "0": "Без полей", "5": "Узкие, 5 мм", "10": "Обычные, 10 мм", "20": "Широкие, 20 мм" } as Record<string, string>,
    fit: "Масштаб",
    fits: { fit: "Вписать в страницу", original: "Исходный размер" },
    remove: "Убрать выбранные",
    clear: "Очистить",
    make: (n: number) => `Создать PDF из ${count("ru", n, ["картинки", "картинок", "картинок"])}`,
    images: ["картинка", "картинки", "картинок"],
    heicNote: "HEIC нет в формате PDF, поэтому такие фото сохраняются как JPEG (качество 92%). WebP, AVIF, GIF и BMP — как JPEG, а с прозрачностью — как PNG. JPEG и PNG вставляются без пересжатия.",
  },
  en: {
    drop: (f: string) => `Drop images (${f}) here or click to choose`,
    hint: "Pick several at once — each becomes a page",
    add: "Add more",
    page: "Page size",
    pages: { a4: "A4", letter: "US Letter", "fit-image": "Same as image" } as Record<string, string>,
    orient: "Orientation",
    orients: { auto: "Auto", portrait: "Portrait", landscape: "Landscape" },
    margin: "Margins",
    margins: { "0": "None", "5": "Narrow, 5 mm", "10": "Normal, 10 mm", "20": "Wide, 20 mm" } as Record<string, string>,
    fit: "Scale",
    fits: { fit: "Fit to page", original: "Original size" },
    remove: "Remove selected",
    clear: "Clear",
    make: (n: number) => `Create PDF from ${count("en", n, ["image", "images"])}`,
    images: ["image", "images"],
    heicNote: "PDF can't hold HEIC, so such photos are stored as JPEG (92% quality). WebP, AVIF, GIF and BMP become JPEG, or PNG when they have transparency. JPEG and PNG are embedded without re-compression.",
  },
} as const;

interface Item {
  key: string;
  file: File;
  /** Preview URL (null for formats the browser can't show, like HEIC). */
  url: string | null;
}

let seq = 0;

const isHeic = (f: File) => /\.(heic|heif)$/i.test(f.name) || /heic|heif/i.test(f.type);

export default function ImagesToPdfTool({ locale, formats = "all" }: { locale: Locale; formats?: ImageSource }) {
  const t = T[locale];
  const s = S[locale];
  const id = useId();
  const job = useJob(locale);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);
  const [page, setPage] = useState<PaperId | "fit-image">("a4");
  const [orient, setOrient] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState("10");
  const [fit, setFit] = useState<"fit" | "original">("fit");
  const [result, setResult] = useState<OutputItem[] | null>(null);

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

  if (!items.length) {
    return (
      <div className="flex flex-col gap-3">
        <Dropzone onFiles={add} accept={ACCEPT[formats]} multiple title={t.drop(LABEL[formats])} hint={`${t.hint}. ${s.dropHint}.`} />
        <p className="text-sm text-fg-3">{t.heicNote}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageGrid
        locale={locale}
        pages={grid}
        label={(p, i) => `${i + 1}. ${byKey.get(p.key)?.file.name ?? ""}`}
        describe={(p, i) => `${i + 1}: ${byKey.get(p.key)?.file.name ?? ""}`}
        renderThumb={(p) => {
          const it = byKey.get(p.key);
          return (
            <span className="flex aspect-square items-center justify-center overflow-hidden rounded-[8px] bg-surface-2">
              {it?.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={it.url} alt="" draggable={false} className="max-h-full max-w-full object-contain" />
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
        toolbar={
          <OptionsRow className="items-center! gap-x-2!">
            <Dropzone onFiles={add} accept={ACCEPT[formats]} multiple compact title={t.add} className="min-h-10! w-auto! flex-row! gap-2! border! px-3! py-1! [&>span:first-child]:size-6" />
            <Button size="sm" variant="ghost" disabled={!selected.size} onClick={() => drop(selected)}>
              <Trash2 aria-hidden />
              {t.remove}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => drop(new Set(items.map((i) => i.key)))}>
              {t.clear}
            </Button>
          </OptionsRow>
        }
      />

      <OptionsRow>
        <Field label={t.page} htmlFor={`${id}-p`} className="w-44">
          <Select id={`${id}-p`} value={page} onChange={(e) => setPage(e.target.value as PaperId | "fit-image")}>
            {Object.entries(t.pages).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        {page !== "fit-image" && (
          <Field label={t.orient} htmlFor={`${id}-o`} className="w-36">
            <Select id={`${id}-o`} value={orient} onChange={(e) => setOrient(e.target.value as typeof orient)}>
              {Object.entries(t.orients).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t.margin} htmlFor={`${id}-m`} className="w-40">
          <Select id={`${id}-m`} value={margin} onChange={(e) => setMargin(e.target.value)}>
            {Object.entries(t.margins).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        {page !== "fit-image" && (
          <Field label={t.fit} htmlFor={`${id}-f`} className="w-48">
            <Select id={`${id}-f`} value={fit} onChange={(e) => setFit(e.target.value as typeof fit)}>
              {Object.entries(t.fits).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </OptionsRow>

      <PrimaryButton disabled={job.running} onClick={make}>
        <FilePlus2 aria-hidden />
        {t.make(items.length)}
      </PrimaryButton>
      <JobStatus locale={locale} state={job.state} onCancel={job.cancel} />
      {result && (
        <ResultCard
          locale={locale}
          items={result}
          onReset={() => {
            setResult(null);
            drop(new Set(items.map((i) => i.key)));
            job.reset();
          }}
        />
      )}
    </div>
  );
}
