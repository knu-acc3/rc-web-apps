"use client";

import { ArrowLeftRight, Dices } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { Locale } from "@/i18n/config";
import { usePersistentState } from "@/lib/persist";
import { Presentable } from "@/ui/fullscreen";
import { ToolTitle } from "@/ui/tool-title";
import { count as countOf, formatNumber } from "@/i18n/format";
import { Button, IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { ScrollRow } from "@/ui/scroll-row";
import { Panel, PanelHeader } from "@/ui/panel";
import { generateNumbers, MAX_COUNT, MAX_DECIMALS, numberGrid, type NumberError } from "./lib/numbers";
import { HistoryPanel, pushHistory } from "./ui/shared";

export interface NumberGenProps {
  locale: Locale;
  min?: number;
  max?: number;
  count?: number;
  decimals?: number;
  unique?: boolean;
  sorted?: boolean;
}

const T = {
  ru: {
    min: "От",
    max: "До",
    count: "Сколько чисел",
    decimals: "Знаков после запятой",
    presets: "Готовые диапазоны",
    unique: "Без повторов",
    sorted: "По возрастанию",
    swap: "Поменять «от» и «до»",
    generate: "Сгенерировать",
    result: "Результат",
    results: "Числа",
    idle: "Нажмите «Сгенерировать»",
    copy: "Копировать",
    copied: "Скопировано",
    history: "История",
    clear: "Очистить",
    empty: "Здесь появятся сгенерированные числа",
    invalid: "Введите число",
    values: ["значение", "значения", "значений"],
    possible: "Возможных значений",
    errors: {
      range: "Проверьте границы: «до» должно быть не меньше «от»",
      count: `Количество — от 1 до ${formatNumber("ru", MAX_COUNT)}`,
      unique: "Без повторов нельзя получить больше чисел, чем есть в диапазоне",
    } satisfies Record<NumberError, string>,
  },
  en: {
    min: "Min",
    max: "Max",
    count: "How many numbers",
    decimals: "Decimal places",
    presets: "Ready ranges",
    unique: "No repeats",
    sorted: "Sort ascending",
    swap: "Swap min and max",
    generate: "Generate",
    result: "Result",
    results: "Numbers",
    idle: "Press “Generate”",
    copy: "Copy",
    copied: "Copied",
    history: "History",
    clear: "Clear",
    empty: "Generated numbers will appear here",
    invalid: "Enter a number",
    values: ["value", "values"],
    possible: "Possible values",
    errors: {
      range: "Check the limits: max must not be less than min",
      count: `Count must be 1 to ${formatNumber("en", MAX_COUNT)}`,
      unique: "Without repeats you can't get more numbers than the range contains",
    } satisfies Record<NumberError, string>,
  },
} as const;

const isTitle = (v: unknown): v is string => typeof v === "string" && v.length <= 60;

const PRESETS: [number, number][] = [
  [1, 6],
  [1, 10],
  [1, 20],
  [1, 50],
  [1, 100],
  [1, 1000],
];

export default function NumberGen({ locale, min = 1, max = 100, count = 1, decimals: dec0 = 0, unique: uniq0 = false, sorted: sort0 = false }: NumberGenProps) {
  const t = T[locale];
  const [title, setTitle] = usePersistentState("random:number:title:v1", "", isTitle);
  const id = useId();
  const [lo, setLo] = useState<number | null>(min);
  const [hi, setHi] = useState<number | null>(max);
  const [n, setN] = useState<number | null>(count);
  const [decimals, setDecimals] = useState(dec0);
  const [unique, setUnique] = useState(uniq0);
  const [sorted, setSorted] = useState(sort0);
  const [values, setValues] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const hid = useRef(0);

  const grid = lo !== null && hi !== null ? numberGrid({ min: lo, max: hi, decimals }) : null;

  const fmt = (v: number) => formatNumber(locale, v, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false });

  function generate() {
    if (lo === null || hi === null || n === null) {
      setError(t.invalid);
      return;
    }
    const r = generateNumbers({ min: lo, max: hi, decimals }, Math.round(n), unique, sorted);
    if (!r.ok) {
      setError(t.errors[r.error]);
      setValues(null);
      return;
    }
    setError(null);
    setValues(r.values);
    const shown = r.values.slice(0, 12).map(fmt).join(", ") + (r.values.length > 12 ? ` … (${r.values.length})` : "");
    setHistory((h) => pushHistory(h, { id: hid.current++, text: shown }));
  }

  // Enter in any field generates (NumberInput has no key prop of its own).
  const onEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") generate();
  };
  const text = values ? values.map(fmt).join(values.length > 1 ? ", " : "") : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5" onKeyDown={onEnter}>
        <ScrollRow label={t.presets} rowClassName="gap-2">
          {PRESETS.map(([a, b]) => (
            <button
              key={b}
              type="button"
              className="chip tabular shrink-0"
              aria-pressed={lo === a && hi === b && decimals === 0}
              onClick={() => {
                setLo(a);
                setHi(b);
                setDecimals(0);
              }}
            >
              {a}–{b}
            </button>
          ))}
        </ScrollRow>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
          <Field label={t.min} htmlFor={`${id}-min`}>
            <NumberInput id={`${id}-min`} locale={locale} size="lg" decimals={MAX_DECIMALS} value={lo} onChange={setLo} invalid={lo === null} />
          </Field>
          <IconButton
            label={t.swap}
            icon={<ArrowLeftRight aria-hidden />}
            className="mb-1"
            onClick={() => {
              setLo(hi);
              setHi(lo);
            }}
          />
          <Field label={t.max} htmlFor={`${id}-max`}>
            <NumberInput id={`${id}-max`} locale={locale} size="lg" decimals={MAX_DECIMALS} value={hi} onChange={setHi} invalid={hi === null} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          <Field label={t.count} htmlFor={`${id}-n`}>
            <NumberInput id={`${id}-n`} locale={locale} min={1} max={MAX_COUNT} value={n} onChange={setN} invalid={n === null} />
          </Field>
          <Field label={t.decimals} htmlFor={`${id}-d`}>
            <NumberInput id={`${id}-d`} locale={locale} min={0} max={MAX_DECIMALS} value={decimals} onChange={(v) => v !== null && setDecimals(v)} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Switch label={t.unique} checked={unique} onChange={(e) => setUnique(e.target.checked)} />
          <Switch label={t.sorted} checked={sorted} onChange={(e) => setSorted(e.target.checked)} />
        </div>
        <Button variant="filled" size="xl" onClick={generate} className="w-full">
          <Dices aria-hidden />
          {t.generate}
        </Button>
        {grid && <p className="tabular -mt-1 text-center text-sm text-fg-3">{`${t.possible}: ${formatNumber(locale, grid.size)}`}</p>}
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Presentable locale={locale} className="panel overflow-hidden" fullClassName="rounded-none shadow-none">
          {(full) => (
            <>
              {full ? <ToolTitle value={title} onChange={setTitle} locale={locale} full /> : null}
              <PanelHeader
                className="pr-14"
                title={values && values.length > 1 ? `${t.results} · ${countOf(locale, values.length, t.values)}` : t.result}
                actions={values && <CopyButton value={text} label={t.copy} copiedLabel={t.copied} variant="ghost" />}
              />
              <div className="flex min-h-36 flex-col justify-center px-4 py-5">
                <div
                  aria-live="polite"
                  className={
                    values && values.length === 1
                      ? "fs-big tabular text-center text-6xl font-bold tracking-tight break-all text-fg sm:text-7xl"
                      : "tabular max-h-80 overflow-y-auto text-xl leading-relaxed break-words text-fg scrollbar-thin"
                  }
                >
                  {error ? "" : <span key={history[0]?.id} className="inline-block motion-safe:animate-[pop_0.4s_ease-out]">{text}</span>}
                </div>
                {error && (
                  <p className="text-center text-sm text-err" role="alert">
                    {error}
                  </p>
                )}
                {!values && !error && <p className="text-center text-sm text-fg-3">{t.idle}</p>}
              </div>
              {!full && <ToolTitle value={title} onChange={setTitle} locale={locale} className="mx-auto mb-3 block text-base" />}
            </>
          )}
        </Presentable>

        <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} />
      </div>
    </div>
  );
}
