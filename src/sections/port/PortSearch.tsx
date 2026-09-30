"use client";

import Link from "@/ui/link";
import { useId, useMemo, useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Input, Select } from "@/ui/field";

export interface PortRow {
  /** port number */
  p: number;
  /** "TCP", "UDP", "TCP/UDP" */
  t: string;
  /** service label in the current locale */
  s: string;
  /** category id */
  c: string;
}

const T = {
  ru: {
    search: "Номер порта или служба",
    placeholder: "Например 443, ssh, mysql или minecraft",
    cat: "Категория",
    all: "Все категории",
    port: "Порт",
    proto: "Протокол",
    service: "Служба",
    none: "Ничего не найдено. Введите номер порта (0–65535) или название службы.",
    found: ["порт", "порта", "портов"],
    notListed: (n: number) => `Порта ${n} нет в справочнике: скорее всего, он не закреплён за популярной службой.`,
  },
  en: {
    search: "Port number or service",
    placeholder: "E.g. 443, ssh, mysql or minecraft",
    cat: "Category",
    all: "All categories",
    port: "Port",
    proto: "Protocol",
    service: "Service",
    none: "Nothing found. Type a port number (0–65535) or a service name.",
    found: ["port", "ports"],
    notListed: (n: number) => `Port ${n} isn't in the list: it's most likely not tied to a popular service.`,
  },
} as const;

export default function PortSearch({ locale, items, cats, only }: { locale: Locale; items: PortRow[]; cats?: [string, string][]; only?: string }) {
  const t = T[locale];
  const id = useId();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(only ?? "");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((r) => {
      if (cat && r.c !== cat) return false;
      if (!s) return true;
      if (/^\d+$/.test(s)) return String(r.p).startsWith(s);
      return `${r.s} ${r.t}`.toLowerCase().includes(s);
    });
  }, [items, q, cat]);

  const exact = /^\d+$/.test(q.trim()) ? Number(q.trim()) : null;
  const missing = exact !== null && exact <= 65535 && !items.some((r) => r.p === exact);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_16rem] sm:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${id}-q`} className="text-sm font-medium text-fg-2">
            {t.search}
          </label>
          <Input id={`${id}-q`} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.placeholder} size="lg" autoComplete="off" />
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
      <p className="text-sm text-fg-3" aria-live="polite">
        {missing ? t.notListed(exact!) : `${rows.length} ${plural(locale, rows.length, t.found)}`}
      </p>
      {rows.length > 0 ? (
        <div className="tbl">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.port}</th>
                <th scope="col">{t.service}</th>
                <th scope="col">{t.proto}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.p}>
                  <td className="font-mono text-base font-semibold">
                    <Link href={href(locale, ["port", String(r.p)])} className="text-accent hover:underline">
                      {r.p}
                    </Link>
                  </td>
                  <td>
                    <Link href={href(locale, ["port", String(r.p)])} className="text-fg hover:text-accent">
                      {r.s}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-fg-2">{r.t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !missing && <p className="text-fg-2">{t.none}</p>
      )}
    </div>
  );
}
