"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Field, Select } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { randomInt } from "./lib/rng";
import { prefersReducedMotion } from "./lib/storage";
import { HistoryPanel, pushHistory } from "./shared";

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
      <span className="px-2 text-[clamp(14px,4.2vw,22px)] leading-tight">{label}</span>
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

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-center gap-4 [perspective:900px]">
          {Array.from({ length: coins }, (_, i) => (
            <div
              key={i}
              className={coins === 1 ? "relative size-40 sm:size-48" : "relative size-20 sm:size-24"}
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

        <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Field label={t.coins} htmlFor={`${id}-n`} className="w-full sm:w-44">
            <Select id={`${id}-n`} value={coins} onChange={(e) => setCoins(Number(e.target.value))} disabled={flipping}>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="primary" size="lg" onClick={flip} disabled={flipping} className="w-full self-end sm:w-auto sm:min-w-48">
            {flipping ? t.flipping : coins > 1 ? t.flipMany : t.flip}
          </Button>
        </div>

        <div className="flex min-h-[76px] w-full flex-col items-center justify-center rounded-[10px] bg-surface-2 px-4 py-3 text-center">
          <div className="text-[13px] font-medium text-fg-2">{t.result}</div>
          <div aria-live="polite" className="min-h-8 text-2xl font-semibold text-fg">
            {last ? describe(last) : ""}
          </div>
          {!last && !flipping && <div className="text-sm text-fg-3">{t.idle}</div>}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
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
          <dl className="grid grid-cols-2 gap-px bg-line">
            {[
              [t.total, count(locale, seq.length, t.flipForms)],
              [t.heads, `${formatNumber(locale, stats.heads)} · ${pct(stats.heads)}`],
              [t.tails, `${formatNumber(locale, stats.tails)} · ${pct(stats.tails)}`],
              [t.streak, stats.longestSide === null ? "—" : `${formatNumber(locale, stats.longest)} · ${sideName(stats.longestSide)}`],
              [t.current, stats.currentSide === null ? "—" : `${formatNumber(locale, stats.current)} · ${sideName(stats.currentSide)}`],
            ].map(([k, v], i) => (
              <div key={k} className={i === 0 ? "col-span-2 bg-surface px-4 py-2.5" : "bg-surface px-4 py-2.5"}>
                <dt className="text-[13px] text-fg-3">{k}</dt>
                <dd className="tabular font-semibold text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} render="inline" />
      </div>
    </div>
  );
}
