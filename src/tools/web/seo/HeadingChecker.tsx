"use client";

import { useDeferredValue, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Field, Textarea } from "@/ui/field";
import { extractHeadings, outlineIssues, type OutlineIssue } from "./lib/outline";
import { Panel } from "@/ui/panel";
import { Issues, Split } from "./ui/kit";

const T = {
  ru: {
    input: "HTML-код страницы",
    hint: "Откройте страницу, нажмите Ctrl+U (исходный код), скопируйте всё и вставьте сюда",
    ph: "<html>…</html>",
    outline: "Структура заголовков",
    none: "Заголовков h1–h6 не найдено.",
    empty: "(пустой заголовок)",
    count: (n: number) => `${formatNumber("ru", n)} ${plural("ru", n, ["заголовок", "заголовка", "заголовков"])}`,
    ok: "Структура в порядке: один H1 и уровни идут без пропусков.",
    issue: (i: OutlineIssue): string =>
      ({
        noH1: "Нет H1 — у страницы должен быть один главный заголовок",
        manyH1: "Несколько H1 — оставьте один главный заголовок, остальные сделайте H2",
        firstNotH1: "Первый заголовок на странице — не H1; обычно H1 идёт первым",
        skip: `Пропуск уровня: после H${i.from} сразу H${i.to}`,
        empty: "Пустой заголовок",
        longH1: "H1 длиннее 70 символов — сократите до сути",
        duplicate: "Повтор: такой же заголовок уже есть на этом уровне",
      })[i.kind],
  },
  en: {
    input: "Page HTML",
    hint: "Open the page, press Ctrl+U (view source), copy everything and paste it here",
    ph: "<html>…</html>",
    outline: "Heading outline",
    none: "No h1–h6 headings found.",
    empty: "(empty heading)",
    count: (n: number) => `${formatNumber("en", n)} ${plural("en", n, ["heading", "headings"])}`,
    ok: "The structure is fine: one H1 and no skipped levels.",
    issue: (i: OutlineIssue): string =>
      ({
        noH1: "No H1 — a page should have one main heading",
        manyH1: "Several H1s — keep one main heading and make the rest H2",
        firstNotH1: "The first heading isn't the H1; usually the H1 comes first",
        skip: `Skipped level: H${i.from} is followed by H${i.to}`,
        empty: "Empty heading",
        longH1: "The H1 is over 70 characters — trim it to the point",
        duplicate: "Duplicate: the same heading already appears at this level",
      })[i.kind],
  },
} as const;

export default function HeadingChecker({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [html, setHtml] = useState("");
  const deferred = useDeferredValue(html);
  const hs = extractHeadings(deferred);
  const issues = outlineIssues(hs);
  const flagged = new Set(issues.filter((i) => i.index >= 0).map((i) => i.index));

  return (
    <Split
      input={
        <Field label={t.input} htmlFor={`${id}-h`} hint={t.hint}>
          <Textarea id={`${id}-h`} value={html} onChange={(e) => setHtml(e.target.value)} rows={12} className="font-mono text-sm" spellCheck={false} placeholder={t.ph} />
        </Field>
      }
    >
      {deferred.trim() && (
        <>
          <div aria-live="polite">{issues.length ? <Issues items={[...new Set(issues.map(t.issue))]} /> : hs.length ? <Issues tone="ok" items={[t.ok]} /> : null}</div>
          <Panel className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-fg">{t.outline}</h2>
              <span className="text-[0.8125rem] text-fg-3">{t.count(hs.length)}</span>
            </div>
            {hs.length ? (
              <ol className="mt-3 flex flex-col gap-1.5">
                {hs.map((h, i) => (
                  <li key={i} className="flex items-baseline gap-2" style={{ paddingLeft: `${Math.min(h.level - 1, 5) * 1.125}rem` }}>
                    <span
                      className={cn(
                        "shrink-0 rounded-[0.375rem] px-1.5 font-mono text-xs font-semibold",
                        flagged.has(i) ? "bg-warn-soft text-warn" : h.level === 1 ? "bg-accent-soft text-accent" : "bg-surface-2 text-fg-2",
                      )}
                    >
                      H{h.level}
                    </span>
                    <span className={cn("min-w-0 break-words", h.level === 1 ? "text-[1.0625rem] font-semibold text-fg" : "text-[0.9375rem] text-fg", !h.text && "text-fg-3 italic")}>{h.text || t.empty}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-[0.9375rem] text-fg-3">{t.none}</p>
            )}
          </Panel>
        </>
      )}
    </Split>
  );
}
