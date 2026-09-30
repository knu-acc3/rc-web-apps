"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { cellGrid, Cells, usePicker, type BoardItem } from "../emoji/shared/GlyphBoard";
import { cssEscape, hex, htmlDec, htmlHex, jsEscape, utf8 } from "../emoji/shared/codes";
import { blockOf, face, k36, nameOf, parseIndex, search, type Index, type RawIndex, type RawRu } from "./lookup";

export interface UnicodeTableProps {
  locale: Locale;
  /** "hub": search + copy grid; "table": search, block browser and a details card. */
  mode: "hub" | "table";
  popular: BoardItem[];
}

const T = {
  ru: {
    search: "Поиск символа",
    placeholder: "название, код U+2192 или сам символ",
    block: "Блок Unicode",
    anyBlock: "Все блоки",
    popular: "Популярные символы",
    loading: "Загружаем таблицу символов…",
    failed: "Не удалось загрузить таблицу символов. Обновите страницу.",
    none: "Ничего не найдено. Попробуйте английское название или код.",
    found: ["Найден", "Найдено", "Найдено"],
    forms: ["символ", "символа", "символов"],
    more: "Показать ещё",
    copy: "Копировать",
    copied: "Скопировано",
    code: "Код",
    decimal: "Десятичный",
    blockName: "Блок",
    open: "Страница символа",
    openEmoji: "Страница эмодзи",
    pick: "Нажмите на символ, чтобы увидеть его коды",
  },
  en: {
    search: "Search characters",
    placeholder: "name, code like U+2192 or the character",
    block: "Unicode block",
    anyBlock: "All blocks",
    popular: "Popular symbols",
    loading: "Loading the character table…",
    failed: "Could not load the character table. Please reload the page.",
    none: "Nothing found. Try another name or a code.",
    found: ["Found", "Found"],
    forms: ["character", "characters"],
    more: "Show more",
    copy: "Copy",
    copied: "Copied",
    code: "Code",
    decimal: "Decimal",
    blockName: "Block",
    open: "Symbol page",
    openEmoji: "Emoji page",
    pick: "Click a character to see its codes",
  },
} as const;

const cache = new Map<Locale, Promise<Index>>();
function loadIndex(locale: Locale): Promise<Index> {
  let p = cache.get(locale);
  if (!p) {
    const get = <R,>(f: string) =>
      fetch(`/vendor/symbols/${f}`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<R>;
      });
    p = Promise.all([get<RawIndex>("unicode.json"), locale === "ru" ? get<RawRu>("unicode-ru.json") : Promise.resolve(undefined)])
      .then(([raw, ru]) => parseIndex(raw, ru))
      .catch((err) => {
        cache.delete(locale);
        throw err;
      });
    cache.set(locale, p);
  }
  return p;
}

const linkClass = "inline-flex h-10 items-center px-2 text-sm text-accent underline underline-offset-2";

function Details({ idx, cp, locale }: { idx: Index; cp: number; locale: Locale }) {
  const t = T[locale];
  const ch = String.fromCodePoint(cp);
  const f = face(cp);
  const b = blockOf(idx, cp);
  const ent = idx.ents[k36(cp)];
  const page = idx.pages[k36(cp)];
  const emoji = idx.emoji[k36(cp)];
  const name = nameOf(idx, cp, locale);
  const official = idx.names[idx.byCp.get(cp) ?? -1];
  const blockLabel = b ? `${(locale === "ru" && idx.ruBlocks[k36(b[0])]) || b[2]} (U+${hex(b[0])}–U+${hex(b[1])})` : "—";
  const rows: [string, string][] = [
    [t.code, `U+${hex(cp)}`],
    [t.decimal, String(cp)],
    [t.blockName, blockLabel],
    ["HTML", [ent ? `&${ent};` : "", htmlDec(ch), htmlHex(ch)].filter(Boolean).join("  ")],
    ["CSS / JS", `${cssEscape(ch)}  ${jsEscape(ch)}`],
    ["UTF-8", utf8(ch)],
  ];
  return (
    <Panel className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
      <div className="flex size-32 shrink-0 items-center justify-center self-center rounded-[12px] bg-surface-2 text-[72px] leading-none text-fg sm:self-start">
        {f.label ? <span className="font-mono text-lg text-fg-3">{f.label}</span> : f.text}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <p className="text-lg font-semibold break-words text-fg" aria-live="polite">
            {name}
          </p>
          {official && official !== name && <p className="font-mono text-sm break-words text-fg-3">{official}</p>}
        </div>
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-fg-3">{k}</dt>
              <dd className="font-mono break-all text-fg">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2">
          <CopyButton value={ch} label={`${t.copy} ${f.label ?? ch}`} copiedLabel={t.copied} variant="primary" size="md" />
          <CopyButton value={ent ? `&${ent};` : htmlHex(ch)} label="HTML" copiedLabel={t.copied} variant="outline" size="md" />
          {page ? (
            <a className={linkClass} href={`/${locale}/symbols/${page}`}>
              {t.open}
            </a>
          ) : emoji ? (
            <a className={linkClass} href={`/${locale}/emoji/${emoji}`}>
              {t.openEmoji}
            </a>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export default function UnicodeTable({ locale, mode, popular }: UnicodeTableProps) {
  const t = T[locale];
  const id = useId();
  const base = `/${locale}/symbols/`;
  const { onPick, panel } = usePicker(locale, base);
  const [q, setQ] = useState("");
  const [block, setBlock] = useState("");
  const [idx, setIdx] = useState<Index | null>(null);
  const [failed, setFailed] = useState(false);
  const [want, setWant] = useState(mode === "table");
  const [selected, setSelected] = useState<number | null>(null);
  const [limit, setLimit] = useState(300);

  useEffect(() => {
    if (!want) return;
    let alive = true;
    loadIndex(locale).then(
      (x) => alive && setIdx(x),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [want, locale]);

  const active = q.trim() !== "" || block !== "";
  const results = useMemo(() => {
    if (!idx || !active) return null;
    if (q.trim()) return search(idx, q, locale);
    const b = idx.blocks.find((x) => String(x[0]) === block);
    return b ? idx.cps.filter((c) => c >= b[0] && c <= b[1]) : [];
  }, [idx, active, q, block, locale]);

  const visible = results ? results.slice(0, limit) : [];
  const status = !active
    ? t.popular
    : failed
      ? t.failed
      : !results
        ? t.loading
        : results.length === 0
          ? t.none
          : `${plural(locale, results.length, t.found)} ${formatNumber(locale, results.length)} ${plural(locale, results.length, t.forms)}`;

  const toItems = (list: number[]): BoardItem[] =>
    idx
      ? list.map((cp) => {
          const f = face(cp);
          const page = idx.pages[k36(cp)];
          const emoji = idx.emoji[k36(cp)];
          const item: BoardItem = [String.fromCodePoint(cp), page ?? (emoji ? `/${locale}/emoji/${emoji}` : ""), `${nameOf(idx, cp, locale)} — U+${hex(cp)}`];
          if (f.label) item.push(f.label);
          else if (f.text !== item[0]) item.push(f.text);
          return item;
        })
      : [];

  return (
    <div className="flex flex-col gap-4">
      <div className={mode === "table" ? "grid gap-3 sm:grid-cols-[1fr_260px]" : ""}>
        <Field label={t.search} htmlFor={`${id}-q`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-fg-3" aria-hidden />
            <Input
              id={`${id}-q`}
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setWant(true);
                setLimit(300);
              }}
              onFocus={() => setWant(true)}
              placeholder={t.placeholder}
              autoComplete="off"
              spellCheck={false}
              size="lg"
              className="pl-10 font-normal!"
            />
          </div>
        </Field>
        {mode === "table" && (
          <Field label={t.block} htmlFor={`${id}-b`}>
            <Select
              id={`${id}-b`}
              value={block}
              onChange={(e) => {
                setBlock(e.target.value);
                setQ("");
                setLimit(300);
              }}
              size="lg"
              disabled={!idx}
            >
              <option value="">{t.anyBlock}</option>
              {idx?.blocks.map((b) => (
                <option key={b[0]} value={String(b[0])}>
                  {(locale === "ru" && idx.ruBlocks[k36(b[0])]) || b[2]}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {mode === "table" && idx && selected !== null && <Details idx={idx} cp={selected} locale={locale} />}
      {mode === "hub" && <div className="rounded-[12px] border border-line bg-surface p-3">{panel}</div>}

      <div>
        <h2 className="mb-2 text-base font-semibold text-fg" aria-live="polite">
          {status}
        </h2>
        {mode === "hub" ? (
          <Cells items={active ? toItems(visible) : popular} base={base} kind="symbol" onPick={onPick} />
        ) : (
          <div className={`${cellGrid("symbol")} [&>[aria-pressed=true]]:border-accent [&>[aria-pressed=true]]:bg-accent-soft`}>
            {(active ? visible : popular.map((it) => it[0].codePointAt(0)!)).map((cp) => {
              const f = face(cp);
              return (
                <button key={cp} type="button" title={`${idx ? nameOf(idx, cp, locale) : ""} U+${hex(cp)}`.trim()} aria-pressed={selected === cp} onClick={() => setSelected(cp)}>
                  {f.label ? <span className="font-mono text-[10px] text-fg-3">{f.label}</span> : f.text}
                </button>
              );
            })}
          </div>
        )}
        {results && results.length > limit && (
          <Button variant="outline" className="mt-3" onClick={() => setLimit((l) => l + 600)}>
            {t.more}
          </Button>
        )}
        {mode === "table" && selected === null && <p className="mt-3 text-sm text-fg-3">{t.pick}</p>}
      </div>
    </div>
  );
}
