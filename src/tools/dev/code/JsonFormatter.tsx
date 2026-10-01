"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber, plural } from "@/i18n/format";
import { CodeEditor } from "@/tools/dev/shared/CodeEditor";
import { useLiveTask } from "@/tools/dev/shared/hooks";
import { outputLabels, positionLabel } from "@/tools/dev/shared/labels";
import type { JsonWarning } from "@/tools/dev/shared/json";
import { Opt, OptionsRow, Pane } from "@/tools/dev/shared/Pane";
import { CodeOutput } from "@/ui/code-output";
import { CopyButton } from "@/ui/copy-button";
import { Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ErrorBox, failOf, useCodeWorker } from "./ui/ErrorBox";
import { JsonTree } from "./ui/JsonTree";
import type { JsonFormatResult } from "./lib/run";
import { SAMPLES } from "./lib/langs";
import { CODE_T } from "./content/text";

export interface JsonFormatterProps {
  locale: Locale;
  /** Initial indentation: "2" | "4" | "tab" | "0" (minified) */
  indent?: string;
}

export default function JsonFormatter({ locale, indent: initialIndent = "2" }: JsonFormatterProps) {
  const t = CODE_T[locale];
  const id = useId();
  const [text, setText] = useState(SAMPLES.json);
  const [indent, setIndent] = useState(initialIndent);
  const [sortKeys, setSortKeys] = useState(false);
  const [ascii, setAscii] = useState(false);
  const [view, setView] = useState<"text" | "tree">("text");
  const client = useCodeWorker();
  const ind: number | "\t" = indent === "tab" ? "\t" : Number(indent);
  const live = useLiveTask<JsonFormatResult>(`${indent}|${sortKeys}|${ascii}|${view}\u0000${text}`, text.trim() ? () => client.run("json", { text, indent: ind, sortKeys, ascii, tree: view === "tree" }, { timeoutMs: 60000 }) : null, 250);
  const res = live.value ?? (text.trim() ? live.stale : undefined);
  const fail = failOf(live.error);
  const editorId = `${id}-in`;
  const output = fail ? "" : (res?.output ?? "");

  const warnings = groupWarnings(res && !fail ? res.warnings : []);
  const labels = outputLabels(locale);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeEditor id={editorId} locale={locale} label={`${t.input}: JSON`} value={text} onChange={setText} rows={18} sample={SAMPLES.json} fileAccept=".json,.txt,application/json" invalid={!!fail} />
        {view === "text" ? (
          <CodeOutput value={output} title={t.result} filename="formatted.json" mime="application/json" labels={labels} minRows={18} className={live.pending ? "[&>textarea]:text-fg-3" : undefined} />
        ) : (
          <Pane title={t.result} actions={<CopyButton value={output} label={labels.copy} copiedLabel={labels.copied} variant="secondary" compact />}>
            <div className={live.pending ? "opacity-70" : undefined}>{res?.tree && !fail ? <JsonTree root={res.tree} locale={locale} label={t.tree} /> : <div className="min-h-32" />}</div>
          </Pane>
        )}
      </div>

      {fail && <ErrorBox locale={locale} fail={fail} text={text} editorId={editorId} />}
      {warnings.length > 0 && (
        <Notice tone="warn">
          <ul className="flex flex-col gap-1">
            {warnings.map((w) => (
              <li key={w.code}>
                {t.warns[w.code] ?? w.code}
                {w.first.key !== undefined ? ` «${w.first.key}»` : ""} — {positionLabel(locale, w.first.line, w.first.col)}
                {w.count > 1 ? ` (${formatNumber(locale, w.count)})` : ""}
              </li>
            ))}
          </ul>
        </Notice>
      )}

      <OptionsRow>
        <Segmented
          size="sm"
          label={`${t.text} / ${t.tree}`}
          value={view}
          onChange={setView}
          options={[
            { value: "text", label: t.text },
            { value: "tree", label: t.tree },
          ]}
        />
        <Opt label={t.indent} group>
          <Segmented
            size="sm"
            label={t.indent}
            value={indent}
            onChange={setIndent}
            options={[
              { value: "2", label: t.spaces("2") },
              { value: "4", label: t.spaces("4") },
              { value: "tab", label: t.tab },
              { value: "0", label: t.minified },
            ]}
          />
        </Opt>
        <Switch label={t.sortKeys} checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
        <Switch label={t.ascii} checked={ascii} onChange={(e) => setAscii(e.target.checked)} />
        {res && !fail && (
          <span className="tabular ml-auto text-[0.8125rem] text-fg-3">
            {formatNumber(locale, res.nodes)} {plural(locale, res.nodes, t.nodes)} · {t.depth} {formatNumber(locale, res.depth)} · {formatBytes(locale, res.bytes)}
          </span>
        )}
      </OptionsRow>
    </div>
  );
}

function groupWarnings(ws: JsonWarning[]): { code: string; first: JsonWarning; count: number }[] {
  const m = new Map<string, { code: string; first: JsonWarning; count: number }>();
  for (const w of ws) {
    const g = m.get(w.code);
    if (g) g.count++;
    else m.set(w.code, { code: w.code, first: w, count: 1 });
  }
  return [...m.values()];
}
