"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Textarea } from "@/ui/field";
import { Badge, Panel } from "@/ui/panel";
import { analyze, compareSpec, specText, type PartKind } from "./lib/specificity";

const T = {
  ru: {
    input: "Селекторы — по одному на строку или через запятую",
    winner: "Побеждает",
    error: "Ошибка в селекторе рядом с символом",
    a: "ID",
    b: "классы, атрибуты, псевдоклассы",
    c: "теги и псевдоэлементы",
    kinds: {
      id: "ID",
      class: "класс",
      attribute: "атрибут",
      "pseudo-class": "псевдокласс",
      "pseudo-element": "псевдоэлемент",
      type: "тег",
      universal: "*, не считается",
      nesting: "&, не считается",
      functional: "берёт максимум из аргументов",
    } as Record<PartKind, string>,
    empty: "Введите хотя бы один селектор",
  },
  en: {
    input: "Selectors — one per line or comma-separated",
    winner: "Wins",
    error: "Selector error near",
    a: "IDs",
    b: "classes, attributes, pseudo-classes",
    c: "types and pseudo-elements",
    kinds: {
      id: "ID",
      class: "class",
      attribute: "attribute",
      "pseudo-class": "pseudo-class",
      "pseudo-element": "pseudo-element",
      type: "type",
      universal: "*, counts zero",
      nesting: "&, counts zero",
      functional: "takes its most specific argument",
    } as Record<PartKind, string>,
    empty: "Enter at least one selector",
  },
} as const;

export default function SpecificityCalculator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("#nav .menu > li:hover a\nul li a.active\n:is(#main, .content) p::first-line\n:where(.card) h2");
  const results = analyze(text);
  const valid = results.filter((r) => !r.error);
  const best = valid.reduce<(typeof valid)[number] | null>((m, r) => (!m || compareSpec(r.spec, m.spec) > 0 ? r : m), null);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-in`} className="text-sm font-medium text-fg-2">
          {t.input}
        </label>
        <Textarea id={`${id}-in`} value={text} onChange={(e) => setText(e.target.value)} rows={6} className="text-base sm:text-[0.9375rem]" />
        <p className="text-sm text-fg-3">
          (a, b, c) = ({t.a}, {t.b}, {t.c})
        </p>
      </div>
      {results.length === 0 ? (
        <p className="text-fg-3">{t.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3" aria-live="polite">
          {results.map((r, i) => {
            const win = best && r === best && valid.length > 1;
            return (
              <li key={i}>
                <Panel className={cn("flex flex-col gap-2 p-4 transition-shadow sm:flex-row sm:items-start sm:justify-between sm:p-5", win && "ring-2 ring-accent")}>
                  <div className="min-w-0">
                    <code className="block font-mono text-[0.9375rem] break-all text-fg">{r.selector}</code>
                    {r.error ? (
                      <p className="mt-1 text-sm text-err">
                        {t.error} «{r.error}»
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {r.parts.map((p, k) => (
                          <li key={k} className="rounded-[0.5rem] bg-surface-2 px-2 py-1 text-xs text-fg-2" title={t.kinds[p.kind]}>
                            <code className="font-mono text-fg">{p.text}</code> <span className="text-fg-3">{specText(p.spec)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {!r.error && (
                    <div className="flex shrink-0 items-center gap-2">
                      {win && <Badge tone="accent">{t.winner}</Badge>}
                      <span className={cn("tabular font-mono text-3xl font-bold", win ? "text-accent" : "text-fg")}>({specText(r.spec)})</span>
                    </div>
                  )}
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
