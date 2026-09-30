"use client";

import { CircleCheck } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { CodeEditor } from "@/sections/code/kit/CodeEditor";
import { useLiveTask } from "@/sections/code/kit/hooks";
import { positionLabel } from "@/sections/code/kit/labels";
import { ErrorBox, failOf, useCodeWorker } from "./ErrorBox";
import { LANG_META, type ValidateLang } from "./langs";
import type { ValidateResult } from "./run";
import { CODE_T, type CodeT } from "./text";

export interface ValidatorProps {
  locale: Locale;
  lang: ValidateLang;
}

const SAMPLES: Record<ValidateLang, string> = {
  json: '{\n  "name": "Айгерим",\n  "age": 28,\n  "skills": ["sql", "python"],\n  "address": {\n    "city": "Алматы"\n    "zip": "050000"\n  }\n}\n',
  yaml: "server:\n  host: 0.0.0.0\n  port: 8080\n  debug: off\ncountries:\n  - KZ\n  - NO\nusers:\n  - name: aigerim\n    roles: [admin, editor]\n",
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n  <book id="bk101">\n    <author>Абай Кунанбаев</author>\n    <title>Слова назидания</title>\n  </book>\n  <book id="bk102">\n    <author>Mukhtar Auezov</author>\n    <title>The Path of Abai</titel>\n  </book>\n</catalog>\n',
};

function summaryText(locale: Locale, t: CodeT, lang: ValidateLang, s: ValidateResult["summary"]): string {
  const n = (v: string | number | undefined) => formatNumber(locale, Number(v ?? 0));
  if (lang === "json") return `${t.kinds[String(s.kind)] ?? s.kind} · ${n(s.nodes)} ${plural(locale, Number(s.nodes), t.nodes)} · ${t.depth} ${n(s.depth)}`;
  if (lang === "xml") return `${t.root} <${s.root}> · ${n(s.elements)} ${plural(locale, Number(s.elements), t.elements)}`;
  return `${n(s.docs)} ${plural(locale, Number(s.docs), t.docs)}`;
}

function groupByCode<W extends { code: string }>(ws: W[]): Map<string, W[]> {
  const m = new Map<string, W[]>();
  for (const w of ws) {
    const g = m.get(w.code);
    if (g) g.push(w);
    else m.set(w.code, [w]);
  }
  return m;
}

export default function Validator({ locale, lang }: ValidatorProps) {
  const t = CODE_T[locale];
  const id = useId();
  const meta = LANG_META[lang];
  const [text, setText] = useState(SAMPLES[lang]);
  const client = useCodeWorker();
  const live = useLiveTask<ValidateResult>(text, text.trim() ? () => client.run("validate", { lang, text }, { timeoutMs: 30000 }) : null, 250);
  const fail = failOf(live.error);
  const res = live.value;
  const editorId = `${id}-in`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <CodeEditor id={editorId} locale={locale} label={meta.label} value={text} onChange={setText} rows={18} sample={SAMPLES[lang]} fileAccept={`.${meta.ext},.txt${lang === "yaml" ? ",.yml" : ""}`} invalid={!!fail} />
      <div className="flex min-w-0 flex-col gap-3" aria-live="polite">
        {!text.trim() && <div className="rounded-[10px] bg-surface-2 px-4 py-3 text-sm text-fg-2">{t.empty}</div>}
        {text.trim() && live.pending && !fail && !res && <div className="rounded-[10px] bg-surface-2 px-4 py-3 text-sm text-fg-3">{t.working}</div>}
        {fail && <ErrorBox locale={locale} fail={fail} text={text} editorId={editorId} title={t.invalid(meta.label)} />}
        {res && (
          <div className="rounded-[12px] bg-ok-soft px-5 py-4 text-ok">
            <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <CircleCheck aria-hidden className="size-7 shrink-0" />
              {t.valid(meta.label)}
            </div>
            <div className="tabular mt-1 text-sm text-fg-2">{summaryText(locale, t, lang, res.summary)}</div>
          </div>
        )}
        {res && res.warnings.length > 0 && (
          <ul className="flex flex-col gap-2 rounded-[10px] bg-warn-soft px-4 py-3 text-sm text-warn">
            {[...groupByCode(res.warnings)].map(([code, ws]) => (
              <li key={code}>
                {t.warns[code] ?? code}
                {code !== "json-big-number" && ws.some((w) => w.detail || w.line) ? (
                  <span className="text-fg-2">
                    {": "}
                    {ws
                      .slice(0, 8)
                      .map((w) => [w.detail ? `«${w.detail}»` : "", w.line ? `(${positionLabel(locale, w.line, w.col)})` : ""].filter(Boolean).join(" "))
                      .join(", ")}
                    {ws.length > 8 ? ` ${t.more(formatNumber(locale, ws.length - 8))}` : ""}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
