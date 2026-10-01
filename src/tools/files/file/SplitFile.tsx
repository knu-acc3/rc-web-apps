"use client";

import { Download, FolderOpen } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes, parseNumber } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { partName, partSizes } from "./lib/parts";

const T = {
  ru: {
    drop: "Перетащите файл сюда или нажмите, чтобы выбрать",
    change: "Выбрать другой файл",
    mode: "Как делить",
    byCount: "На N частей",
    bySize: "По размеру части",
    parts: "Количество частей",
    size: "Размер части",
    result: ["часть", "части", "частей"],
    all: "Скачать все части",
    each: "Части",
    note: "Браузер может спросить разрешение на скачивание нескольких файлов — разрешите его.",
    join: "Как собрать обратно: инструментом «Склеить файлы» на этом сайте, в 7-Zip (открыть файл .001), в Windows командой copy /b «файл.001»+«файл.002» «файл», в macOS и Linux — cat файл.* > файл.",
    tooMany: "Получится больше 1000 частей — увеличьте размер части.",
  },
  en: {
    drop: "Drop a file here or click to choose",
    change: "Choose another file",
    mode: "Split",
    byCount: "Into N parts",
    bySize: "By part size",
    parts: "Number of parts",
    size: "Part size",
    result: ["part", "parts"],
    all: "Download all parts",
    each: "Parts",
    note: "The browser may ask to allow downloading multiple files — allow it.",
    join: "To put it back together: use “Join files” on this site, 7-Zip (open the .001 file), on Windows copy /b “file.001”+“file.002” “file”, on macOS and Linux cat file.* > file.",
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

  if (!file) return <Dropzone onFiles={(fs) => fs[0] && setFile(fs[0])} title={t.drop} hint={UI_HINT[locale]} />;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-fg" title={file.name}>
            {file.name}
          </div>
          <div className="text-sm text-fg-3">{formatBytes(locale, file.size)}</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
          <FolderOpen aria-hidden />
          {t.change}
        </Button>
        <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => (e.target.files?.[0] && setFile(e.target.files[0]), (e.target.value = ""))} />
      </Panel>
      <div className="flex flex-wrap items-end gap-3">
        <Segmented label={t.mode} value={mode} onChange={setMode} options={[{ value: "size", label: t.bySize }, { value: "count", label: t.byCount }]} />
        {mode === "count" ? (
          <Field label={t.parts} htmlFor={`${id}-n`} className="w-40">
            <Input id={`${id}-n`} size="sm" inputMode="numeric" value={countText} onChange={(e) => setCountText(e.target.value)} className="tabular" />
          </Field>
        ) : (
          <div className="flex items-end gap-2">
            <Field label={t.size} htmlFor={`${id}-s`} className="w-32">
              <Input id={`${id}-s`} size="sm" inputMode="decimal" value={sizeText} onChange={(e) => setSizeText(e.target.value)} className="tabular" />
            </Field>
            <Select aria-label={t.size} size="sm" value={unit} onChange={(e) => setUnit(e.target.value as keyof typeof UNITS)} className="w-24">
              {Object.keys(UNITS).map((u) => (
                <option key={u} value={u}>
                  {locale === "ru" ? { KB: "КБ", MB: "МБ", GB: "ГБ" }[u] : u}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      {tooMany && <Notice tone="warn">{t.tooMany}</Notice>}
      {parts.length > 0 && (
        <>
          <p className="text-fg-2" aria-live="polite">
            <span className="text-2xl font-semibold text-fg">{count(locale, parts.length, t.result)}</span> · {formatBytes(locale, parts[0].size)}
            {parts.length > 1 && parts[parts.length - 1].size !== parts[0].size ? ` (${formatBytes(locale, parts[parts.length - 1].size)})` : ""}
          </p>
          <Button variant="primary" size="lg" onClick={saveAll} disabled={busy} className="w-full sm:w-auto sm:self-start">
            <Download aria-hidden />
            {t.all}
          </Button>
          <p className="-mt-2 text-[0.8125rem] text-fg-3">{t.note}</p>
          <details className="text-sm">
            <summary className="cursor-pointer text-fg-3 hover:text-fg">{t.each}</summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {parts.slice(0, 200).map((p, i) => (
                <li key={p.name}>
                  <button type="button" className="chip tabular" onClick={() => save(i)}>
                    {p.name.slice(file.name.length + 1)} · {formatBytes(locale, p.size)}
                  </button>
                </li>
              ))}
            </ul>
          </details>
          <p className="text-sm text-fg-3">{t.join}</p>
        </>
      )}
    </div>
  );
}

const UI_HINT = {
  ru: "Файл делится прямо в браузере, без копирования в память — даже очень большие файлы",
  en: "The file is split right in the browser without copying it in memory — even very large files",
};
