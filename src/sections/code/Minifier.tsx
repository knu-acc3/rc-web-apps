"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useLiveTask } from "@/sections/code/kit/hooks";
import { outputLabels } from "@/sections/code/kit/labels";
import { CodeOutput } from "@/ui/code-output";
import { Switch } from "@/ui/field";
import { ErrorBox, failOf, useCodeWorker } from "./ErrorBox";
import { LANG_META, SAMPLES, type MinifyLang } from "./langs";
import type { MinifyResult } from "./run";
import { CODE_T } from "./text";

export interface MinifierProps {
  locale: Locale;
  lang: MinifyLang;
}

/** Sample input for the minifiers: the formatted form reads better than the one-line samples. */
const MIN_SAMPLES: Partial<Record<MinifyLang, string>> = {
  json: '{\n  "id": 12345678901234567890,\n  "name": "Алма-Ата",\n  "tags": ["api", "json"],\n  "price": 1500.50,\n  "owner": {\n    "login": "aigerim",\n    "roles": ["admin", "editor"]\n  }\n}\n',
  css: "/*! theme.css | MIT */\n.card {\n  display: flex;\n  gap: 8px;\n  padding: 16px 24px;\n  /* rounded corners */\n  border-radius: 12px;\n}\n\n.card:hover,\n.card:focus-within {\n  box-shadow: 0 2px 8px rgb(0 0 0 / 0.12);\n}\n\n@media (max-width: 600px) {\n  .card {\n    width: calc(100% - 32px);\n  }\n}\n",
  javascript: '/*! app.js | MIT */\n// Returns names of adult users\nfunction adults(list, min = 18) {\n  return list\n    .filter((u) => u.age >= min)\n    .map(({ name }) => name);\n}\n\nconst users = [\n  { name: "Aigerim", age: 28 },\n  { name: "Nurlan", age: 16 },\n];\nconsole.log(`Adults: ${adults(users).join(", ")}`);\n',
  html: '<!DOCTYPE html>\n<html lang="ru">\n  <head>\n    <meta charset="utf-8">\n    <title>Пример</title>\n    <style>\n      body { font-family: system-ui; margin: 0; }\n    </style>\n  </head>\n  <body>\n    <!-- main card -->\n    <div class="card">\n      <h1>Привет!</h1>\n      <p>Это <b>пример</b> страницы.</p>\n      <pre>  отступы   сохраняются  </pre>\n    </div>\n  </body>\n</html>\n',
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n  <!-- books -->\n  <book id="bk101">\n    <author>Абай Кунанбаев</author>\n    <title>Слова назидания</title>\n  </book>\n</catalog>\n',
  sql: "-- paid orders per user\nSELECT\n  u.id,\n  u.name,\n  COUNT(o.id) AS orders\nFROM users u\n  LEFT JOIN orders o ON o.user_id = u.id\nWHERE o.status = 'paid  and  shipped'\nGROUP BY u.id, u.name;\n",
};

export default function Minifier({ locale, lang }: MinifierProps) {
  const t = CODE_T[locale];
  const id = useId();
  const meta = LANG_META[lang];
  const sample = MIN_SAMPLES[lang] ?? SAMPLES[lang];
  const [text, setText] = useState(sample);
  const [keep, setKeep] = useState(lang !== "html");
  const client = useCodeWorker();
  const live = useLiveTask<MinifyResult>(`${keep}\u0000${text}`, text.trim() ? () => client.run("minify", { lang, text, keepComments: keep }, { timeoutMs: 30000 }) : null, 250);
  const res = live.value ?? (text.trim() ? live.stale : undefined);
  const fail = failOf(live.error);
  const editorId = `${id}-in`;
  const saved = res && res.before ? 1 - res.after / res.before : 0;
  const gzSaved = res && res.gzBefore && res.gzAfter !== null ? 1 - res.gzAfter / res.gzBefore : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor id={editorId} locale={locale} label={`${t.input}: ${meta.label}`} value={text} onChange={setText} rows={16} sample={sample} fileAccept={`.${meta.ext},.txt`} invalid={!!fail} />
        <CodeOutput value={fail ? "" : (res?.output ?? "")} title={t.result} filename={`min.${meta.ext}`} mime={meta.mime} labels={outputLabels(locale)} minRows={16} className={live.pending ? "[&>textarea]:text-fg-3" : undefined} />
      </div>

      {fail && <ErrorBox locale={locale} fail={fail} text={text} editorId={editorId} />}

      {res && !fail && (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2 rounded-[0.75rem] bg-surface-2 px-5 py-4" aria-live="polite">
          <div>
            <div className="text-[0.8125rem] font-medium text-fg-2">{t.saved}</div>
            <div className="tabular text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{formatNumber(locale, saved, { style: "percent", maximumFractionDigits: 1 })}</div>
          </div>
          <div className="tabular pb-1 text-sm text-fg-2">
            {formatBytes(locale, res.before)} → <span className="font-semibold text-fg">{formatBytes(locale, res.after)}</span>
            {res.gzBefore !== null && res.gzAfter !== null && (
              <span className="text-fg-3">
                {" "}
                · {t.gzip} {formatBytes(locale, res.gzBefore)} → {formatBytes(locale, res.gzAfter)}
                {gzSaved !== null ? ` (${formatNumber(locale, gzSaved, { style: "percent", maximumFractionDigits: 1 })})` : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {(lang === "css" || lang === "javascript" || lang === "html") && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2">
          <Switch label={lang === "html" ? t.keepComments : t.keepLicense} checked={keep} onChange={(e) => setKeep(e.target.checked)} />
        </div>
      )}
    </div>
  );
}
