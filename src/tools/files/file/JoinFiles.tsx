"use client";

import { ArrowDown, ArrowUp, Combine, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button, IconButton } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { planJoin } from "./lib/parts";

const T = {
  ru: {
    drop: "Перетащите все части (.001, .002 …) сюда или нажмите, чтобы выбрать",
    hint: "Части сортируются по номеру автоматически",
    parts: ["часть", "части", "частей"],
    name: "Имя итогового файла",
    missing: "Не хватает частей с номерами: {n}. Итоговый файл будет неполным.",
    mixed: "В списке части разных файлов — проверьте, что выбраны нужные.",
    dup: "Повторяются номера: {n}.",
    run: "Склеить и скачать",
    up: "Выше",
    down: "Ниже",
    remove: "Убрать",
    clear: "Очистить",
    done: "Скачан файл {name} — {size}.",
    note: "Части соединяются байт за байтом: подходят части из «Разделить файл», 7-Zip и HJSplit. Многотомные RAR и ZIP открывайте архиватором.",
  },
  en: {
    drop: "Drop all parts (.001, .002 …) here or click to choose",
    hint: "Parts are sorted by number automatically",
    parts: ["part", "parts"],
    name: "Output file name",
    missing: "Parts missing: {n}. The joined file will be incomplete.",
    mixed: "The list contains parts of different files — check the selection.",
    dup: "Duplicate part numbers: {n}.",
    run: "Join and download",
    up: "Move up",
    down: "Move down",
    remove: "Remove",
    clear: "Clear",
    done: "Downloaded {name} — {size}.",
    note: "Parts are joined byte by byte: works for parts from “Split file”, 7-Zip and HJSplit. Open multi-part RAR and ZIP with an archiver.",
  },
} as const;

let seq = 0;

export default function JoinFiles({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [items, setItems] = useState<{ id: number; file: File }[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; size: number } | null>(null);

  const add = (fs: File[]) => {
    setDone(null);
    setItems((l) => {
      const all = [...l, ...fs.map((file) => ({ id: ++seq, file }))];
      const plan = planJoin(all.map((x) => x.file.name));
      return plan.order.map((i) => all[i]);
    });
  };
  const plan = planJoin(items.map((x) => x.file.name));
  const outName = name ?? plan.base;
  const total = items.reduce((s, x) => s + x.file.size, 0);
  const move = (i: number, d: number) =>
    setItems((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const run = () => {
    const blob = new Blob(items.map((x) => x.file));
    downloadBlob(blob, outName || "joined.bin");
    setDone({ name: outName, size: blob.size });
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
      <div className="flex min-w-0 flex-col gap-4">
        <Dropzone multiple locale={locale} onFiles={add} title={t.drop} hint={t.hint} compact={items.length > 0} />
        {items.length > 0 && (
          <Panel>
            <ol className="max-h-96 divide-y divide-line overflow-auto">
              {items.map((c, i) => (
                <li key={c.id} className="flex items-center gap-1 py-1.5 pl-4 pr-2 text-sm">
                  <span className="tabular w-7 shrink-0 text-fg-3">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-fg" title={c.file.name}>
                    {c.file.name}
                  </span>
                  <span className="tabular mr-1 shrink-0 text-fg-3">{formatBytes(locale, c.file.size)}</span>
                  <IconButton size="sm" label={`${t.up}: ${c.file.name}`} title={t.up} icon={<ArrowUp aria-hidden />} onClick={() => move(i, -1)} disabled={i === 0} />
                  <IconButton size="sm" label={`${t.down}: ${c.file.name}`} title={t.down} icon={<ArrowDown aria-hidden />} onClick={() => move(i, 1)} disabled={i === items.length - 1} />
                  <IconButton size="sm" label={`${t.remove}: ${c.file.name}`} title={t.remove} icon={<X aria-hidden />} onClick={() => setItems((l) => l.filter((x) => x.id !== c.id))} />
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>
      <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-2xl font-bold tracking-tight text-fg">{count(locale, items.length, t.parts)}</span>
          <span className="flex items-center gap-1">
            {items.length > 0 && <span className="tabular text-fg-2">{formatBytes(locale, total)}</span>}
            {items.length > 0 && (
              <Button size="sm" variant="text" onClick={() => (setItems([]), setName(null), setDone(null))}>
                {t.clear}
              </Button>
            )}
          </span>
        </div>
        {plan.missing.length > 0 && <Notice tone="warn">{t.missing.replace("{n}", plan.missing.slice(0, 20).join(", "))}</Notice>}
        {plan.duplicates.length > 0 && <Notice tone="warn">{t.dup.replace("{n}", plan.duplicates.join(", "))}</Notice>}
        {plan.mixed && <Notice tone="warn">{t.mixed}</Notice>}
        <Field label={t.name} htmlFor={`${id}-n`}>
          <Input id={`${id}-n`} value={outName} onChange={(e) => setName(e.target.value)} disabled={!items.length} />
        </Field>
        <Button variant="filled" size="xl" fullWidth onClick={run} disabled={items.length < 1}>
          <Combine aria-hidden />
          {t.run}
        </Button>
        {done && (
          <Notice tone="ok" aria-live="polite">
            {t.done.replace("{name}", done.name).replace("{size}", formatBytes(locale, done.size))}
          </Notice>
        )}
        <p className="text-[0.8125rem] text-fg-3">{t.note}</p>
      </Panel>
    </div>
  );
}
