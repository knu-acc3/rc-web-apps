"use client";

import { ArrowLeftRight, ArrowUpDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { KIT_T } from "@/tools/dev/shared/labels";
import { Opt, Pane } from "@/tools/dev/shared/Pane";
import { IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import * as E from "./lib/escape";

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

  const flip = (d: "escape" | "unescape") => {
    if (d === dir) return;
    setText(out);
    setDir(d);
  };

  return (
    <Panel className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Segmented
          label={t.dir}
          value={dir}
          onChange={flip}
          options={[
            { value: "escape", label: t.escape },
            { value: "unescape", label: t.unescape },
          ]}
        />
        <Opt label={t.target} className="text-sm text-fg-2">
          <Select value={target} onChange={(e) => setTarget(e.target.value as Target)}>
            {(Object.keys(LABEL) as Target[]).map((k) => (
              <option key={k} value={k}>
                {LABEL[k]}
              </option>
            ))}
          </Select>
        </Opt>
      </div>
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-3">
        <CodeEditor id={`${id}-in`} locale={locale} label={dir === "escape" ? t.input : LABEL[target]} value={text} onChange={setText} rows={6} wrap />
        <div className="flex items-center justify-center">
          <IconButton
            variant="tonal"
            label={dir === "escape" ? t.unescape : t.escape}
            onClick={() => flip(dir === "escape" ? "unescape" : "escape")}
            icon={
              <>
                <ArrowUpDown aria-hidden className="lg:hidden" />
                <ArrowLeftRight aria-hidden className="max-lg:hidden" />
              </>
            }
          />
        </div>
        <Pane title={dir === "escape" ? LABEL[target] : t.input} actions={<CopyButton value={out} label={KIT_T[locale].copy} copiedLabel={KIT_T[locale].copied} variant="secondary" compact />}>
          <pre className="max-h-[45vh] min-h-24 flex-1 overflow-auto px-4 py-3 font-mono text-lg font-semibold break-all whitespace-pre-wrap text-fg" aria-live="polite">
            {out}
          </pre>
        </Pane>
      </div>
      {(target === "sql" || target === "mysql") && <Notice tone="warn">{t.sql}</Notice>}
      {target === "regex" && dir === "escape" && <p className="text-[0.8125rem] text-fg-3">{t.regex}</p>}
    </Panel>
  );
}
