"use client";

import { Trash2 } from "lucide-react";
import { useId, useState, type MouseEvent, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Input } from "@/ui/field";
import { Segmented } from "@/ui/segmented";

/**
 * [glyph, path, title, display?]
 * path: relative to `base` ("grinning-face"), absolute ("/ru/emoji/x") or "" (no page → button).
 * display: visible text for invisible characters (spaces, joiners).
 */
export type BoardItem = [string, string, string, string?];
/** [heading, number of items, heading link] — consecutive slices of `items`. */
export type BoardSection = [string, number, string?];

export interface GlyphBoardProps {
  locale: Locale;
  base: string;
  items: BoardItem[];
  sections?: BoardSection[];
  /** "emoji" = large colored glyphs, "symbol" = text symbols with a monospace look. */
  kind?: "emoji" | "symbol";
}

const T = {
  ru: {
    mode: "При нажатии",
    copy: "Копировать",
    open: "Открывать страницу",
    tray: "Набранные символы",
    trayHint: "Нажимайте на символы — они соберутся здесь",
    copyAll: "Копировать всё",
    copied: "Скопировано",
    clear: "Очистить",
    done: "Скопировано:",
    more: "подробнее",
  },
  en: {
    mode: "On click",
    copy: "Copy",
    open: "Open page",
    tray: "Collected characters",
    trayHint: "Click characters — they are collected here",
    copyAll: "Copy all",
    copied: "Copied",
    clear: "Clear",
    done: "Copied:",
    more: "details",
  },
} as const;

export const hrefOf = (base: string, path: string) => (!path ? "" : path.startsWith("/") ? path : base + path);

/** Grid cells are styled from the container to keep the HTML small. */
export const cellGrid = (kind: "emoji" | "symbol") =>
  cn(
    "grid gap-1 [&>*]:flex [&>*]:aspect-square [&>*]:min-w-0 [&>*]:items-center [&>*]:justify-center [&>*]:rounded-[0.5rem] [&>*]:border [&>*]:border-transparent [&>*]:leading-none [&>*]:transition-colors [&>*:hover]:border-line-strong [&>*:hover]:bg-surface-2 [&>*:focus-visible]:outline-2 [&>*:focus-visible]:outline-accent",
    kind === "emoji"
      ? "grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] text-[1.75rem] sm:grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] sm:text-[2rem]"
      : "grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] text-[1.5rem] text-fg sm:grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] sm:text-[1.75rem]",
  );

export function Cells({ items, base, kind, onPick }: { items: BoardItem[]; base: string; kind: "emoji" | "symbol"; onPick: (e: MouseEvent, item: BoardItem) => void }) {
  return (
    <div className={cellGrid(kind)}>
      {items.map((it, i) => {
        const href = hrefOf(base, it[1]);
        const content = it[3] ? <span className="text-center font-mono text-[0.625rem] leading-tight text-fg-3">{it[3]}</span> : it[0];
        return href ? (
          <a key={i} href={href} title={it[2]} onClick={(e) => onPick(e, it)}>
            {content}
          </a>
        ) : (
          <button key={i} type="button" title={it[2]} onClick={(e) => onPick(e, it)}>
            {content}
          </button>
        );
      })}
    </div>
  );
}

/** Copy-on-click state shared by the grid pages and the search tool. */
export function usePicker(locale: Locale, base: string) {
  const t = T[locale];
  const [mode, setMode] = useState<"copy" | "open">("copy");
  const [tray, setTray] = useState("");
  const [last, setLast] = useState<BoardItem | null>(null);

  function onPick(e: MouseEvent, it: BoardItem) {
    const isLink = (e.currentTarget as HTMLElement).tagName === "A";
    if (isLink && (mode === "open" || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)) return;
    e.preventDefault();
    void copyText(it[0]);
    setTray((s) => s + it[0]);
    setLast(it);
  }

  const panel: ReactNode = (
    <PickerPanel
      t={t}
      mode={mode}
      setMode={setMode}
      tray={tray}
      setTray={setTray}
      last={last}
      lastHref={last ? hrefOf(base, last[1]) : ""}
    />
  );
  return { onPick, panel };
}

function PickerPanel({
  t,
  mode,
  setMode,
  tray,
  setTray,
  last,
  lastHref,
}: {
  t: (typeof T)[Locale];
  mode: "copy" | "open";
  setMode: (m: "copy" | "open") => void;
  tray: string;
  setTray: (s: string) => void;
  last: BoardItem | null;
  lastHref: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor={`${id}-tray`} className="sr-only">
          {t.tray}
        </label>
        <Input
          id={`${id}-tray`}
          value={tray}
          onChange={(e) => setTray(e.target.value)}
          placeholder={t.trayHint}
          autoComplete="off"
          size="lg"
          className="min-w-0 flex-1 font-normal! text-xl! placeholder:text-[0.9375rem]"
        />
        <div className="flex shrink-0 gap-2">
          <CopyButton value={tray} label={t.copyAll} copiedLabel={t.copied} variant="primary" size="md" />
          <Button variant="outline" size="icon" onClick={() => setTray("")} aria-label={t.clear} title={t.clear} disabled={!tray}>
            <Trash2 aria-hidden />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label={t.mode}
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: "copy", label: t.copy },
            { value: "open", label: t.open },
          ]}
        />
        <p className="min-h-5 text-sm text-fg-2" aria-live="polite">
          {last && (
            <>
              {t.done} <span className="text-base">{last[3] ? last[3] : last[0]}</span> {last[2]}
              {lastHref && (
                <>
                  {" · "}
                  <a href={lastHref} className="text-accent underline underline-offset-2">
                    {t.more}
                  </a>
                </>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function GlyphBoard({ locale, base, items, sections, kind = "emoji" }: GlyphBoardProps) {
  const { onPick, panel } = usePicker(locale, base);
  let offset = 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="z-10 rounded-[0.75rem] border border-line bg-surface p-3 sm:sticky sm:top-16">{panel}</div>
      {sections?.length ? (
        sections.map(([title, n, href], i) => {
          const slice = items.slice(offset, offset + n);
          offset += n;
          return (
            <section key={i}>
              <h2 className="mb-2 text-base font-semibold text-fg">
                {href ? (
                  <a href={href} className="hover:text-accent">
                    {title}
                  </a>
                ) : (
                  title
                )}{" "}
                <span className="text-sm font-normal text-fg-3">{n}</span>
              </h2>
              <Cells items={slice} base={base} kind={kind} onPick={onPick} />
            </section>
          );
        })
      ) : (
        <Cells items={items} base={base} kind={kind} onPick={onPick} />
      )}
    </div>
  );
}
