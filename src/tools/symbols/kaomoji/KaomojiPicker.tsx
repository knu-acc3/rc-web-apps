"use client";

import { Search, X } from "lucide-react";
import Link from "@/ui/link";
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { href, type Locale } from "@/i18n/config";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Input } from "@/ui/field";
import { CATEGORIES, CATEGORY_BY_SLUG, taggedFor } from "./data";
import { KaomojiGrid } from "./ui/KaomojiGrid";
import { searchKaomoji } from "./lib/search";
import { addRecent, clearRecent, useRecentKaomoji } from "./lib/use-recent";

const T = {
  ru: {
    search: "Поиск каомодзи",
    placeholder: "Кот, грусть, love, ツ…",
    clearSearch: "Очистить поиск",
    categories: "Категории",
    all: "Все",
    recent: "Недавние",
    clearRecent: "Очистить",
    copy: "Копировать",
    copied: "Скопировано",
    failed: "Не удалось скопировать — выделите смайлик и скопируйте вручную",
    found: "Найдено",
    nothing: "Ничего не нашлось. Попробуйте «кот», «love» или символ, например ツ.",
    alsoFits: "Подходят и сюда",
  },
  en: {
    search: "Search kaomoji",
    placeholder: "Cat, sad, котик, ツ…",
    clearSearch: "Clear search",
    categories: "Categories",
    all: "All",
    recent: "Recent",
    clearRecent: "Clear",
    copy: "Copy",
    copied: "Copied",
    failed: "Couldn't copy — select the kaomoji and copy it manually",
    found: "Found",
    nothing: "Nothing found. Try \"cat\", \"love\" or a symbol such as ツ.",
    alsoFits: "Also fits here",
  },
} as const;

export interface KaomojiPickerProps {
  locale: Locale;
  /** Category slug of a variant page; the whole collection when omitted. */
  category?: string;
}

export default function KaomojiPicker({ locale, category }: KaomojiPickerProps) {
  const t = T[locale];
  const id = useId();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(category && CATEGORY_BY_SLUG.has(category) ? category : "");
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recent = useRecentKaomoji();

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const hits = useMemo(() => (query.trim() ? searchKaomoji(query) : null), [query]);
  const current = cat ? CATEGORY_BY_SLUG.get(cat) : undefined;
  const tagged = useMemo(() => (cat ? taggedFor(cat) : []), [cat]);

  async function pick(e: MouseEvent<HTMLButtonElement>) {
    // The tile's text is exactly the kaomoji (see KaomojiGrid).
    const k = e.currentTarget.textContent;
    if (!k) return;
    const ok = await copyText(k);
    if (timer.current) clearTimeout(timer.current);
    if (ok) {
      addRecent(k);
      setCopied(k);
      setStatus(`${t.copied}: ${k}`);
    } else {
      setCopied(null);
      setStatus(t.failed);
    }
    timer.current = setTimeout(() => {
      setCopied(null);
      setStatus("");
    }, 2000);
  }

  const grid = (items: readonly string[], size?: "sm" | "md") => (
    <KaomojiGrid items={items} copied={copied} onPick={pick} copyLabel={t.copy} size={size} />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor={`${id}-q`} className="sr-only">
          {t.search}
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-fg-3" aria-hidden />
        <Input
          id={`${id}-q`}
          type="search"
          size="lg"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={t.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12! pr-12! font-normal! [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <Button variant="ghost" size="icon-sm" onClick={() => setQuery("")} aria-label={t.clearSearch} title={t.clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X />
          </Button>
        )}
      </div>

      <div role="group" aria-label={t.categories} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:px-0">
        <CategoryChip active={!hits && !cat} onClick={() => { setCat(""); setQuery(""); }}>
          {t.all}
        </CategoryChip>
        {CATEGORIES.map((c) => (
          <CategoryChip key={c.slug} active={!hits && cat === c.slug} onClick={() => { setCat(c.slug); setQuery(""); }}>
            {c.name[locale]}
          </CategoryChip>
        ))}
      </div>

      {recent.length > 0 && (
        <section aria-labelledby={`${id}-recent`} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 id={`${id}-recent`} className="text-sm font-medium text-fg-3">
              {t.recent}
            </h2>
            <Button variant="ghost" size="sm" onClick={clearRecent} className="h-7! px-2! text-[0.8125rem]! text-fg-3">
              {t.clearRecent}
            </Button>
          </div>
          {grid(recent, "sm")}
        </section>
      )}

      <div className="mt-2 flex flex-col gap-8">
        {hits ? (
          hits.length ? (
            <section className="flex flex-col gap-3">
              <p className="text-sm text-fg-3">
                {t.found}: {hits.length}
              </p>
              {grid(hits.map((h) => h.k))}
            </section>
          ) : (
            <p className="rounded-[0.75rem] bg-surface-2 px-4 py-6 text-center text-fg-2">{t.nothing}</p>
          )
        ) : current ? (
          <>
            <section className="flex flex-col gap-3">
              <GroupTitle locale={locale} slug={current.slug} name={current.name[locale]} count={current.items.length} link={current.slug !== category} />
              {grid(current.items)}
            </section>
            {tagged.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-medium text-fg-3">{t.alsoFits}</h2>
                {grid(tagged)}
              </section>
            )}
          </>
        ) : (
          CATEGORIES.map((c) => (
            <section key={c.slug} className="flex flex-col gap-3">
              <GroupTitle locale={locale} slug={c.slug} name={c.name[locale]} count={c.items.length} link />
              {grid(c.items)}
            </section>
          ))
        )}
      </div>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
        {status && (
          <span className="max-w-md rounded-[1.125rem] bg-fg px-4 py-2 text-center text-sm font-medium [overflow-wrap:anywhere] text-bg shadow-[var(--shadow-overlay)]">{status}</span>
        )}
      </div>
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn("chip shrink-0 whitespace-nowrap", active && "border-accent bg-accent-soft text-accent")}>
      {children}
    </button>
  );
}

/** Quiet heading of a group; links to the category page unless it is the current page. */
function GroupTitle({ locale, slug, name, count, link }: { locale: Locale; slug: string; name: string; count: number; link: boolean }) {
  return (
    <h2 className="flex items-baseline gap-2 text-base font-semibold text-fg">
      {link ? (
        <Link href={href(locale, ["kaomoji", slug])} className="hover:text-accent">
          {name}
        </Link>
      ) : (
        name
      )}
      <span className="text-sm font-normal text-fg-3">{count}</span>
    </h2>
  );
}
