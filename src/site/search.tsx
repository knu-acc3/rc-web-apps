"use client";

import { CornerDownLeft, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { prepare, searchIndex, type IndexedEntry, type PackedEntry } from "@/lib/search";

const cache = new Map<Locale, Promise<IndexedEntry[]>>();
function loadIndex(locale: Locale): Promise<IndexedEntry[]> {
  let p = cache.get(locale);
  if (!p) {
    p = fetch(`/${locale}/search.json`)
      .then((r) => r.json() as Promise<PackedEntry[]>)
      .then(prepare)
      .catch(() => {
        cache.delete(locale);
        return [];
      });
    cache.set(locale, p);
  }
  return p;
}

interface Labels {
  search: string;
  placeholder: string;
  empty: string;
  hint: string;
  close: string;
}

export function SearchButton({ locale, labels, variant = "bar" }: { locale: Locale; labels: Labels; variant?: "bar" | "hero" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const [index, setIndex] = useState<IndexedEntry[] | null>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const open = useCallback(() => {
    const d = dialogRef.current;
    if (!d || d.open) return;
    d.showModal();
    inputRef.current?.focus();
    loadIndex(locale).then(setIndex);
  }, [locale]);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    if (variant !== "bar") return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((e.key === "k" || e.key === "K" || e.key === "л" || e.key === "Л") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        open();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, variant]);

  const results = useMemo(() => (index && q ? searchIndex(index, q) : []), [index, q]);

  function go(e: IndexedEntry | undefined) {
    if (!e) return;
    close();
    setQ("");
    router.push(e.path);
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      {variant === "hero" ? (
        <button
          type="button"
          onClick={open}
          className="flex h-14 w-full items-center gap-3 rounded-[12px] border border-line-strong bg-surface px-4 text-left text-base text-fg-3 transition-colors duration-150 hover:border-accent"
        >
          <Search className="size-5 text-fg-2" aria-hidden />
          <span className="truncate">{labels.placeholder}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          aria-label={labels.search}
          className="flex h-10 min-w-10 items-center gap-2 rounded-[10px] border-line text-sm text-fg-3 transition-colors duration-150 max-md:justify-center max-md:text-fg-2 max-md:hover:bg-surface-2 md:w-64 md:border md:bg-surface md:px-3 md:hover:border-line-strong lg:w-80"
        >
          <Search className="size-[18px] shrink-0" aria-hidden />
          <span className="hidden flex-1 truncate md:inline">{labels.placeholder}</span>
          <kbd className="hidden rounded-[5px] border border-line px-1.5 text-[11px] font-medium md:inline">Ctrl K</kbd>
        </button>
      )}

      <dialog
        ref={dialogRef}
        aria-label={labels.search}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="m-0 mx-auto mt-[8vh] w-[min(640px,calc(100vw-24px))] max-w-none overflow-hidden rounded-[14px] border border-line bg-surface p-0 text-fg shadow-[var(--shadow-overlay)] backdrop:bg-black/40 max-sm:mt-3"
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="size-5 shrink-0 text-fg-3" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[active]);
              }
            }}
            placeholder={labels.placeholder}
            aria-label={labels.search}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-activedescendant={results.length ? `sr-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-fg-3 focus-visible:outline-none"
          />
          <button type="button" onClick={close} className="rounded-md p-1.5 text-fg-3 hover:bg-surface-2 hover:text-fg" aria-label={labels.close}>
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <ul id="search-results" ref={listRef} role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
          {q && index && results.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-3">{labels.empty}</li>}
          {!q && <li className="px-3 py-6 text-center text-sm text-fg-3">{labels.hint}</li>}
          {results.map((r, i) => (
            <li
              key={r.path}
              id={`sr-${i}`}
              data-idx={i}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5",
                i === active ? "bg-accent-soft" : "hover:bg-surface-2",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-surface-2 text-lg">{r.glyph || "↗"}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">{r.title}</span>
                <span className="block truncate text-[13px] text-fg-3">{r.hint}</span>
              </span>
              {i === active && <CornerDownLeft className="size-4 shrink-0 text-fg-3" aria-hidden />}
            </li>
          ))}
        </ul>
      </dialog>
    </>
  );
}
