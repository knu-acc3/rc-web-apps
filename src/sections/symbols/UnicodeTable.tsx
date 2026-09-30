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

export interface UnicodeTableProps {
  locale: Locale;
  /** "hub": search + copy grid; "table": search, block browser and a details card. */
  mode: "hub" | "table";
  popular: BoardItem[];
}

interface Raw {
  b: [number, number, string][];
  n: string;
  p: Record<string, string>;
  em: Record<string, string>;
  e: Record<string, string>;
}
interface Index {
  cps: number[];
  names: string[];
  byCp: Map<number, number>;
  blocks: [number, number, string][];
  pages: Record<string, string>;
  emoji: Record<string, string>;
  ents: Record<string, string>;
  entCp: Map<string, number>;
  ru: Record<string, string>;
  ruBlocks: Record<string, string>;
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
    const get = (f: string) =>
      fetch(`/vendor/symbols/${f}`).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
    p = Promise.all([get("unicode.json") as Promise<Raw>, locale === "ru" ? (get("unicode-ru.json") as Promise<{ n: Record<string, string>; b: Record<string, string> }>) : Promise.resolve({ n: {}, b: {} })])
      .then(([raw, ru]) => {
        const cps: number[] = [];
        const names: string[] = [];
        let cp = -1;
        for (const line of raw.n.split("\n")) {
          const sp = line.indexOf(" ");
          cp += parseInt(line.slice(0, sp), 36);
          cps.push(cp);
          names.push(line.slice(sp + 1));
        }
        const entCp = new Map<string, number>();
        for (const [k, v] of Object.entries(raw.e)) entCp.set(v.toLowerCase(), parseInt(k, 36));
        return {
          cps,
          names,
          byCp: new Map(cps.map((c, i) => [c, i])),
          blocks: raw.b,
          pages: raw.p,
          emoji: raw.em,
          ents: raw.e,
          entCp,
          ru: ru.n,
          ruBlocks: ru.b,
        };
      })
      .catch((err) => {
        cache.delete(locale);
        throw err;
      });
    cache.set(locale, p);
  }
  return p;
}

const k36 = (cp: number) => cp.toString(36);
const GC = /^\p{M}$/u;
const INVISIBLE = /^[\p{Z}\p{Cf}\p{Cc}]$/u;
/** What to draw in a cell: combining marks on a dotted circle, invisible characters as hex. */
function face(cp: number): { text: string; label?: string } {
  const ch = String.fromCodePoint(cp);
  if (GC.test(ch)) return { text: `◌${ch}` };
  if (INVISIBLE.test(ch)) return { text: ch, label: hex(cp) };
  return { text: ch };
}

function nameOf(idx: Index, cp: number, locale: Locale): string {
  const ru = locale === "ru" ? idx.ru[k36(cp)] : undefined;
  if (ru) return ru.charAt(0).toUpperCase() + ru.slice(1);
  const i = idx.byCp.get(cp);
  return i === undefined ? `U+${hex(cp)}` : idx.names[i];
}
function blockOf(idx: Index, cp: number): [number, number, string] | undefined {
  let lo = 0;
  let hi = idx.blocks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const b = idx.blocks[mid];
    if (cp < b[0]) hi = mid - 1;
    else if (cp > b[1]) lo = mid + 1;
    else return b;
  }
  return undefined;
}

/** Characters matching a query: codes, entities, pasted characters and names. */
function search(idx: Index, query: string, locale: Locale): number[] {
  const q = query.trim();
  if (!q) return [];
  const out: number[] = [];
  const add = (cp: number | undefined) => {
    if (cp !== undefined && idx.byCp.has(cp) && !out.includes(cp)) out.push(cp);
  };
  let m = /^(?:u\+|0x|\\u\{?|&#x)([0-9a-f]{1,6})\}?;?$/i.exec(q);
  if (m) add(parseInt(m[1], 16));
  if ((m = /^&#(\d{1,7});?$/.exec(q))) add(Number(m[1]));
  if ((m = /^&([a-z][a-z0-9]*);?$/i.exec(q))) add(idx.entCp.get(m[1].toLowerCase()));
  if (/^[0-9a-f]{4,6}$/i.test(q)) add(parseInt(q, 16));
  const chars = Array.from(q);
  if (chars.length <= 3 && !/^[a-z0-9 ]+$/i.test(q)) for (const c of chars) add(c.codePointAt(0));
  const up = q.toUpperCase();
  const tokens = up.split(/\s+/).filter(Boolean);
  const ruTokens = locale === "ru" ? q.toLowerCase().replace(/ё/g, "е").split(/\s+/).filter(Boolean) : [];
  const scored: [number, number][] = [];
  for (let i = 0; i < idx.names.length; i++) {
    const name = idx.names[i];
    let s = 0;
    if (tokens.every((t) => name.includes(t))) s = name === up ? 100 : name.startsWith(up) ? 60 : 20;
    if (!s && ruTokens.length) {
      const ru = idx.ru[k36(idx.cps[i])];
      if (ru) {
        const r = ru.toLowerCase().replace(/ё/g, "е");
        if (ruTokens.every((t) => r.includes(t))) s = r === ruTokens.join(" ") ? 100 : r.startsWith(ruTokens[0]) ? 60 : 30;
      }
    }
    if (s) scored.push([s, idx.cps[i]]);
  }
  scored.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, cp] of scored) {
    if (out.length >= 2000) break;
    add(cp);
  }
  return out;
}

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
          <CopyButton value={`U+${hex(cp)}`} label={`U+${hex(cp)}`} copiedLabel={t.copied} variant="outline" size="md" />
          {page && (
            <a className="inline-flex h-10 items-center px-2 text-sm text-accent underline underline-offset-2" href={`/${locale}/symbols/${page}`}>
              {t.open}
            </a>
          )}
          {!page && emoji && (
            <a className="inline-flex h-10 items-center px-2 text-sm text-accent underline underline-offset-2" href={`/${locale}/emoji/${emoji}`}>
              {t.openEmoji}
            </a>
          )}
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

  const shownCps = results ? results.slice(0, limit) : [];
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
        {!active ? (
          mode === "hub" ? (
            <Cells items={popular} base={base} kind="symbol" onPick={onPick} />
          ) : (
            <div className={cellGrid("symbol")}>
              {popular.map((it) => (
                <button key={it[0]} type="button" title={it[2]} onClick={() => setSelected(it[0].codePointAt(0)!)}>
                  {it[3] ? <span className="font-mono text-[10px] text-fg-3">{it[3]}</span> : it[0]}
                </button>
              ))}
            </div>
          )
        ) : mode === "hub" ? (
          <Cells items={toItems(shownCps)} base={base} kind="symbol" onPick={onPick} />
        ) : (
          <div className={cellGrid("symbol")}>
            {shownCps.map((cp) => {
              const f = face(cp);
              return (
                <button key={cp} type="button" title={`${idx ? nameOf(idx, cp, locale) : ""} — U+${hex(cp)}`} aria-pressed={selected === cp} onClick={() => setSelected(cp)}>
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
