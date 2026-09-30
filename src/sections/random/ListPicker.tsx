"use client";

import { Shuffle } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Select, Switch, Textarea } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { sample, shuffle } from "./lib/rng";
import { HistoryPanel, parseLines, pushHistory } from "./shared";

export interface ListPickerProps {
  locale: Locale;
  items?: Record<Locale, string[]>;
}

const MAX_ITEMS = 1000;

const T = {
  ru: {
    list: "Список — по одному варианту на строку",
    itemForms: ["вариант", "варианта", "вариантов"],
    pickCount: "Сколько выбрать",
    remove: "Убирать выбранное из списка",
    pick: "Выбрать случайно",
    shuffle: "Перемешать весь список",
    picked: "Выбрано",
    shuffled: "Список в случайном порядке",
    idle: "Нажмите «Выбрать случайно» или «Перемешать весь список»",
    needOne: "Добавьте в список хотя бы один вариант",
    copy: "Копировать",
    copied: "Скопировано",
    history: "История выбора",
    clear: "Очистить",
    empty: "Здесь появятся выбранные варианты",
    limit: `До ${MAX_ITEMS} строк. Повторяющиеся строки считаются отдельными вариантами.`,
  },
  en: {
    list: "List — one item per line",
    itemForms: ["item", "items"],
    pickCount: "How many to pick",
    remove: "Remove picked items from the list",
    pick: "Pick at random",
    shuffle: "Shuffle the whole list",
    picked: "Picked",
    shuffled: "List in random order",
    idle: "Press “Pick at random” or “Shuffle the whole list”",
    needOne: "Add at least one item to the list",
    copy: "Copy",
    copied: "Copied",
    history: "Pick history",
    clear: "Clear",
    empty: "Picked items will appear here",
    limit: `Up to ${MAX_ITEMS} lines. Duplicate lines count as separate items.`,
  },
} as const;

const DEFAULT: Record<Locale, string[]> = {
  ru: ["Анна", "Борис", "Виктория", "Григорий", "Дарья", "Евгений", "Жанна", "Захар"],
  en: ["Alice", "Ben", "Chloe", "Daniel", "Emma", "Finn", "Grace", "Harry"],
};

export default function ListPicker({ locale, items = DEFAULT }: ListPickerProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(() => (items[locale] ?? []).join("\n"));
  const [pickCount, setPickCount] = useState(1);
  const [removePicked, setRemovePicked] = useState(false);
  const [result, setResult] = useState<{ kind: "pick" | "shuffle"; items: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const hid = useRef(0);

  const list = parseLines(text, MAX_ITEMS);
  const maxPick = Math.max(1, Math.min(list.length, 50));

  function pick() {
    if (list.length === 0) {
      setError(t.needOne);
      setResult(null);
      return;
    }
    setError(null);
    const k = Math.min(pickCount, list.length);
    const idx = sample(
      list.map((_, i) => i),
      k,
    );
    const chosen = idx.map((i) => list[i]);
    setResult({ kind: "pick", items: chosen });
    setHistory((h) => pushHistory(h, { id: hid.current++, text: chosen.join(", ") }));
    if (removePicked) {
      const drop = new Set(idx);
      setText(list.filter((_, i) => !drop.has(i)).join("\n"));
    }
  }

  function shuffleAll() {
    if (list.length === 0) {
      setError(t.needOne);
      setResult(null);
      return;
    }
    setError(null);
    setResult({ kind: "shuffle", items: shuffle(list) });
  }

  const resultText = result ? (result.kind === "shuffle" ? result.items.map((x, i) => `${i + 1}. ${x}`).join("\n") : result.items.join("\n")) : "";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <Field label={t.list} htmlFor={`${id}-l`} aside={<span className="tabular text-[0.8125rem] text-fg-3">{count(locale, list.length, t.itemForms)}</span>} hint={t.limit}>
          <Textarea id={`${id}-l`} value={text} rows={10} onChange={(e) => setText(e.target.value)} className="font-sans! text-[0.9375rem]!" />
        </Field>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label={t.pickCount} htmlFor={`${id}-k`} className="sm:w-40">
            <Select id={`${id}-k`} value={Math.min(pickCount, maxPick)} onChange={(e) => setPickCount(Number(e.target.value))}>
              {Array.from({ length: maxPick }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </Select>
          </Field>
          <Switch label={t.remove} checked={removePicked} onChange={(e) => setRemovePicked(e.target.checked)} className="sm:mb-2" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" size="lg" onClick={pick} className="sm:min-w-48">
            {t.pick}
          </Button>
          <Button variant="outline" size="lg" onClick={shuffleAll}>
            <Shuffle aria-hidden />
            {t.shuffle}
          </Button>
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel>
          <PanelHeader
            title={result?.kind === "shuffle" ? t.shuffled : t.picked}
            actions={result && <CopyButton value={resultText} label={t.copy} copiedLabel={t.copied} variant="ghost" />}
          />
          <div className="px-4 py-4">
            {error && (
              <p className="text-sm text-err" role="alert">
                {error}
              </p>
            )}
            {!result && !error && <p className="text-sm text-fg-3">{t.idle}</p>}
            <div aria-live="polite">
              {result &&
                (result.kind === "pick" && result.items.length === 1 ? (
                  <p className="text-center text-3xl font-semibold break-words text-fg">{result.items[0]}</p>
                ) : (
                  <ol className="max-h-96 list-decimal overflow-y-auto pl-7 text-[0.9375rem] leading-relaxed text-fg scrollbar-thin">
                    {result.items.map((x, i) => (
                      <li key={i} className="break-words">
                        {x}
                      </li>
                    ))}
                  </ol>
                ))}
            </div>
          </div>
        </Panel>
        <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} />
      </div>
    </div>
  );
}
