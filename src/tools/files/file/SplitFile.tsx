"use client";

import { Download, File as FileIcon, FolderOpen } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes, parseNumber } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { NumberInput } from "@/ui/number-input";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { partName, partSizes } from "./lib/parts";

const T = {
  ru: {
    drop: "Перетащите файл сюда или нажмите, чтобы выбрать",
    change: "Другой файл",
    mode: "Как делить",
    byCount: "На N частей",
    bySize: "По размеру части",
    parts: "Количество частей",
    size: "Размер части",
    result: ["часть", "части", "частей"],
    all: "Скачать все части",
    each: "Скачать по одной",
    note: "Если браузер спросит про несколько загрузок — разрешите.",
    join: "Собрать обратно: «Склеить файлы» на этом сайте или 7-Zip (откройте .001).",
    unit: "Единица",
    each1: "по",
    last: "последняя",
    tooMany: "Получится больше 1000 частей — увеличьте размер части.",
  },
  en: {
    drop: "Drop a file here or click to choose",
    change: "Another file",
    mode: "Split",
    byCount: "Into N parts",
    bySize: "By part size",
    parts: "Number of parts",
    size: "Part size",
    result: ["part", "parts"],
    all: "Download all parts",
    each: "Download one by one",
    note: "If the browser asks about multiple downloads, allow them.",
    join: "To join them back: “Join files” on this site or 7-Zip (open the .001 file).",
    unit: "Unit",
    each1: "of",
    last: "last",
    tooMany: "That would make over 1000 parts — increase the part size.",
  },
} as const;

const UNITS = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 } as const;

export default function SplitFile({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"count" | "size">("size");
  const [countText, setCountText] = useState("3");
  const [sizeText, setSizeText] = useState("25");
  const [unit, setUnit] = useState<keyof typeof UNITS>("MB");
  const [busy, setBusy] = useState(false);

  const n = parseNumber(countText);
  const s = parseNumber(sizeText);
  const sizes = file ? (mode === "count" ? (n && n >= 1 ? partSizes(file.size, { count: n }) : []) : s && s > 0 ? partSizes(file.size, { size: s * UNITS[unit] }) : []) : [];
  const tooMany = sizes.length > 1000;
  const parts = tooMany
    ? []
    : sizes.map((size, i) => {
        const start = sizes.slice(0, i).reduce((a, b) => a + b, 0);
        return { name: partName(file!.name, i, sizes.length), start, size };
      });

  const save = (i: number) => file && downloadBlob(file.slice(parts[i].start, parts[i].start + parts[i].size), parts[i].name);
  const saveAll = async () => {
    setBusy(true);
    for (let i = 0; i < parts.length; i++) {
      save(i);
      await new Promise((r) => setTimeout(r, 400));
    }
    setBusy(false);
  };

  if (!file) return <Dropzone onFiles={(fs) => fs[0] && setFile(fs[0])} locale={locale} title={t.drop} hint={UI_HINT[locale]} />;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
      <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[0.875rem] bg-accent-container text-on-accent-container">
            <FileIcon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-fg" title={file.name}>
              {file.name}
            </div>
            <div className="tabular text-sm text-fg-3">{formatBytes(locale, file.size)}</div>
          </div>
          <Button variant="tonal" size="sm" onClick={() => input.current?.click()}>
            <FolderOpen aria-hidden />
            <span className="max-[22rem]:sr-only">{t.change}</span>
          </Button>
          <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => (e.target.files?.[0] && setFile(e.target.files[0]), (e.target.value = ""))} />
        </div>
        <Segmented label={t.mode} value={mode} onChange={setMode} options={[{ value: "size", label: t.bySize }, { value: "count", label: t.byCount }]} />
        {mode === "count" ? (
          <Field label={t.parts} htmlFor={`${id}-n`}>
            <NumberInput id={`${id}-n`} locale={locale} value={n} min={1} max={1000} size="lg" onChange={(v) => setCountText(v === null ? "" : String(v))} className="max-w-56" />
          </Field>
        ) : (
          <Field label={t.size} htmlFor={`${id}-s`}>
            <div className="flex flex-wrap items-center gap-3">
              <NumberInput id={`${id}-s`} locale={locale} value={s} min={0.1} max={100000} step={1} decimals={1} size="lg" onChange={(v) => setSizeText(v === null ? "" : String(v))} className="max-w-56 min-w-0 flex-1" />
              <Segmented label={t.unit} value={unit} onChange={setUnit} options={(Object.keys(UNITS) as (keyof typeof UNITS)[]).map((u) => ({ value: u, label: locale === "ru" ? { KB: "КБ", MB: "МБ", GB: "ГБ" }[u] : u }))} />
            </div>
          </Field>
        )}
        {tooMany && <Notice tone="warn">{t.tooMany}</Notice>}
      </Panel>
      {parts.length > 0 && (
        <Panel className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <p className="flex flex-wrap items-baseline gap-x-2 text-fg-2" aria-live="polite">
            <span className="text-3xl font-bold tracking-tight text-fg">{count(locale, parts.length, t.result)}</span>
            <span className="tabular">
              {t.each1} {formatBytes(locale, parts[0].size)}
              {parts.length > 1 && parts[parts.length - 1].size !== parts[0].size ? ` (${t.last} ${formatBytes(locale, parts[parts.length - 1].size)})` : ""}
            </span>
          </p>
          <Button variant="filled" size="xl" fullWidth onClick={saveAll} loading={busy}>
            {!busy && <Download aria-hidden />}
            {t.all}
          </Button>
          <p className="-mt-1 text-[0.8125rem] text-fg-3">{t.note}</p>
          <Fold variant="inline" title={t.each} className="text-sm">
            <div className="flex flex-wrap gap-2">
              {parts.slice(0, 200).map((p, i) => (
                <button key={p.name} type="button" className="chip tabular" onClick={() => save(i)}>
                  <Download className="size-3.5" aria-hidden />
                  {p.name.slice(file.name.length + 1)} · {formatBytes(locale, p.size)}
                </button>
              ))}
            </div>
          </Fold>
          <p className="text-[0.8125rem] text-fg-3">{t.join}</p>
        </Panel>
      )}
    </div>
  );
}

const UI_HINT = {
  ru: "Файл делится прямо в браузере, без копирования в память — даже очень большие файлы",
  en: "The file is split right in the browser without copying it in memory — even very large files",
};
