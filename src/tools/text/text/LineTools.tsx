"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Input, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { SliderField } from "@/ui/slider-field";
import { addPrefixSuffix, filterLines, joinLines, LINE_OPS, numberLines, removeEmptyLines, splitToLines, wrapText, type LineOp } from "./lib/lineTools";
import { splitLines } from "./lib/textOps";
import { countLabel, InlineSelect, InputPanel, OptionsBar, OutputPanel, TwoPane, TX } from "./ui/shared";
import { ChipChoice } from "@/ui/chip-choice";

const T = {
  ru: {
    op: "Действие",
    prefix: "Префикс и суффикс",
    number: "Нумерация строк",
    join: "Объединить строки",
    split: "Разбить на строки",
    "remove-empty": "Удалить пустые строки",
    wrap: "Перенос по ширине",
    filter: "Фильтр строк",
    before: "В начало",
    after: "В конец",
    skipEmpty: "Пропускать пустые",
    format: "Формат",
    start: "Начать с",
    pad: "Нули впереди (01, 02…)",
    separator: "Разделитель",
    space: "пробел",
    comma: "запятая",
    commaSpace: "запятая и пробел",
    semicolon: "точка с запятой",
    pipe: "вертикальная черта",
    none: "без разделителя",
    delimiter: "Разбить по",
    trim: "Обрезать пробелы",
    wsEmpty: "Строки из пробелов тоже пустые",
    width: "Ширина строки",
    chars: "симв.",
    breakWords: "Разрывать длинные слова",
    query: "Строки, содержащие",
    keep: "оставить",
    remove: "удалить",
    ignoreCase: "Без учёта регистра",
    mode: "Такие строки",
    samples: {
      prefix: "Алматы\nАстана\nШымкент\n\nКараганда",
      number: "Купить молоко\nПозвонить маме\nОтправить отчёт\n\nЗаписаться к врачу",
      join: "первая строка\nвторая строка\nтретья строка",
      split: "яблоко, груша, слива, вишня, абрикос",
      "remove-empty": "Первая строка\n\n\nВторая строка\n   \nТретья строка\n\n",
      wrap: "Перенос по ширине разбивает длинные абзацы на строки заданной длины, не разрывая слова. Это удобно для писем в простом тексте, комментариев в коде и субтитров.",
      filter: "ERROR 12:01 диск заполнен\nINFO 12:02 резервная копия создана\nERROR 12:05 нет соединения\nINFO 12:06 соединение восстановлено",
    },
  },
  en: {
    op: "Action",
    prefix: "Prefix and suffix",
    number: "Number lines",
    join: "Join lines",
    split: "Split into lines",
    "remove-empty": "Remove empty lines",
    wrap: "Wrap to width",
    filter: "Filter lines",
    before: "Add to start",
    after: "Add to end",
    skipEmpty: "Skip empty lines",
    format: "Format",
    start: "Start at",
    pad: "Leading zeros (01, 02…)",
    separator: "Separator",
    space: "space",
    comma: "comma",
    commaSpace: "comma and space",
    semicolon: "semicolon",
    pipe: "vertical bar",
    none: "nothing",
    delimiter: "Split on",
    trim: "Trim spaces",
    wsEmpty: "Whitespace-only lines count as empty",
    width: "Line width",
    chars: "chars",
    breakWords: "Break long words",
    query: "Lines containing",
    keep: "keep",
    remove: "remove",
    ignoreCase: "Ignore case",
    mode: "Such lines",
    samples: {
      prefix: "London\nParis\nBerlin\n\nMadrid",
      number: "Buy milk\nCall mom\nSend the report\n\nBook a doctor",
      join: "first line\nsecond line\nthird line",
      split: "apple, pear, plum, cherry, apricot",
      "remove-empty": "First line\n\n\nSecond line\n   \nThird line\n\n",
      wrap: "Word wrap splits long paragraphs into lines of a given length without breaking words. It is handy for plain-text emails, code comments and subtitles.",
      filter: "ERROR 12:01 disk full\nINFO 12:02 backup created\nERROR 12:05 connection lost\nINFO 12:06 connection restored",
    },
  },
} as const;

const FORMATS = ["{n}. ", "{n}) ", "{n} ", "[{n}] ", "{n} - ", "#{n} "] as const;
type JoinSep = "space" | "comma" | "commaSpace" | "semicolon" | "pipe" | "none";
const JOIN: Record<JoinSep, string> = { space: " ", comma: ",", commaSpace: ", ", semicolon: "; ", pipe: " | ", none: "" };

export default function LineTools({ locale, op: op0 = "number" }: { locale: Locale; op?: LineOp }) {
  const t = T[locale];
  const id = useId();
  const [op, setOp] = useState<LineOp>(op0);
  const [text, setText] = useState<string>(t.samples[op0]);
  const [prefix, setPrefix] = useState(op0 === "prefix" ? "— " : "");
  const [suffix, setSuffix] = useState(op0 === "prefix" ? ";" : "");
  const [skipEmpty, setSkipEmpty] = useState(true);
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("{n}. ");
  const [start, setStart] = useState("1");
  const [pad, setPad] = useState(false);
  const [joinSep, setJoinSep] = useState<JoinSep>("commaSpace");
  const [delimiter, setDelimiter] = useState(",");
  const [trim, setTrim] = useState(true);
  const [wsEmpty, setWsEmpty] = useState(true);
  const [width, setWidth] = useState("40");
  const [breakWords, setBreakWords] = useState(false);
  const [query, setQuery] = useState(op0 === "filter" ? "ERROR" : "");
  const [filterMode, setFilterMode] = useState<"keep" | "remove">("keep");
  const [ignoreCase, setIgnoreCase] = useState(true);

  const out = useMemo(() => {
    switch (op) {
      case "prefix":
        return addPrefixSuffix(text, prefix, suffix, skipEmpty);
      case "number":
        return numberLines(text, { start: Number.parseInt(start, 10) || 0, format, pad, skipEmpty });
      case "join":
        return joinLines(text, JOIN[joinSep], true, trim);
      case "split":
        return splitToLines(text, delimiter.replace(/\\n/g, "\n").replace(/\\t/g, "\t"), trim, true);
      case "remove-empty":
        return removeEmptyLines(text, wsEmpty);
      case "wrap":
        return wrapText(text, Math.max(1, Number.parseInt(width, 10) || 40), breakWords);
      case "filter":
        return filterLines(text, { query, mode: filterMode, ignoreCase });
    }
  }, [op, text, prefix, suffix, skipEmpty, start, format, pad, joinSep, trim, delimiter, wsEmpty, width, breakWords, query, filterMode, ignoreCase]);

  const lineCount = splitLines(out).length;
  const small = "h-10 text-base sm:text-sm";
  return (
    <div className="flex flex-col gap-4">
      <ChipChoice label={t.op} value={op} onChange={setOp} grid="grid-cols-2 sm:grid-cols-4 xl:grid-cols-7" options={LINE_OPS.map((o) => ({ value: o, label: t[o] }))} />
      <OptionsBar className="min-h-10">
        {op === "prefix" && (
          <>
            <label className="flex items-center gap-2">
              <span className="text-fg-2">{t.before}</span>
              <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} className={`${small} w-28`} autoComplete="off" />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-fg-2">{t.after}</span>
              <Input value={suffix} onChange={(e) => setSuffix(e.target.value)} className={`${small} w-28`} autoComplete="off" />
            </label>
            <Switch label={t.skipEmpty} checked={skipEmpty} onChange={(e) => setSkipEmpty(e.target.checked)} />
          </>
        )}
        {op === "number" && (
          <>
            <InlineSelect id={`${id}-fmt`} label={t.format} value={format} onChange={setFormat} options={FORMATS.map((f) => ({ value: f, label: f.replace("{n}", "1").trim() }))} />
            <div className="flex items-center gap-2">
              <label htmlFor={`${id}-st`} className="text-fg-2">
                {t.start}
              </label>
              <NumberInput id={`${id}-st`} value={Number.parseInt(start, 10) || 0} onChange={(v) => setStart(String(v ?? 0))} min={0} max={1000000} size="sm" className="w-32" />
            </div>
            <Switch label={t.pad} checked={pad} onChange={(e) => setPad(e.target.checked)} />
            <Switch label={t.skipEmpty} checked={skipEmpty} onChange={(e) => setSkipEmpty(e.target.checked)} />
          </>
        )}
        {op === "join" && (
          <>
            <InlineSelect
              id={`${id}-js`}
              label={t.separator}
              value={joinSep}
              onChange={setJoinSep}
              options={(["space", "comma", "commaSpace", "semicolon", "pipe", "none"] as const).map((s) => ({ value: s, label: t[s] }))}
            />
            <Switch label={t.trim} checked={trim} onChange={(e) => setTrim(e.target.checked)} />
          </>
        )}
        {op === "split" && (
          <>
            <label className="flex items-center gap-2">
              <span className="text-fg-2">{t.delimiter}</span>
              <Input value={delimiter} onChange={(e) => setDelimiter(e.target.value)} className={`${small} w-24 font-mono`} autoComplete="off" />
            </label>
            <Switch label={t.trim} checked={trim} onChange={(e) => setTrim(e.target.checked)} />
          </>
        )}
        {op === "remove-empty" && <Switch label={t.wsEmpty} checked={wsEmpty} onChange={(e) => setWsEmpty(e.target.checked)} />}
        {op === "wrap" && (
          <>
            <SliderField
              id={`${id}-w`}
              label={t.width}
              value={width}
              onChange={setWidth}
              parse={(v) => {
                const x = Number.parseInt(v, 10);
                return Number.isFinite(x) ? x : null;
              }}
              format={String}
              min={10}
              max={160}
              suffix={t.chars}
              inputMode="numeric"
              className="w-full max-w-md"
            />
            <Switch label={t.breakWords} checked={breakWords} onChange={(e) => setBreakWords(e.target.checked)} />
          </>
        )}
        {op === "filter" && (
          <>
            <label className="flex items-center gap-2">
              <span className="text-fg-2">{t.query}</span>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className={`${small} w-36`} autoComplete="off" />
            </label>
            <InlineSelect
              id={`${id}-fm`}
              label={t.mode}
              value={filterMode}
              onChange={setFilterMode}
              options={[
                { value: "keep", label: t.keep },
                { value: "remove", label: t.remove },
              ]}
            />
            <Switch label={t.ignoreCase} checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} />
          </>
        )}
      </OptionsBar>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} mono />
        <OutputPanel locale={locale} value={out} filename="lines.txt" title={`${TX[locale].output} · ${countLabel(locale, out ? lineCount : 0, TX[locale].lines)}`} />
      </TwoPane>
    </div>
  );
}
