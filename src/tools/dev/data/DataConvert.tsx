"use client";

import { ArrowLeftRight } from "lucide-react";
import Link from "@/ui/link";
import { useId, useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { useLiveTask, useWorkerClient } from "@/tools/dev/shared/hooks";
import { outputLabels, positionLabel } from "@/tools/dev/shared/labels";
import { Opt, OptionsRow } from "@/tools/dev/shared/Pane";
import { JobError } from "@/tools/dev/shared/worker-client";
import { buttonClass } from "@/ui/button";
import { CodeOutput } from "@/ui/code-output";
import { Input, Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import type { ConvertOptions, Fmt, Warn } from "./lib/convert";
import { FORMAT_META, SAMPLES } from "./content/samples";

const T = {
  ru: {
    input: "Исходные данные",
    reverse: "Обратное преобразование",
    delimiter: "Разделитель",
    auto: "авто",
    tab: "табуляция",
    header: "Первая строка — заголовки",
    typed: "Числа и true/false",
    nested: "Вложенность по точкам",
    bom: "BOM для Excel",
    guard: "Защита от формул",
    arrays: "Массивы",
    arrayModes: { index: "в колонки (tags.0)", join: "через «; »", json: "как JSON" },
    indent: "Отступ",
    minified: "в одну строку",
    root: "Корневой элемент",
    rootType: "Имя типа",
    style: "Объявление",
    upper: "КЛЮЧИ ЗАГЛАВНЫМИ",
    working: "Преобразуем…",
    errors: {
      "csv-unclosed-quote": "Незакрытая кавычка в CSV",
      "yaml-syntax": "Ошибка YAML",
      "toml-syntax": "Ошибка TOML",
      "toml-stringify": "Не удалось записать TOML",
      "json-unexpected-token": "Неожиданный символ в JSON",
      "json-unexpected-end": "JSON обрывается раньше времени",
      "json-expected-comma": "Пропущена запятая",
      "json-expected-colon": "Пропущено двоеточие",
      "json-expected-key": "Ожидалось имя поля в кавычках",
      "json-bad-number": "Неверное число",
      "json-bad-escape": "Неверная escape-последовательность",
      "json-control-char": "Управляющий символ внутри строки — экранируйте его",
      "json-trailing-data": "Лишние данные после JSON",
      "json-too-deep": "Слишком глубокая вложенность",
      "xml-mismatched-tag": "Закрывающий тег не совпадает с открывающим",
      "xml-unclosed-element": "Элемент не закрыт",
      "xml-multiple-roots": "В XML может быть только один корневой элемент",
      "xml-text-outside-root": "Текст вне корневого элемента",
    } as Record<string, string>,
    warns: {
      "json-dup-key": "Повторяющийся ключ — использовано последнее значение",
      "json-comment": "Комментарии в JSON пропущены",
      "json-trailing-comma": "Лишние запятые пропущены",
      "json-single-quote": "Строки в одинарных кавычках приняты",
      "json-bom": "BOM в начале файла пропущен",
      "csv-delimiter": "Разделитель определён автоматически",
      "csv-quote-in-field": "Кавычка внутри поля без экранирования — строка",
      "yaml-multi": "Несколько документов YAML — результат собран в массив",
      "yaml-inf": ".inf/.nan нельзя записать в JSON — оставлены строкой",
      "xml-entities": "Неизвестные сущности оставлены как есть",
      "xml-renamed": "Ключи переименованы в допустимые имена XML",
      "toml-null": "В TOML нет null — поле пропущено",
      "toml-wrapped": "TOML-документ должен быть таблицей — данные помещены в ключ",
      "env-bad-line": "Строка пропущена — нет формата KEY=VALUE",
      "env-unclosed-quote": "Незакрытая кавычка",
      "not-records": "Для таблицы нужен массив объектов",
    } as Record<string, string>,
  },
  en: {
    input: "Input",
    reverse: "Reverse conversion",
    delimiter: "Delimiter",
    auto: "auto",
    tab: "tab",
    header: "First row is a header",
    typed: "Numbers and true/false",
    nested: "Nest by dots",
    bom: "BOM for Excel",
    guard: "Formula guard",
    arrays: "Arrays",
    arrayModes: { index: "as columns (tags.0)", join: "joined with “; ”", json: "as JSON" },
    indent: "Indent",
    minified: "single line",
    root: "Root element",
    rootType: "Type name",
    style: "Declaration",
    upper: "UPPERCASE KEYS",
    working: "Converting…",
    errors: {
      "csv-unclosed-quote": "Unclosed quote in CSV",
      "yaml-syntax": "YAML error",
      "toml-syntax": "TOML error",
      "toml-stringify": "Couldn't write TOML",
      "json-unexpected-token": "Unexpected character in JSON",
      "json-unexpected-end": "JSON ends too early",
      "json-expected-comma": "Missing comma",
      "json-expected-colon": "Missing colon",
      "json-expected-key": "Expected a quoted field name",
      "json-bad-number": "Invalid number",
      "json-bad-escape": "Invalid escape sequence",
      "json-control-char": "Control character inside a string — escape it",
      "json-trailing-data": "Extra data after the JSON value",
      "json-too-deep": "Nesting is too deep",
      "xml-mismatched-tag": "Closing tag doesn't match the opening tag",
      "xml-unclosed-element": "Unclosed element",
      "xml-multiple-roots": "XML may have only one root element",
      "xml-text-outside-root": "Text outside the root element",
    } as Record<string, string>,
    warns: {
      "json-dup-key": "Duplicate key — the last value was used",
      "json-comment": "Comments in JSON were skipped",
      "json-trailing-comma": "Trailing commas were skipped",
      "json-single-quote": "Single-quoted strings were accepted",
      "json-bom": "A BOM at the start was skipped",
      "csv-delimiter": "Delimiter detected automatically",
      "csv-quote-in-field": "An unescaped quote inside a field was kept as text",
      "yaml-multi": "Several YAML documents — collected into an array",
      "yaml-inf": ".inf/.nan can't be JSON numbers — kept as strings",
      "xml-entities": "Unknown entities were kept as they are",
      "xml-renamed": "Keys were renamed to valid XML names",
      "toml-null": "TOML has no null — the field was skipped",
      "toml-wrapped": "A TOML document must be a table — data was put under a key",
      "env-bad-line": "Line skipped — not KEY=VALUE",
      "env-unclosed-quote": "Unclosed quote",
      "not-records": "A table needs an array of objects",
    } as Record<string, string>,
  },
} as const;

export interface DataConvertProps {
  locale: Locale;
  from: Fmt;
  to: Fmt;
  options?: ConvertOptions;
  /** Path of the reverse pair page, if it exists */
  reverse?: string;
}

export default function DataConvert({ locale, from, to, options = {}, reverse }: DataConvertProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(SAMPLES[from]?.[locale] ?? "");
  const [opts, setOpts] = useState<ConvertOptions>({ header: true, indent: 2, ...options });
  const client = useWorkerClient(() => new Worker(new URL("./lib/data.worker.ts", import.meta.url), { type: "module" }));
  const set = <K extends keyof ConvertOptions>(k: K, v: ConvertOptions[K]) => setOpts((p) => ({ ...p, [k]: v }));
  const live = useLiveTask<{ output: string; warnings: Warn[] }>(`${JSON.stringify(opts)}\u0000${text}`, text.trim() ? () => client.run("convert", { from, to, text, opts }, { timeoutMs: 60000 }) : null, 250);
  const res = live.value ?? (text.trim() ? live.stale : undefined);
  const err = live.error instanceof JobError ? (live.error.data as { code: string; line?: number; col?: number; detail?: string }) : null;
  const inM = FORMAT_META[from];
  const outM = FORMAT_META[to];

  const tabularIn = from === "csv" || from === "tsv";
  const tabularOut = to === "csv" || to === "tsv" || to === "markdown" || to === "html";
  const sel = (label: string, value: string, onChange: (v: string) => void, items: [string, string][]) => (
    <Opt label={label} group>
      <Segmented label={label} size="sm" value={value} onChange={onChange} options={items.map(([v, l]) => ({ value: v, label: l }))} />
    </Opt>
  );
  const delims: [string, string][] = [
    ["auto", t.auto],
    [",", ", (,)"],
    [";", "; (;)"],
    ["\t", t.tab],
    ["|", "| (|)"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor id={`${id}-in`} locale={locale} label={`${t.input}: ${inM.label}`} value={text} onChange={setText} rows={16} sample={SAMPLES[from]?.[locale]} fileAccept={`.${inM.ext},.txt,${inM.mime.split(";")[0]}`} invalid={!!err} />
        <CodeOutput value={res?.output ?? ""} title={outM.label} filename={`data.${outM.ext}`} mime={outM.mime} labels={outputLabels(locale)} minRows={16} className={live.pending ? "[&>textarea]:text-fg-3" : undefined} />
      </div>

      {err && (
        <Notice tone="err">
          {t.errors[err.code] ?? err.code}
          {err.line ? ` — ${positionLabel(locale, err.line, err.col)}` : ""}
          {err.detail && !/^\s*$/.test(err.detail) ? `: ${err.detail}` : ""}
        </Notice>
      )}
      {!err && res && res.warnings.length > 0 && (
        <Notice tone="warn">
          {[...new Map(res.warnings.map((w) => [w.code, w])).values()].map((w) => `${t.warns[w.code] ?? w.code}${w.detail ? ` (${w.detail})` : ""}`).join(". ")}.
        </Notice>
      )}

      <OptionsRow>
        {from === "csv" && sel(t.delimiter, opts.delimiter ?? "auto", (v) => set("delimiter", v), delims)}
        {tabularIn && <Switch label={t.header} checked={opts.header !== false} onChange={(e) => set("header", e.target.checked)} />}
        {tabularIn && !tabularOut && <Switch label={t.typed} checked={!!opts.typed} onChange={(e) => set("typed", e.target.checked)} />}
        {tabularIn && !tabularOut && <Switch label={t.nested} checked={!!opts.nested} onChange={(e) => set("nested", e.target.checked)} />}
        {to === "csv" && !tabularIn && sel(t.delimiter, opts.delimiter && opts.delimiter !== "auto" ? opts.delimiter : ",", (v) => set("delimiter", v), delims.slice(1))}
        {(to === "csv" || to === "tsv") && <Switch label={t.bom} checked={!!opts.bom} onChange={(e) => set("bom", e.target.checked)} />}
        {(to === "csv" || to === "tsv") && <Switch label={t.guard} checked={!!opts.injectionGuard} onChange={(e) => set("injectionGuard", e.target.checked)} />}
        {tabularOut && !tabularIn && sel(t.arrays, opts.arrays ?? "index", (v) => set("arrays", v as ConvertOptions["arrays"]), Object.entries(t.arrayModes))}
        {(to === "json" || to === "yaml" || to === "xml") &&
          sel(
            t.indent,
            String(opts.indent ?? 2),
            (v) => set("indent", Number(v)),
            [
              ["2", "2"],
              ["4", "4"],
              ...(to === "json" ? ([["0", t.minified]] as [string, string][]) : []),
            ],
          )}
        {to === "xml" && (
          <Opt label={t.root} htmlFor={`${id}-root`}>
            <Input id={`${id}-root`} size="sm" className="w-40 font-mono" value={opts.root ?? ""} placeholder="root" onChange={(e) => set("root", e.target.value.trim())} />
          </Opt>
        )}
        {(to === "typescript" || to === "zod") && (
          <Opt label={t.rootType} htmlFor={`${id}-root`}>
            <Input id={`${id}-root`} size="sm" className="w-40 font-mono" value={opts.root ?? ""} placeholder="Root" onChange={(e) => set("root", e.target.value.trim())} />
          </Opt>
        )}
        {to === "typescript" &&
          sel(t.style, opts.tsStyle ?? "interface", (v) => set("tsStyle", v as "interface" | "type"), [
            ["interface", "interface"],
            ["type", "type"],
          ])}
        {to === "env" && <Switch label={t.upper} checked={opts.envUpper !== false} onChange={(e) => set("envUpper", e.target.checked)} />}
        {reverse && (
          <Link href={href(locale, [reverse])} className={buttonClass("tonal", "sm", "ml-auto")}>
            <ArrowLeftRight aria-hidden />
            {t.reverse}
          </Link>
        )}
      </OptionsRow>
    </div>
  );
}
