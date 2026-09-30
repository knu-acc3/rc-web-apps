"use client";

import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Panel } from "@/ui/panel";
import { randomInt } from "./lib/rng";
import { rpsOutcome, type Move, type Outcome } from "./lib/rps";
import { HistoryPanel, pushHistory } from "./shared";

export interface RpsProps {
  locale: Locale;
}

const GLYPH = ["✊", "✋", "✌️"] as const;

const T = {
  ru: {
    moves: ["Камень", "Бумага", "Ножницы"],
    choose: "Ваш ход",
    you: "Вы",
    cpu: "Компьютер",
    outcomes: { win: "Вы победили!", lose: "Победил компьютер", draw: "Ничья" },
    score: "Счёт",
    wins: "Победы",
    losses: "Поражения",
    draws: "Ничьи",
    reset: "Сбросить счёт",
    idle: "Выберите камень, ножницы или бумагу",
    history: "Раунды",
    clear: "Очистить",
    empty: "Здесь появятся сыгранные раунды",
    vs: "против",
  },
  en: {
    moves: ["Rock", "Paper", "Scissors"],
    choose: "Your move",
    you: "You",
    cpu: "Computer",
    outcomes: { win: "You win!", lose: "Computer wins", draw: "Draw" },
    score: "Score",
    wins: "Wins",
    losses: "Losses",
    draws: "Draws",
    reset: "Reset score",
    idle: "Choose rock, paper or scissors",
    history: "Rounds",
    clear: "Clear",
    empty: "Played rounds will appear here",
    vs: "vs",
  },
} as const;

const TONE: Record<Outcome, string> = { win: "text-ok", lose: "text-err", draw: "text-fg-2" };

export default function Rps({ locale }: RpsProps) {
  const t = T[locale];
  const [round, setRound] = useState<{ you: Move; cpu: Move; outcome: Outcome } | null>(null);
  const [score, setScore] = useState({ win: 0, lose: 0, draw: 0 });
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const hid = useRef(0);

  function play(you: Move) {
    const cpu = randomInt(3) as Move;
    const outcome = rpsOutcome(you, cpu);
    setRound({ you, cpu, outcome });
    setScore((s) => ({ ...s, [outcome]: s[outcome] + 1 }));
    setHistory((h) => pushHistory(h, { id: hid.current++, text: `${GLYPH[you]} ${t.moves[you]} ${t.vs} ${GLYPH[cpu]} ${t.moves[cpu]} — ${t.outcomes[outcome]}` }));
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-4 sm:p-6">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
          {(["you", "cpu"] as const).map((who, i) => (
            <div key={who} className={cn("flex flex-col items-center gap-1", i === 1 && "col-start-3")}>
              <span className="text-[0.8125rem] font-medium text-fg-2">{t[who]}</span>
              <span className="flex size-24 items-center justify-center rounded-full bg-surface-2 text-5xl sm:size-28 sm:text-6xl" aria-hidden>
                {round ? GLYPH[round[who]] : "?"}
              </span>
              <span className="min-h-6 text-sm text-fg-2">{round ? t.moves[round[who]] : ""}</span>
            </div>
          ))}
          <span className="col-start-2 row-start-1 text-sm text-fg-3">{t.vs}</span>
        </div>
        <p aria-live="polite" className={cn("min-h-9 text-center text-2xl font-bold sm:text-3xl", round ? TONE[round.outcome] : "text-fg-3")}>
          {round ? t.outcomes[round.outcome] : ""}
        </p>
        {!round && <p className="-mt-4 text-sm text-fg-3">{t.idle}</p>}
        <div role="group" aria-label={t.choose} className="grid w-full max-w-md grid-cols-3 gap-2">
          {([0, 1, 2] as Move[]).map((m) => (
            <Button key={m} variant="primary" size="lg" onClick={() => play(m)} className="h-16! flex-col gap-0! px-2!">
              <span className="text-2xl leading-none" aria-hidden>
                {GLYPH[m]}
              </span>
              <span className="text-sm">{t.moves[m]}</span>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-fg-2">
          <span className="tabular">
            {t.wins}: <strong className="text-ok">{score.win}</strong>
          </span>
          <span className="tabular">
            {t.losses}: <strong className="text-err">{score.lose}</strong>
          </span>
          <span className="tabular">
            {t.draws}: <strong className="text-fg">{score.draw}</strong>
          </span>
          {score.win + score.lose + score.draw > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setScore({ win: 0, lose: 0, draw: 0 })}>
              <RotateCcw aria-hidden />
              {t.reset}
            </Button>
          )}
        </div>
      </Panel>
      <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} />
    </div>
  );
}
