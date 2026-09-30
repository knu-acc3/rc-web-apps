"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { Cells, usePicker, type BoardItem } from "./shared/GlyphBoard";

/** Row of public/vendor/emoji/index-{locale}.json: [glyph, slug, name, search text, group index] */
type IndexRow = [string, string, string, string, number];

export interface EmojiSearchProps {
  locale: Locale;
  popular: BoardItem[];
  /** [group key, localized name] */
  groups: [string, string][];
}

const T = {
  ru: {
    search: "Поиск эмодзи",
    placeholder: "сердце, огонь, кот, :heart: или 😀",
    group: "Категория",
    all: "Все категории",
    popular: "Популярные эмодзи",
    loading: "Загружаем список эмодзи…",
    failed: "Не удалось загрузить список эмодзи. Обновите страницу.",
    none: "Ничего не найдено — попробуйте другое слово или английское название.",
    found: ["Найден", "Найдено", "Найдено"],
    forms: ["эмодзи", "эмодзи", "эмодзи"],
    shown: "показаны первые",
  },
  en: {
    search: "Search emoji",
    placeholder: "heart, fire, cat, :smile: or 😀",
    group: "Category",
    all: "All categories",
    popular: "Popular emoji",
    loading: "Loading the emoji list…",
    failed: "Could not load the emoji list. Please reload the page.",
    none: "Nothing found — try another word.",
    found: ["Found", "Found"],
    forms: ["emoji", "emoji"],
    shown: "showing the first",
  },
} as const;

const LIMIT = 400;
const cache = new Map<Locale, Promise<IndexRow[]>>();
function loadIndex(locale: Locale): Promise<IndexRow[]> {
  let p = cache.get(locale);
  if (!p) {
    p = fetch(`/vendor/emoji/index-${locale}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ e: IndexRow[] }>;
      })
      .then((d) => d.e)
      .catch((err) => {
        cache.delete(locale);
        throw err;
      });
    cache.set(locale, p);
  }
  return p;
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/\u{FE0F}/gu, "").trim();

function score(row: IndexRow, q: string, tokens: string[]): number {
  if (norm(row[0]) === q) return 1000;
  const name = norm(row[2]);
  const text = norm(row[3]);
  let s = 0;
  if (name === q) s += 120;
  else if (name.startsWith(q)) s += 80;
  else if (name.includes(q)) s += 50;
  for (const t of tokens) {
    if (name.includes(t)) s += 12;
    else if (text.includes(t)) s += 6;
    else return 0;
  }
  return s;
}

export default function EmojiSearch({ locale, popular, groups }: EmojiSearchProps) {
  const t = T[locale];
  const id = useId();
  const base = `/${locale}/emoji/`;
  const { onPick, panel } = usePicker(locale, base);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [index, setIndex] = useState<IndexRow[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const active = q.trim() !== "" || group !== "";

  useEffect(() => {
    if (!active || index || state === "loading") return;
    let alive = true;
    setState("loading");
    loadIndex(locale).then(
      (rows) => {
        if (!alive) return;
        setIndex(rows);
        setState("idle");
      },
      () => alive && setState("error"),
    );
    return () => {
      alive = false;
    };
  }, [active, index, locale, state]);

  const results = useMemo<BoardItem[] | null>(() => {
    if (!active || !index) return null;
    const gi = group ? groups.findIndex((g) => g[0] === group) : -1;
    const query = norm(q);
    const tokens = query.split(/\s+/).filter(Boolean);
    const rows = gi >= 0 ? index.filter((r) => r[4] === gi) : index;
    if (!query) return rows.map((r) => [r[0], r[1], r[2]] as BoardItem);
    return rows
      .map((r, i) => ({ r, i, s: score(r, query, tokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .map((x) => [x.r[0], x.r[1], x.r[2]] as BoardItem);
  }, [active, index, group, groups, q]);

  const shown = results ? results.slice(0, LIMIT) : popular;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <Field label={t.search} htmlFor={`${id}-q`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-fg-3" aria-hidden />
            <Input
              id={`${id}-q`}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => void loadIndex(locale).catch(() => undefined)}
              placeholder={t.placeholder}
              autoComplete="off"
              spellCheck={false}
              size="lg"
              className="pl-10 font-normal!"
            />
          </div>
        </Field>
        <Field label={t.group} htmlFor={`${id}-g`}>
          <Select id={`${id}-g`} value={group} onChange={(e) => setGroup(e.target.value)} size="lg">
            <option value="">{t.all}</option>
            {groups.map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="rounded-[12px] border border-line bg-surface p-3">{panel}</div>

      <div>
        <h2 className="mb-2 text-base font-semibold text-fg" aria-live="polite">
          {!active
            ? t.popular
            : state === "error"
              ? t.failed
              : !results
                ? t.loading
                : results.length === 0
                  ? t.none
                  : `${plural(locale, results.length, t.found)} ${results.length} ${plural(locale, results.length, t.forms)}${results.length > LIMIT ? ` (${t.shown} ${LIMIT})` : ""}`}
        </h2>
        {shown.length > 0 && <Cells items={shown} base={base} kind="emoji" onPick={onPick} />}
      </div>
    </div>
  );
}
