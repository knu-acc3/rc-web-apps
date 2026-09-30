"use client";

import { RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Select } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { buildDeck, cardName, isRed, rankLabel, SUIT_SYMBOL, type Card, type DeckSize } from "./lib/cards";
import { randomInt } from "./lib/rng";

export interface CardDrawProps {
  locale: Locale;
  deck?: DeckSize;
}

const T = {
  ru: {
    deck: "Колода",
    decks: { 36: "36 карт", 52: "52 карты" },
    draw: "Вытянуть карту",
    drawMany: "Вытянуть карты",
    count: "Сколько карт",
    reshuffle: "Собрать и перемешать",
    left: "В колоде",
    cardForms: ["карта", "карты", "карт"],
    of: "из",
    empty: "Колода закончилась — соберите её заново",
    idle: "Нажмите «Вытянуть карту»",
    drawn: "Вытянутые карты",
    none: "Пока ничего не вытянуто",
  },
  en: {
    deck: "Deck",
    decks: { 36: "36 cards", 52: "52 cards" },
    draw: "Draw a card",
    drawMany: "Draw cards",
    count: "Cards to draw",
    reshuffle: "Collect and reshuffle",
    left: "Left in the deck",
    cardForms: ["card", "cards"],
    of: "of",
    empty: "The deck is empty — reshuffle it",
    idle: "Press “Draw a card”",
    drawn: "Drawn cards",
    none: "Nothing drawn yet",
  },
} as const;

/** Card face; paper colours are fixed (a playing card looks the same in both themes). */
function CardFace({ card, locale, size = "lg" }: { card: Card; locale: Locale; size?: "lg" | "sm" }) {
  const red = isRed(card.suit);
  const sym = SUIT_SYMBOL[card.suit];
  const rank = rankLabel(card.rank, locale);
  return (
    <div
      role="img"
      aria-label={cardName(card, locale)}
      className={cn(
        "relative flex shrink-0 flex-col justify-between rounded-[10px] border font-semibold select-none",
        size === "lg" ? "h-44 w-32 p-2.5 sm:h-52 sm:w-36" : "h-20 w-14 rounded-[7px] p-1",
      )}
      style={{ background: "#ffffff", borderColor: "#c9c9c2", color: red ? "#c62828" : "#15161a" }}
    >
      <span className={cn("flex flex-col items-start leading-none", size === "lg" ? "text-2xl" : "text-sm")} aria-hidden>
        <span>{rank}</span>
        <span>{sym}</span>
      </span>
      <span className={cn("absolute inset-0 flex items-center justify-center", size === "lg" ? "text-6xl sm:text-7xl" : "text-2xl")} aria-hidden>
        {sym}
      </span>
      <span className={cn("flex rotate-180 flex-col items-start leading-none", size === "lg" ? "text-2xl" : "hidden")} aria-hidden>
        <span>{rank}</span>
        <span>{sym}</span>
      </span>
    </div>
  );
}

export default function CardDraw({ locale, deck: deck0 = 52 }: CardDrawProps) {
  const t = T[locale];
  const id = useId();
  const [size, setSize] = useState<DeckSize>(deck0);
  const [remaining, setRemaining] = useState<Card[]>(() => buildDeck(deck0));
  const [drawn, setDrawn] = useState<Card[]>([]);
  const [last, setLast] = useState<Card[]>([]);
  const [n, setN] = useState(1);

  function reset(s: DeckSize = size) {
    setSize(s);
    setRemaining(buildDeck(s));
    setDrawn([]);
    setLast([]);
  }

  function draw() {
    const k = Math.min(n, remaining.length);
    if (k === 0) return;
    const rest = remaining.slice();
    const out: Card[] = [];
    // Drawing a uniformly random card from what is left = dealing from a perfectly shuffled deck.
    for (let i = 0; i < k; i++) out.push(rest.splice(randomInt(rest.length), 1)[0]);
    setRemaining(rest);
    setLast(out);
    setDrawn((d) => [...out, ...d]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-4 sm:p-6">
        <div className="flex min-h-44 flex-wrap items-center justify-center gap-3 sm:min-h-52">
          {last.length ? last.map((c) => <CardFace key={`${c.rank}${c.suit}`} card={c} locale={locale} />) : <span className="text-sm text-fg-3">{remaining.length ? t.idle : t.empty}</span>}
        </div>
        <p aria-live="polite" className="min-h-7 text-center text-xl font-semibold text-fg">
          {last.map((c) => cardName(c, locale)).join(", ")}
        </p>
        <div className="flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" onClick={draw} disabled={remaining.length === 0} className="w-full sm:w-auto sm:min-w-56">
            {n > 1 ? t.drawMany : t.draw}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => reset()} disabled={drawn.length === 0}>
            <RotateCcw aria-hidden />
            {t.reshuffle}
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-end justify-center gap-4 border-t border-line pt-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-2">{t.deck}</span>
            <Segmented label={t.deck} value={String(size)} onChange={(v) => reset(Number(v) as DeckSize)} options={[{ value: "36", label: t.decks[36] }, { value: "52", label: t.decks[52] }]} size="sm" />
          </div>
          <Field label={t.count} htmlFor={`${id}-n`} className="w-32">
            <Select id={`${id}-n`} value={n} onChange={(e) => setN(Number(e.target.value))} size="sm">
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <p className="tabular pb-1.5 text-sm text-fg-2">
            {t.left}: {remaining.length} {t.of} {count(locale, size, t.cardForms)}
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={`${t.drawn}${drawn.length ? ` · ${drawn.length}` : ""}`} />
        {drawn.length ? (
          <ul className="flex flex-wrap gap-2 p-4">
            {drawn.map((c) => (
              <li key={`${c.rank}${c.suit}`}>
                <CardFace card={c} locale={locale} size="sm" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-fg-3">{t.none}</p>
        )}
      </Panel>
    </div>
  );
}
