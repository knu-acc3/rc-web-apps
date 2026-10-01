"use client";

import { ArrowUpDown } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { Locale } from "@/i18n/config";
import { usePersistentState } from "@/lib/persist";
import { Presentable } from "@/ui/fullscreen";
import { ToolTitle } from "@/ui/tool-title";
import { count as countOf, formatNumber, parseNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Switch } from "@/ui/field";
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
    integers: "Целые числа",
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
    integers: "Whole numbers",
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

export default function NumberGen({ locale, min = 1, max = 100, count = 1, decimals: dec0 = 0, unique: uniq0 = false, sorted: sort0 = false }: NumberGenProps) {
  const t = T[locale];
  const [title, setTitle] = usePersistentState("random:number:title:v1", "", isTitle);
  const id = useId();
  const fmtIn = (n: number) => formatNumber(locale, n, { useGrouping: false, maximumFractionDigits: MAX_DECIMALS });
  const [minText, setMinText] = useState(fmtIn(min));
  const [maxText, setMaxText] = useState(fmtIn(max));
  const [countText, setCountText] = useState(String(count));
  const [decimals, setDecimals] = useState(dec0);
  const [unique, setUnique] = useState(uniq0);
  const [sorted, setSorted] = useState(sort0);
  const [values, setValues] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const hid = useRef(0);

  const lo = parseNumber(minText);
  const hi = parseNumber(maxText);
  const n = parseNumber(countText);
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

  const onEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") generate();
  };
  const text = values ? values.map(fmt).join(values.length > 1 ? ", " : "") : "";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
          <Field label={t.min} htmlFor={`${id}-min`}>
            <Input
              id={`${id}-min`}
              inputMode="decimal"
              autoComplete="off"
              value={minText}
              onChange={(e) => setMinText(e.target.value)}
              onKeyDown={onEnter}
              aria-invalid={lo === null}
              size="lg"
              className="tabular"
            />
          </Field>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t.swap}
            title={t.swap}
            className="mb-1"
            onClick={() => {
              setMinText(maxText);
              setMaxText(minText);
            }}
          >
            <ArrowUpDown className="rotate-90" />
          </Button>
          <Field label={t.max} htmlFor={`${id}-max`}>
            <Input
              id={`${id}-max`}
              inputMode="decimal"
              autoComplete="off"
              value={maxText}
              onChange={(e) => setMaxText(e.target.value)}
              onKeyDown={onEnter}
              aria-invalid={hi === null}
              size="lg"
              className="tabular"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.count} htmlFor={`${id}-n`}>
            <Input
              id={`${id}-n`}
              inputMode="numeric"
              autoComplete="off"
              value={countText}
              onChange={(e) => setCountText(e.target.value)}
              onKeyDown={onEnter}
              aria-invalid={n === null}
              size="sm"
              className="tabular"
            />
          </Field>
          <Field label={t.decimals} htmlFor={`${id}-d`}>
            <Select id={`${id}-d`} value={decimals} onChange={(e) => setDecimals(Number(e.target.value))} size="sm">
              {Array.from({ length: MAX_DECIMALS + 1 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? t.integers : i}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Switch label={t.unique} checked={unique} onChange={(e) => setUnique(e.target.checked)} />
          <Switch label={t.sorted} checked={sorted} onChange={(e) => setSorted(e.target.checked)} />
        </div>
        {grid && <p className="tabular text-sm text-fg-3">{`${t.possible}: ${formatNumber(locale, grid.size)}`}</p>}
        <Button variant="primary" size="lg" onClick={generate} className="w-full sm:w-auto sm:self-start sm:min-w-48">
          {t.generate}
        </Button>
      </Panel>

      <Presentable locale={locale} className="rounded-[0.75rem] border border-line bg-surface">
        {(full) => (
          <>
            {full ? <ToolTitle value={title} onChange={setTitle} locale={locale} full /> : null}
            <PanelHeader
              title={values && values.length > 1 ? `${t.results} · ${countOf(locale, values.length, t.values)}` : t.result}
              actions={values && <CopyButton value={text} label={t.copy} copiedLabel={t.copied} variant="ghost" />}
            />
            <div className="px-4 py-4">
              <div
                aria-live="polite"
                className={
                  values && values.length === 1
                    ? "fs-big tabular text-center text-5xl font-bold tracking-tight break-all text-fg sm:text-6xl"
                    : "tabular max-h-80 overflow-y-auto text-lg leading-relaxed break-words text-fg scrollbar-thin"
                }
              >
                {error ? "" : text}
              </div>
              {error && (
                <p className="text-sm text-err" role="alert">
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
  );
}
