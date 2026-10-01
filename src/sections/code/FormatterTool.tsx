"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useLiveTask } from "@/sections/code/kit/hooks";
import { outputLabels } from "@/sections/code/kit/labels";
import { CodeOutput } from "@/ui/code-output";
import { Select, Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { ErrorBox, failOf, useCodeWorker } from "./ui/ErrorBox";
import { LANG_META, SAMPLES, SQL_DIALECTS, type FormatLang, type FormatOptions, type IndentOpt } from "./lib/langs";
import { CODE_T } from "./content/text";

const WIDTH_LANGS = new Set<FormatLang>(["html", "css", "scss", "less", "javascript", "typescript", "graphql"]);

export interface FormatterToolProps {
  locale: Locale;
  lang: FormatLang;
  /** SQL dialect preset (sql-formatter language id) */
  dialect?: string;
  /** Initial input instead of the language sample */
  sample?: string;
}

export default function FormatterTool({ locale, lang, dialect, sample: preset }: FormatterToolProps) {
  const t = CODE_T[locale];
  const id = useId();
  const meta = LANG_META[lang];
  const sample = preset ?? SAMPLES[lang];
  const [text, setText] = useState(sample);
  const [opts, setOpts] = useState<FormatOptions>({ indent: "2", printWidth: 80, singleQuote: false, semi: true, dialect: dialect ?? "sql", keywordCase: "upper" });
  const set = <K extends keyof FormatOptions>(k: K, v: FormatOptions[K]) => setOpts((p) => ({ ...p, [k]: v }));
  const client = useCodeWorker();
  const live = useLiveTask<{ output: string; warnings: string[] }>(`${JSON.stringify(opts)}\u0000${text}`, text.trim() ? () => client.run("format", { lang, text, opts }, { timeoutMs: 30000 }) : null, 300);
  const res = live.value ?? (text.trim() ? live.stale : undefined);
  const fail = failOf(live.error);
  const editorId = `${id}-in`;

  const sel = (label: string, value: string, onChange: (v: string) => void, items: [string, string][], w = "w-36") => (
    <label className="flex items-center gap-2">
      {label}
      <Select value={value} size="sm" className={w} onChange={(e) => onChange(e.target.value)}>
        {items.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </Select>
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor id={editorId} locale={locale} label={`${t.input}: ${meta.label}`} value={text} onChange={setText} rows={18} sample={sample} fileAccept={`.${meta.ext},.txt`} invalid={!!fail} />
        <CodeOutput value={fail ? "" : (res?.output ?? "")} title={`${t.result}: ${meta.label}`} filename={`formatted.${meta.ext}`} mime={meta.mime} labels={outputLabels(locale)} minRows={18} className={live.pending ? "[&>textarea]:text-fg-3" : undefined} />
      </div>

      {fail && <ErrorBox locale={locale} fail={fail} text={text} editorId={editorId} />}
      {!fail && res && res.warnings.length > 0 && <Notice tone="warn">{res.warnings.map((w) => t.warns[w] ?? w).join(". ")}.</Notice>}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2">
        {lang === "sql" &&
          sel(
            t.dialect,
            opts.dialect ?? "sql",
            (v) => set("dialect", v),
            SQL_DIALECTS.map((d) => [d.id, d.label]),
            "w-52",
          )}
        {lang === "sql" &&
          sel(t.keywords, opts.keywordCase ?? "upper", (v) => set("keywordCase", v as FormatOptions["keywordCase"]), [
            ["upper", t.upper],
            ["lower", t.lower],
            ["preserve", t.preserve],
          ])}
        {sel(t.indent, opts.indent, (v) => set("indent", v as IndentOpt), [
          ["2", t.spaces("2")],
          ["4", t.spaces("4")],
          ["tab", t.tab],
        ])}
        {WIDTH_LANGS.has(lang) &&
          sel(
            t.width,
            String(opts.printWidth ?? 80),
            (v) => set("printWidth", Number(v)),
            ["80", "100", "120"].map((w) => [w, w]),
            "w-24",
          )}
        {(lang === "javascript" || lang === "typescript") &&
          sel(t.quotes, opts.singleQuote ? "single" : "double", (v) => set("singleQuote", v === "single"), [
            ["double", `"…" ${t.double}`],
            ["single", `'…' ${t.single}`],
          ])}
        {(lang === "javascript" || lang === "typescript") && <Switch label={t.semi} checked={opts.semi !== false} onChange={(e) => set("semi", e.target.checked)} />}
      </div>
    </div>
  );
}
