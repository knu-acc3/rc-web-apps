"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { copyText } from "@/lib/clipboard";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";

const T = {
  ru: { search: "Поиск по имени, символу или коду", ph: "copy, ©, 169, U+00A9, стрелка…", found: "найдено", more: "Показаны первые 300 — уточните запрос", hint: "Нажмите на строку, чтобы скопировать сущность", copied: "скопировано", loading: "Загрузка таблицы…" },
  en: { search: "Search by name, character or code", ph: "copy, ©, 169, U+00A9, arrow…", found: "found", more: "Showing the first 300 — refine the search", hint: "Click a row to copy the entity", copied: "copied", loading: "Loading the table…" },
} as const;

const LIMIT = 300;
const cpOf = (s: string) => [...s].map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`).join(" ");

export default function EntityTable({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [rows, setRows] = useState<[string, string][] | null>(null);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    import("./lib/html").then((m) => alive && setRows(m.entityRows()));
    return () => {
      alive = false;
    };
  }, []);

  const found = useMemo(() => {
    if (!rows) return [];
    const s = q.trim();
    if (!s) return rows;
    const low = s.toLowerCase().replace(/^&|;$/g, "");
    const num = /^\d+$/.test(s) ? Number(s) : /^(u\+|0x|&#x)?[0-9a-f]{2,6};?$/i.test(s) && /[a-f]|u\+|0x|#x/i.test(s) ? parseInt(s.replace(/^(u\+|0x|&#x)/i, "").replace(";", ""), 16) : null;
    return rows.filter(([n, c]) => n.toLowerCase().includes(low) || c === s || (num !== null && c.codePointAt(0) === num));
  }, [rows, q]);

  return (
    <Panel className="p-4 sm:p-6">
      <Field label={t.search} htmlFor={`${id}-q`}>
        <Input id={`${id}-q`} size="lg" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} autoComplete="off" spellCheck={false} />
      </Field>
      <p className="mt-2 text-[0.8125rem] text-fg-3" aria-live="polite">
        {rows ? `${t.found}: ${formatNumber(locale, found.length)} · ${t.hint}` : t.loading}
      </p>
      {rows && (
        <ul className="mt-3 grid gap-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {found.slice(0, LIMIT).map(([n, c]) => (
            <li key={n} className="min-w-0">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[0.75rem] px-3 py-2 text-left transition-[background-color,transform] duration-150 hover:bg-surface-2 active:bg-accent-container motion-safe:active:scale-[0.98]"
                onClick={async () => {
                  if (await copyText(`&${n};`)) setCopied(n);
                }}
              >
                <span className="w-10 shrink-0 text-center text-2xl text-fg">{c}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[0.875rem] text-fg">&amp;{n};</span>
                  <span className="block font-mono text-[0.75rem] text-fg-3">
                    {cpOf(c)} · &amp;#{c.codePointAt(0)};{copied === n && <span className="ml-2 font-sans text-ok">{t.copied}</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {found.length > LIMIT && <p className="mt-2 text-[0.8125rem] text-fg-3">{t.more}</p>}
    </Panel>
  );
}
