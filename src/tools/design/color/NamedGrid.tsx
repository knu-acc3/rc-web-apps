"use client";

import Link from "@/ui/link";
import { useId, useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { Input } from "@/ui/field";
import { NAMED_COLORS } from "./lib/named";
import { GROUP_LABEL, HUE_GROUPS, NAMED_INFO } from "./data/named-info";

const T = {
  ru: { search: "Найти цвет по названию или HEX", none: "Ничего не найдено", placeholder: "например, tomato, синий или #FF6347" },
  en: { search: "Find a color by name or HEX", none: "Nothing found", placeholder: "e.g. tomato, blue or #FF6347" },
} as const;

/** All 148 CSS named colors as a filterable swatch grid grouped by hue. */
export default function NamedGrid({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase().replace(/^#/, "");
  const match = (name: string, hex: string) =>
    !query || name.includes(query) || NAMED_INFO[name].ru.includes(query) || hex.slice(1).startsWith(query);
  const groups = HUE_GROUPS.map((g) => ({
    g,
    items: NAMED_COLORS.filter(([n, h]) => NAMED_INFO[n].group === g && match(n, h)),
  })).filter((x) => x.items.length);

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-md">
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-fg-2">
          {t.search}
        </label>
        <Input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.placeholder} size="lg" autoComplete="off" />
      </div>
      {groups.length === 0 && <p className="text-fg-3">{t.none}</p>}
      {groups.map(({ g, items }) => (
        <section key={g}>
          <h2 className="mb-2 text-base font-semibold text-fg">{GROUP_LABEL[g][locale]}</h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.25rem,1fr))] gap-2.5">
            {items.map(([n, h]) => (
              <li key={n}>
                <Link href={href(locale, ["color", n])} className="group block overflow-hidden rounded-[1rem] bg-surface shadow-card transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-elev-2 active:translate-y-0 active:shadow-card">
                  <span className="block h-16" style={{ background: h }} />
                  <span className="block px-3 py-2">
                    <span className="block truncate text-sm font-medium text-fg group-hover:text-accent">{NAMED_INFO[n].camel}</span>
                    <span className="block font-mono text-xs text-fg-3">{h.toUpperCase()}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
