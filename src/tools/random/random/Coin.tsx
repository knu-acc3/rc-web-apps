"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Presentable } from "@/ui/fullscreen";
import { count, formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { cn } from "@/lib/cn";
import { Panel, PanelHeader } from "@/ui/panel";
import { randomInt } from "./lib/rng";
import { prefersReducedMotion } from "./lib/storage";
import { HistoryPanel, pushHistory } from "./ui/shared";

export interface CoinProps {
  locale: Locale;
  coins?: number;
}

const T = {
  ru: {
    flip: "Подбросить",
    flipMany: "Подбросить монеты",
    flipping: "Летит…",
    coins: "Количество монет",
    heads: "Орёл",
    tails: "Решка",
    headsForms: ["орёл", "орла", "орлов"],
    tailsForms: ["решка", "решки", "решек"],
    flipForms: ["бросок", "броска", "бросков"],
    result: "Результат",
    idle: "Нажмите «Подбросить»",
    stats: "Статистика",
    total: "Всего бросков",
    streak: "Самая длинная серия",
    current: "Текущая серия",
    reset: "Сбросить",
    history: "Последние броски",
    clear: "Очистить",
    empty: "Пока ни одного броска",
    coin: "Монета",
  },
  en: {
    flip: "Flip",
    flipMany: "Flip coins",
    flipping: "Flipping…",
    coins: "Number of coins",
    heads: "Heads",
    tails: "Tails",
    headsForms: ["heads", "heads"],
    tailsForms: ["tails", "tails"],
    flipForms: ["flip", "flips"],
    result: "Result",
    idle: "Press “Flip”",
    stats: "Statistics",
    total: "Total flips",
    streak: "Longest streak",
    current: "Current streak",
    reset: "Reset",
    history: "Recent flips",
    clear: "Clear",
    empty: "No flips yet",
    coin: "Coin",
  },
} as const;

const DURATION = 1300;
const MAX_SEQ = 100_000;

/** 0 = heads, 1 = tails */
type Side = 0 | 1;

function streaks(seq: readonly Side[]): { longest: number; longestSide: Side | null; current: number; currentSide: Side | null } {
  let longest = 0;
  let longestSide: Side | null = null;
  let run = 0;
  for (let i = 0; i < seq.length; i++) {
    run = i > 0 && seq[i] === seq[i - 1] ? run + 1 : 1;
    if (run > longest) {
      longest = run;
      longestSide = seq[i];
    }
  }
  return { longest, longestSide, current: seq.length ? run : 0, currentSide: seq.length ? seq[seq.length - 1] : null };
}

function CoinFace({ label, back }: { label: string; back?: boolean }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-full border-4 text-center font-bold tracking-tight [backface-visibility:hidden]"
      style={{
        transform: back ? "rotateX(180deg)" : undefined,
        // Preview colours: a metal coin looks the same in light and dark themes.
        background: back ? "radial-gradient(circle at 35% 30%, #f1f3f5, #aeb5bd 70%, #8c949c)" : "radial-gradient(circle at 35% 30%, #fff1b8, #e0b43c 65%, #b8892a)",
        borderColor: back ? "#7d858d" : "#a67a22",
        color: "#2b2410",
      }}
    >
      <span className="px-2 text-[clamp(0.875rem,4.2vw,1.375rem)] leading-tight">{label}</span>
    </div>
  );
}

export default function Coin({ locale, coins: coins0 = 1 }: CoinProps) {
  const t = T[locale];
  const id = useId();
  const [coins, setCoins] = useState(Math.min(10, Math.max(1, coins0)));
  const [angles, setAngles] = useState<number[]>(() => new Array(10).fill(0));
  const [flipping, setFlipping] = useState(false);
  const [last, setLast] = useState<Side[] | null>(null);
  const [seq, setSeq] = useState<Side[]>([]);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hid = useRef(0);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const stats = useMemo(() => {
    const heads = seq.reduce<number>((n, s) => n + (s === 0 ? 1 : 0), 0);
    return { heads, tails: seq.length - heads, ...streaks(seq) };
  }, [seq]);

  const sideName = (s: Side) => (s === 0 ? t.heads : t.tails);

  function describe(r: Side[]): string {
    if (r.length === 1) return sideName(r[0]);
    const h = r.filter((s) => s === 0).length;
    return `${count(locale, h, t.headsForms)}, ${count(locale, r.length - h, t.tailsForms)}`;
  }

  function flip() {
    if (flipping) return;
    const r: Side[] = Array.from({ length: coins }, () => randomInt(2) as Side);
    setAngles((prev) =>
      prev.map((a, i) => {
        if (i >= coins) return a;
        const base = Math.ceil(a / 360) * 360;
        return base + 360 * (4 + (i % 3)) + (r[i] === 1 ? 180 : 0);
      }),
    );
    setLast(null);
    const done = () => {
      setFlipping(false);
      setLast(r);
      setSeq((s) => (s.length + r.length > MAX_SEQ ? [...s.slice(r.length), ...r] : [...s, ...r]));
      setHistory((h) => pushHistory(h, { id: hid.current++, text: r.length === 1 ? sideName(r[0]) : r.map((s) => sideName(s)[0]).join(" ") }, 60));
    };
    if (prefersReducedMotion()) {
      done();
      return;
    }
    setFlipping(true);
    timer.current = setTimeout(done, DURATION);
  }

  function reset() {
    setSeq([]);
    setHistory([]);
    setLast(null);
  }

  const pct = (n: number) => (seq.length ? `${formatNumber(locale, (n / seq.length) * 100, { maximumFractionDigits: 1 })} %` : "—");

  const stat = (label: string, value: string, wide = false) => (
    <div key={label} className={cn("min-w-0 rounded-[1rem] bg-surface-2 px-4 py-2.5", wide && "col-span-2")}>
      <dt className="text-[0.8125rem] text-fg-3">{label}</dt>
      <dd className="tabular font-semibold text-fg">{value}</dd>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)] lg:items-start">
      <Presentable locale={locale} className="panel flex flex-col items-center gap-5 p-4 sm:p-6" fullClassName="rounded-none shadow-none [&_.coin-one]:size-[min(60vw,45vh)]!">
        <div className="flex min-h-44 flex-wrap items-center justify-center gap-4 pt-6 [perspective:900px] sm:min-h-56">
          {Array.from({ length: coins }, (_, i) => (
            <div
              key={i}
              className={coins === 1 ? "coin-one relative size-40 sm:size-52" : "relative size-20 sm:size-24"}
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateX(${angles[i]}deg)`,
                transition: `transform ${DURATION}ms cubic-bezier(0.22, 0.8, 0.28, 1)`,
              }}
              aria-hidden
            >
              <CoinFace label={t.heads} />
              <CoinFace label={t.tails} back />
            </div>
          ))}
        </div>

        <div aria-live="polite" className="min-h-10 text-center text-3xl font-bold text-fg">
          {last ? <span key={history[0]?.id} className="inline-block motion-safe:animate-[pop_0.4s_ease-out]">{describe(last)}</span> : flipping ? "" : <span className="text-base font-normal text-fg-3">{t.idle}</span>}
        </div>

        <Button variant="filled" size="xl" onClick={flip} disabled={flipping} className="w-full sm:w-auto sm:min-w-64">
          {flipping ? t.flipping : coins > 1 ? t.flipMany : t.flip}
        </Button>
        <Field label={t.coins} htmlFor={`${id}-n`} className="w-44">
          <NumberInput id={`${id}-n`} locale={locale} min={1} max={10} value={coins} disabled={flipping} onChange={(v) => v !== null && setCoins(Math.min(10, Math.max(1, v)))} />
        </Field>
      </Presentable>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel>
          <PanelHeader
            title={t.stats}
            actions={
              seq.length > 0 && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw aria-hidden />
                  {t.reset}
                </Button>
              )
            }
          />
          <dl className="grid grid-cols-2 gap-2 p-3">
            {stat(t.total, count(locale, seq.length, t.flipForms), true)}
            {stat(t.heads, `${formatNumber(locale, stats.heads)} · ${pct(stats.heads)}`)}
            {stat(t.tails, `${formatNumber(locale, stats.tails)} · ${pct(stats.tails)}`)}
            {stat(t.streak, stats.longestSide === null ? "—" : `${formatNumber(locale, stats.longest)} · ${sideName(stats.longestSide)}`)}
            {stat(t.current, stats.currentSide === null ? "—" : `${formatNumber(locale, stats.current)} · ${sideName(stats.currentSide)}`)}
          </dl>
        </Panel>
        <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} render="inline" />
      </div>
    </div>
  );
}
