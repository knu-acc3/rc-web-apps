"use client";

import { ArrowLeft, CornerDownLeft, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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

const LIMIT = 8;

/** One search result row: glyph or a tinted initial, title, where it lives. */
function Row({ e, active, id, onPick, onHover }: { e: IndexedEntry; active: boolean; id: string; onPick: () => void; onHover: () => void }) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={onPick}
      className={cn("flex cursor-pointer items-center gap-3 rounded-[0.625rem] px-3 py-2.5", active ? "bg-accent-soft" : "hover:bg-surface-2")}
    >
      <span className="sec-icon flex size-9 shrink-0 items-center justify-center rounded-[0.5625rem] text-lg font-semibold" style={{ ["--hue" as string]: e.hue }} aria-hidden>
        {e.glyph || e.hint.charAt(0).toUpperCase() || "•"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-fg">{e.title}</span>
        <span className="block truncate text-[0.8125rem] text-fg-3">{e.hint}</span>
      </span>
      {active && <CornerDownLeft className="size-4 shrink-0 text-fg-3" aria-hidden />}
    </li>
  );
}

/**
 * Live search. Desktop header and the home page: a real input with results under it as you type.
 * Phones (header): a magnifier icon that opens a full-screen search. Without JavaScript the search is a link
 * and a form that lead to the catalogue page.
 */
export function SearchBox({ locale, labels, variant = "header" }: { locale: Locale; labels: Labels; variant?: "header" | "hero" }) {
  const router = useRouter();
  const pathname = usePathname();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const boxRef = useRef<HTMLFormElement>(null);
  const [index, setIndex] = useState<IndexedEntry[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const isHome = pathname === `/${locale}`;
  const results = useMemo(() => (index && q.trim() ? searchIndex(index, q, LIMIT) : []), [index, q]);
  const warm = useCallback(() => {
    if (!index) loadIndex(locale).then(setIndex);
  }, [index, locale]);

  const go = useCallback(
    (e: IndexedEntry | undefined) => {
      if (!e) return;
      setOpen(false);
      setQ("");
      sheetRef.current?.close();
      router.push(e.path);
    },
    [router],
  );

  const openSheet = useCallback(() => {
    warm();
    const d = sheetRef.current;
    if (d && !d.open) {
      d.showModal();
      sheetInputRef.current?.focus();
    }
  }, [warm]);

  // Ctrl/⌘+K and "/" jump to the visible search.
  useEffect(() => {
    if (variant === "header" && isHome) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      const combo = (e.key === "k" || e.key === "K" || e.key === "л" || e.key === "Л") && (e.ctrlKey || e.metaKey);
      if (!combo && !(e.key === "/" && !typing)) return;
      e.preventDefault();
      const input = inputRef.current;
      if (input && input.offsetParent !== null) {
        input.focus();
        input.select();
      } else openSheet();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant, isHome, openSheet]);

  // Close the dropdown on outside clicks.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (variant === "header" && isHome) return null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (results.length) {
        e.preventDefault();
        go(results[active] ?? results[0]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      (e.target as HTMLInputElement).blur();
    }
  };
  const onChange = (v: string) => {
    setQ(v);
    setActive(0);
    setOpen(true);
    warm();
  };

  const list = (
    <ul id={listId} role="listbox" aria-label={labels.search} className="flex flex-col gap-0.5 p-2">
      {q.trim() && index && results.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-3">{labels.empty}</li>}
      {results.map((r, i) => (
        <Row key={r.path} e={r} id={`${listId}-${i}`} active={i === active} onPick={() => go(r)} onHover={() => setActive(i)} />
      ))}
    </ul>
  );

  const input = (ref: React.RefObject<HTMLInputElement | null>, big: boolean) => (
    <input
      ref={ref}
      type="search"
      name="q"
      value={q}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => {
        warm();
        if (q) setOpen(true);
      }}
      onKeyDown={onKeyDown}
      placeholder={labels.placeholder}
      aria-label={labels.search}
      role="combobox"
      aria-expanded={open && results.length > 0}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={open && results.length ? `${listId}-${active}` : undefined}
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="search"
      className={cn(
        "w-full min-w-0 bg-transparent text-fg outline-none placeholder:text-fg-3 [&::-webkit-search-cancel-button]:hidden",
        big ? "h-14 text-[1.0625rem] sm:h-16 sm:text-lg" : "h-10 text-[0.9375rem]",
      )}
    />
  );

  if (variant === "hero") {
    return (
      <form ref={boxRef} role="search" action={`/${locale}/all`} onSubmit={(e) => e.preventDefault()} className="relative text-left">
        <div className="flex items-center gap-3 rounded-[1rem] border border-line-strong bg-surface px-4 shadow-[var(--shadow-card)] transition-colors focus-within:border-accent sm:px-5">
          <Search className="size-5 shrink-0 text-accent sm:size-6" aria-hidden />
          {input(inputRef, true)}
          {q && (
            <button type="button" onClick={() => onChange("")} className="rounded-full p-1.5 text-fg-3 hover:bg-surface-2 hover:text-fg" aria-label={labels.close}>
              <X className="size-5" aria-hidden />
            </button>
          )}
        </div>
        {open && q.trim() && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[min(28rem,70vh)] overflow-y-auto rounded-[1rem] border border-line bg-surface shadow-[var(--shadow-overlay)]">{list}</div>
        )}
      </form>
    );
  }

  return (
    <>
      <form ref={boxRef} role="search" action={`/${locale}/all`} onSubmit={(e) => e.preventDefault()} className="relative hidden w-[min(26rem,40vw)] md:block">
        <div className="flex items-center gap-2 rounded-[0.625rem] border border-line bg-surface px-3 transition-colors focus-within:border-accent hover:border-line-strong">
          <Search className="size-[1.125rem] shrink-0 text-fg-3" aria-hidden />
          {input(inputRef, false)}
          <kbd className="hidden shrink-0 rounded-[0.3125rem] border border-line px-1.5 text-[0.6875rem] font-medium text-fg-3 lg:inline">Ctrl K</kbd>
        </div>
        {open && q.trim() && (
          <div className="absolute right-0 top-full z-50 mt-2 max-h-[min(30rem,75vh)] w-[max(100%,26rem)] overflow-y-auto rounded-[0.875rem] border border-line bg-surface shadow-[var(--shadow-overlay)]">{list}</div>
        )}
      </form>

      <a
        href={`/${locale}/all`}
        onClick={(e) => {
          e.preventDefault();
          openSheet();
        }}
        className="inline-flex size-10 items-center justify-center rounded-[0.625rem] text-fg-2 hover:bg-surface-2 hover:text-fg md:hidden"
        aria-label={labels.search}
        title={labels.search}
        role="button"
      >
        <Search className="size-5" aria-hidden />
      </a>
      <dialog ref={sheetRef} aria-label={labels.search} className="m-0 h-full max-h-none w-full max-w-none bg-bg p-0 text-fg backdrop:bg-transparent" onClose={() => setQ("")}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-line px-2 pt-[env(safe-area-inset-top)]">
            <button type="button" onClick={() => sheetRef.current?.close()} className="rounded-[0.625rem] p-2.5 text-fg-2 hover:bg-surface-2" aria-label={labels.close}>
              <ArrowLeft className="size-5" aria-hidden />
            </button>
            {input(sheetInputRef, false)}
            {q && (
              <button type="button" onClick={() => onChange("")} className="rounded-full p-2 text-fg-3 hover:text-fg" aria-label={labels.close}>
                <X className="size-5" aria-hidden />
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{q.trim() ? list : <p className="px-4 py-8 text-center text-sm text-fg-3">{labels.hint}</p>}</div>
        </div>
      </dialog>
    </>
  );
}
