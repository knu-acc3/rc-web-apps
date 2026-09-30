"use client";

import Link from "@/ui/link";
import { useId, useMemo, useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Input } from "@/ui/field";
import { Segmented } from "@/ui/segmented";

export interface CodeRow {
  /** code */
  c: number;
  /** reason phrase */
  n: string;
  /** short meaning in the current locale */
  t: string;
  /** class range: "1xx"…"5xx" */
  k: string;
  /** unofficial / reserved flag */
  u?: 1;
}

const T = {
  ru: {
    search: "Код или название",
    placeholder: "Например 404, timeout или редирект",
    all: "Все",
    classes: "Класс кодов",
    code: "Код",
    name: "Название",
    meaning: "Значение",
    unofficial: "нестандартный",
    none: "Ничего не найдено — попробуйте номер кода или часть названия.",
    found: ["код", "кода", "кодов"],
  },
  en: {
    search: "Code or name",
    placeholder: "E.g. 404, timeout or redirect",
    all: "All",
    classes: "Code class",
    code: "Code",
    name: "Name",
    meaning: "Meaning",
    unofficial: "non-standard",
    none: "Nothing found — try a code number or part of a name.",
    found: ["code", "codes"],
  },
} as const;

const tone: Record<string, string> = {
  "1xx": "text-fg-2",
  "2xx": "text-ok",
  "3xx": "text-accent",
  "4xx": "text-warn",
  "5xx": "text-err",
};

export default function CodeSearch({ locale, items, only }: { locale: Locale; items: CodeRow[]; only?: string }) {
  const t = T[locale];
  const id = useId();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<string>(only ?? "all");
  const ranges = ["1xx", "2xx", "3xx", "4xx", "5xx"];

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/ё/g, "е");
    return items.filter((r) => {
      if (cls !== "all" && r.k !== cls) return false;
      if (!s) return true;
      if (/^\d+$/.test(s)) return String(r.c).startsWith(s);
      return `${r.c} ${r.n} ${r.t}`.toLowerCase().replace(/ё/g, "е").includes(s);
    });
  }, [items, q, cls]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor={`${id}-q`} className="text-sm font-medium text-fg-2">
            {t.search}
          </label>
          <Input id={`${id}-q`} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.placeholder} size="lg" autoComplete="off" />
        </div>
        {!only && (
          <Segmented
            label={t.classes}
            value={cls}
            onChange={setCls}
            size="sm"
            options={[{ value: "all", label: t.all }, ...ranges.map((r) => ({ value: r, label: r }))]}
          />
        )}
      </div>
      <p className="text-sm text-fg-3" aria-live="polite">
        {`${rows.length} ${plural(locale, rows.length, t.found)}`}
      </p>
      {rows.length ? (
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.code}</th>
                <th scope="col">{t.name}</th>
                <th scope="col" className="max-sm:hidden">
                  {t.meaning}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.c}>
                  <td className={cn("font-mono text-base font-semibold", tone[r.k])}>
                    <Link href={href(locale, ["http-status", String(r.c)])} className="hover:underline">
                      {r.c}
                    </Link>
                  </td>
                  <td>
                    <Link href={href(locale, ["http-status", String(r.c)])} className="font-medium text-fg hover:text-accent">
                      {r.n}
                    </Link>
                    {r.u && <span className="ml-2 text-xs text-fg-3">{t.unofficial}</span>}
                    <span className="block text-[13px] text-fg-3 sm:hidden">{r.t}</span>
                  </td>
                  <td className="text-fg-2 max-sm:hidden">{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-fg-2">{t.none}</p>
      )}
    </div>
  );
}
