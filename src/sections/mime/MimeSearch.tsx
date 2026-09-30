"use client";

import Link from "@/ui/link";
import { useEffect, useId, useMemo, useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Input, Select } from "@/ui/field";

export interface MimeRow {
  /** extension */
  e: string;
  /** primary type */
  t: string;
  /** category slug */
  c: string;
}

const T = {
  ru: {
    search: "Расширение или MIME-тип",
    placeholder: "Например webp, .docx или application/json",
    cat: "Категория",
    all: "Все категории",
    ext: "Расширение",
    type: "MIME-тип",
    found: ["формат", "формата", "форматов"],
    more: "Ещё в базе mime-db",
    none: "Ничего не найдено. Попробуйте расширение без точки или часть типа, например «image/».",
  },
  en: {
    search: "Extension or MIME type",
    placeholder: "E.g. webp, .docx or application/json",
    cat: "Category",
    all: "All categories",
    ext: "Extension",
    type: "MIME type",
    found: ["format", "formats"],
    more: "More in the mime-db database",
    none: "Nothing found. Try an extension without the dot or part of a type, e.g. “image/”.",
  },
} as const;

function norm(q: string) {
  return q.trim().toLowerCase().replace(/^\*?\./, "");
}

/** "image/" matches types; "web" matches extensions starting with it or types containing it. */
function matches(s: string, ext: string, type: string) {
  return s.includes("/") ? type.includes(s) : ext.startsWith(s) || type.includes(s);
}

export default function MimeSearch({ locale, items, cats, only }: { locale: Locale; items: MimeRow[]; cats?: [string, string][]; only?: string }) {
  const t = T[locale];
  const id = useId();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(only ?? "");
  const [full, setFull] = useState<[string, string][] | null>(null);
  const s = norm(q);

  // The complete mime-db index (~1 200 extensions) is loaded only once someone searches.
  useEffect(() => {
    if (!s || full) return;
    let alive = true;
    import("./data/index.json").then((m) => {
      if (alive) setFull(m.default as [string, string][]);
    });
    return () => {
      alive = false;
    };
  }, [s, full]);

  const rows = useMemo(() => items.filter((r) => (!cat || r.c === cat) && (!s || matches(s, r.e, r.t))), [items, cat, s]);
  const known = useMemo(() => new Set(items.map((r) => r.e)), [items]);
  const extra = useMemo(() => {
    if (!s || !full || only) return [];
    return full.filter(([e, types]) => !known.has(e) && matches(s, e, types)).slice(0, 40);
  }, [s, full, known, only]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_16rem] sm:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${id}-q`} className="text-sm font-medium text-fg-2">
            {t.search}
          </label>
          <Input id={`${id}-q`} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.placeholder} size="lg" autoComplete="off" spellCheck={false} />
        </div>
        {!only && cats && (
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor={`${id}-c`} className="text-sm font-medium text-fg-2">
              {t.cat}
            </label>
            <Select id={`${id}-c`} value={cat} onChange={(e) => setCat(e.target.value)} size="lg">
              <option value="">{t.all}</option>
              {cats.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <p className="text-sm text-fg-3" aria-live="polite">{`${rows.length} ${plural(locale, rows.length, t.found)}`}</p>
      {rows.length > 0 ? (
        <div tabIndex={0} className="tbl">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.ext}</th>
                <th scope="col">{t.type}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.e}>
                  <td className="whitespace-nowrap font-mono font-semibold">
                    <Link href={href(locale, ["mime", r.e])} className="text-accent hover:underline">
                      .{r.e}
                    </Link>
                  </td>
                  <td className="font-mono text-[13px] break-all text-fg">{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        extra.length === 0 && <p className="text-fg-2">{t.none}</p>
      )}
      {extra.length > 0 && (
        <section className="mt-2">
          <h2 className="mb-2 text-sm font-semibold text-fg-2">{t.more}</h2>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {extra.map(([e, types]) => (
              <li key={e} className="flex min-w-0 gap-2">
                <span className="w-20 shrink-0 font-mono text-fg">.{e}</span>
                <span className="min-w-0 font-mono text-[13px] break-all text-fg-2">{types.split("|").join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
