"use client";

import { Search } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { loadPlaces, searchPlaces, type PlaceEntry } from "../lib/places";
import type { Place } from "../lib/types";

const T = {
  ru: { placeholder: "Город, страна, MSK или UTC+5", empty: "Ничего не найдено", loading: "Загрузка…" },
  en: { placeholder: "City, country, EST or UTC+5", empty: "Nothing found", loading: "Loading…" },
} as const;

/** Accessible combobox that finds a city or zone and returns it via onPick. */
export function PlaceSearch({ locale, label, onPick, exclude = [], className }: { locale: Locale; label: string; onPick: (p: Place) => void; exclude?: string[]; className?: string }) {
  const t = T[locale];
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<PlaceEntry[] | null>(null);
  const [active, setActive] = useState(0);
  const loading = useRef(false);

  const ensure = () => {
    if (list || loading.current) return;
    loading.current = true;
    void loadPlaces(locale).then(setList);
  };

  const results = list ? searchPlaces(list, q, locale, 12).filter((p) => !exclude.includes(p.key)) : [];
  const show = open && q.trim().length > 0;

  function pick(p: Place) {
    onPick(p);
    setQ("");
    setOpen(false);
    setActive(0);
  }

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={`${id}-q`} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" aria-hidden />
      <input
        id={`${id}-q`}
        role="combobox"
        aria-expanded={show}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={show && results[active] ? `${id}-o${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder={t.placeholder}
        className="control h-10 pl-9 text-[0.9375rem]"
        value={q}
        onFocus={() => {
          ensure();
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => {
          ensure();
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (results[active]) pick(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {show && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-[0.625rem] border border-line bg-surface py-1 shadow-[var(--shadow-overlay)]"
        >
          {!list && <li className="px-3 py-2 text-sm text-fg-3">{t.loading}</li>}
          {list && results.length === 0 && <li className="px-3 py-2 text-sm text-fg-3">{t.empty}</li>}
          {results.map((p, i) => (
            <li
              key={p.key}
              id={`${id}-o${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 text-[0.9375rem]", i === active && "bg-surface-2")}
            >
              <span className="truncate font-medium text-fg">{p.name}</span>
              <span className="shrink-0 truncate text-[0.8125rem] text-fg-3">{p.sub}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
