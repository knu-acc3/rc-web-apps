"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { KIT_T } from "@/sections/code/kit/labels";
import { CopyButton } from "@/ui/copy-button";
import { Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import * as E from "./escape";

type Target = "js" | "js1" | "tpl" | "json" | "sql" | "mysql" | "regex" | "html" | "attr" | "xml" | "shell" | "csv";

const LABEL: Record<Target, string> = {
  js: 'JavaScript "…"',
  js1: "JavaScript '…'",
  tpl: "JavaScript `…`",
  json: "JSON",
  sql: "SQL '…'",
  mysql: "MySQL (\\)",
  regex: "RegExp",
  html: "HTML",
  attr: "HTML attribute",
  xml: "XML",
  shell: "Shell (bash, sh)",
  csv: "CSV",
};

const T = {
  ru: {
    input: "Текст",
    target: "Формат",
    dir: "Направление",
    escape: "Экранировать",
    unescape: "Убрать экранирование",
    sql: "Для защиты от SQL-инъекций используйте параметризованные запросы, а не экранирование.",
    regex: "Результат совпадает с исходной строкой буквально — как RegExp.escape.",
  },
  en: {
    input: "Text",
    target: "Format",
    dir: "Direction",
    escape: "Escape",
    unescape: "Unescape",
    sql: "Use parameterized queries, not escaping, to prevent SQL injection.",
    regex: "The result matches the original string literally — like RegExp.escape.",
  },
} as const;

function run(target: Target, dir: "escape" | "unescape", s: string): string {
  if (dir === "escape") {
    switch (target) {
      case "js":
        return E.escapeJs(s, '"');
      case "js1":
        return E.escapeJs(s, "'");
      case "tpl":
        return E.escapeJs(s, "`");
      case "json":
        return JSON.stringify(s);
      case "sql":
        return E.escapeSql(s);
      case "mysql":
        return E.escapeSql(s, true);
      case "regex":
        return E.escapeRegex(s);
      case "html":
        return E.escapeHtml(s);
      case "attr":
        return E.escapeHtml(s, true);
      case "xml":
        return E.escapeXml(s);
      case "shell":
        return E.escapeShell(s);
      default:
        return E.escapeCsv(s);
    }
  }
  switch (target) {
    case "js":
    case "js1":
    case "tpl":
    case "json":
    case "mysql":
      return target === "mysql" ? E.unescapeJs(E.unescapeSql(s)) : E.unescapeJs(s);
    case "sql":
      return E.unescapeSql(s);
    case "regex":
      return E.unescapeRegex(s);
    case "html":
    case "attr":
    case "xml":
      return E.unescapeXml(s);
    case "shell":
      return E.unescapeShell(s);
    default:
      return E.unescapeCsv(s);
  }
}

export default function StringEscape({ locale, target: target0 = "js" }: { locale: Locale; target?: Target }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(locale === "ru" ? 'Он сказал: "Привет!"\nПуть: C:\\temp\\it\'s' : 'He said: "Hi!"\nPath: C:\\temp\\it\'s');
  const [target, setTarget] = useState<Target>(target0);
  const [dir, setDir] = useState<"escape" | "unescape">("escape");
  const out = useMemo(() => run(target, dir, text), [target, dir, text]);

  return (
    <Panel className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented
          label={t.dir}
          value={dir}
          onChange={(d) => {
            setText(out);
            setDir(d);
          }}
          options={[
            { value: "escape", label: t.escape },
            { value: "unescape", label: t.unescape },
          ]}
          size="sm"
        />
        <label className="flex items-center gap-2 text-sm text-fg-2">
          {t.target}
          <Select value={target} size="sm" className="w-48" onChange={(e) => setTarget(e.target.value as Target)}>
            {(Object.keys(LABEL) as Target[]).map((k) => (
              <option key={k} value={k}>
                {LABEL[k]}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <CodeEditor id={`${id}-in`} locale={locale} label={t.input} value={text} onChange={setText} rows={5} wrap />
      <div className="mt-4 rounded-[10px] bg-surface-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-fg-2">{LABEL[target]}</span>
          <CopyButton value={out} label={KIT_T[locale].copy} copiedLabel={KIT_T[locale].copied} variant="outline" />
        </div>
        <pre className="mt-2 max-h-[40vh] overflow-auto font-mono text-lg font-semibold break-all whitespace-pre-wrap text-fg" aria-live="polite">
          {out}
        </pre>
      </div>
      {(target === "sql" || target === "mysql") && (
        <Notice tone="warn" className="mt-3">
          {t.sql}
        </Notice>
      )}
      {target === "regex" && dir === "escape" && <p className="mt-3 text-[13px] text-fg-3">{t.regex}</p>}
    </Panel>
  );
}
