"use client";

import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Panel } from "@/ui/panel";
import { randomInt } from "./lib/rng";
import { rpsOutcome, type Move, type Outcome } from "./lib/rps";
import { HistoryPanel, pushHistory } from "./ui/shared";

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
    idle: "Ваш ход",
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
    idle: "Your move",
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,1fr)] lg:items-start">
      <Panel className="flex flex-col items-center gap-5 p-4 sm:p-6">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
          {(["you", "cpu"] as const).map((who, i) => (
            <div key={who} className={cn("flex flex-col items-center gap-1", i === 1 && "col-start-3")}>
              <span className="text-[0.8125rem] font-medium text-fg-2">{t[who]}</span>
              <span
                key={round ? `${who}${history[0]?.id}` : who}
                className="flex size-24 items-center justify-center rounded-full bg-surface-2 text-5xl motion-safe:animate-[menu-in_0.3s_ease-out] sm:size-32 sm:text-6xl"
                aria-hidden
              >
                {round ? GLYPH[round[who]] : "?"}
              </span>
              <span className="min-h-6 text-sm text-fg-2">{round ? t.moves[round[who]] : ""}</span>
            </div>
          ))}
          <span className="col-start-2 row-start-1 text-sm text-fg-3">{t.vs}</span>
        </div>
        <p aria-live="polite" className={cn("min-h-9 text-center text-2xl font-bold sm:text-3xl", round ? TONE[round.outcome] : "text-fg-3")}>
          {round ? t.outcomes[round.outcome] : <span className="text-base font-normal">{t.idle}</span>}
        </p>
        <div role="group" aria-label={t.choose} className="grid w-full max-w-lg grid-cols-3 gap-2 sm:gap-3">
          {([0, 1, 2] as Move[]).map((m) => (
            <Button key={m} variant="filled" size="xl" onClick={() => play(m)} className="h-20! flex-col gap-0.5! px-2!">
              <span className="text-3xl leading-none" aria-hidden>
                {GLYPH[m]}
              </span>
              <span className="text-sm">{t.moves[m]}</span>
            </Button>
          ))}
        </div>
        <dl className="grid w-full max-w-lg grid-cols-3 gap-2 text-center">
          {(
            [
              [t.wins, score.win, "text-ok"],
              [t.losses, score.lose, "text-err"],
              [t.draws, score.draw, "text-fg"],
            ] as const
          ).map(([k, v, tone]) => (
            <div key={k} className="rounded-[1rem] bg-surface-2 px-2 py-2">
              <dt className="text-[0.8125rem] text-fg-3">{k}</dt>
              <dd className={cn("tabular text-2xl font-bold", tone)}>{v}</dd>
            </div>
          ))}
        </dl>
        {score.win + score.lose + score.draw > 0 && (
          <Button variant="text" size="sm" onClick={() => setScore({ win: 0, lose: 0, draw: 0 })} className="-mt-2">
            <RotateCcw aria-hidden />
            {t.reset}
          </Button>
        )}
      </Panel>
      <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} />
    </div>
  );
}
