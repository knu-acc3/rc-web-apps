"use client";

import { ArrowDown, ArrowUp, Combine, X } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { planJoin } from "./lib/parts";

const T = {
  ru: {
    drop: "Перетащите все части сюда или нажмите, чтобы выбрать (.001, .002 …)",
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
    note: "Части соединяются как есть, байт за байтом — это работает для частей, созданных «Разделить файл», 7-Zip (режим разбиения на тома) и HJSplit. Разбитые RAR- и ZIP-архивы (.part1.rar, .z01) склеивать не нужно — их открывает архиватор.",
  },
  en: {
    drop: "Drop all parts here or click to choose (.001, .002 …)",
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
    note: "Parts are joined byte by byte as they are — this works for parts made by “Split file”, 7-Zip (split to volumes) and HJSplit. Multi-part RAR and ZIP archives (.part1.rar, .z01) don't need joining — open them with an archiver.",
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
    <div className="flex flex-col gap-4">
      <Dropzone multiple onFiles={add} title={t.drop} hint={t.hint} compact={items.length > 0} />
      {items.length > 0 && (
        <>
          <Panel>
            <ol className="max-h-80 divide-y divide-line overflow-auto">
              {items.map((c, i) => (
                <li key={c.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                  <span className="tabular w-6 shrink-0 text-fg-3">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-fg" title={c.file.name}>
                    {c.file.name}
                  </span>
                  <span className="tabular shrink-0 text-fg-3">{formatBytes(locale, c.file.size)}</span>
                  <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${t.up}: ${c.file.name}`} title={t.up}>
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`${t.down}: ${c.file.name}`} title={t.down}>
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setItems((l) => l.filter((x) => x.id !== c.id))} aria-label={`${t.remove}: ${c.file.name}`} title={t.remove}>
                    <X aria-hidden />
                  </Button>
                </li>
              ))}
            </ol>
            <div className="flex items-center justify-between border-t border-line px-4 py-2 text-sm text-fg-2">
              <span>
                {count(locale, items.length, t.parts)} · {formatBytes(locale, total)}
              </span>
              <Button size="sm" variant="ghost" onClick={() => (setItems([]), setName(null), setDone(null))}>
                {t.clear}
              </Button>
            </div>
          </Panel>
          {plan.missing.length > 0 && <Notice tone="warn">{t.missing.replace("{n}", plan.missing.slice(0, 20).join(", "))}</Notice>}
          {plan.duplicates.length > 0 && <Notice tone="warn">{t.dup.replace("{n}", plan.duplicates.join(", "))}</Notice>}
          {plan.mixed && <Notice tone="warn">{t.mixed}</Notice>}
          <div className="flex flex-wrap items-end gap-3">
            <Field label={t.name} htmlFor={`${id}-n`} className="min-w-64 flex-1">
              <Input id={`${id}-n`} value={outName} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Button variant="primary" size="lg" onClick={run} disabled={items.length < 1}>
              <Combine aria-hidden />
              {t.run}
            </Button>
          </div>
          {done && (
            <Notice tone="ok" aria-live="polite">
              {t.done.replace("{name}", done.name).replace("{size}", formatBytes(locale, done.size))}
            </Notice>
          )}
          <p className="text-sm text-fg-3">{t.note}</p>
        </>
      )}
    </div>
  );
}
