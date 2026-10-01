"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Presentable } from "@/ui/fullscreen";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { diceRange, diceStats, parseDice, rollDice, type DiceError, type DiceRoll } from "./lib/dice";
import { HistoryPanel, pushHistory } from "./ui/shared";

export interface DiceProps {
  locale: Locale;
  notation?: string;
}

const DIE_TYPES = ["4", "6", "8", "10", "12", "20", "100"] as const;

const T = {
  ru: {
    die: "Кубик",
    count: "Сколько кубиков",
    formula: "Формула броска",
    formulaHint: "Например: 2d6+3, 4d6, d20−1, 3d6+1d4. Можно писать «к» вместо «d».",
    roll: "Бросить",
    total: "Сумма",
    idle: "Нажмите «Бросить»",
    range: "Диапазон",
    mean: "Среднее",
    history: "История бросков",
    clear: "Очистить",
    empty: "Бросков пока не было",
    errors: {
      empty: "Введите формулу, например 2d6",
      syntax: "Не удалось разобрать формулу. Пример: 2d6+3",
      count: "Кубиков в одной группе — от 1 до 100",
      sides: "У кубика должно быть от 2 до 1000 граней",
      total: "Всего не больше 200 кубиков",
      const: "Слишком большой модификатор",
    } satisfies Record<DiceError, string>,
    modifier: "модификатор",
  },
  en: {
    die: "Die",
    count: "Number of dice",
    formula: "Dice formula",
    formulaHint: "For example: 2d6+3, 4d6, d20-1, 3d6+1d4.",
    roll: "Roll",
    total: "Total",
    idle: "Press “Roll”",
    range: "Range",
    mean: "Average",
    history: "Roll history",
    clear: "Clear",
    empty: "No rolls yet",
    errors: {
      empty: "Enter a formula such as 2d6",
      syntax: "Couldn't read the formula. Example: 2d6+3",
      count: "Use 1 to 100 dice per group",
      sides: "A die needs 2 to 1000 sides",
      total: "At most 200 dice in total",
      const: "The modifier is too large",
    } satisfies Record<DiceError, string>,
    modifier: "modifier",
  },
} as const;

/** Pips for a d6 face (3×3 grid positions). */
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function DieFace({ value, sides, negative }: { value: number; sides: number; negative?: boolean }) {
  const base = "flex size-14 shrink-0 items-center justify-center rounded-[0.625rem] border-2 sm:size-16";
  if (sides === 6) {
    return (
      <span className={cn(base, "grid grid-cols-3 grid-rows-3 gap-0.5 p-2", negative ? "border-err bg-err-soft" : "border-line-strong bg-surface")} role="img" aria-label={String(value)}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={cn("m-auto size-2.5 rounded-full sm:size-3", PIPS[value]?.includes(i) ? "bg-fg" : "bg-transparent")} />
        ))}
      </span>
    );
  }
  return (
    <span className={cn(base, "tabular text-xl font-bold text-fg", negative ? "border-err bg-err-soft" : "border-line-strong bg-surface")}>
      {value}
    </span>
  );
}

/** "3 + 5 − 2 + 1" */
function breakdown(r: DiceRoll): string {
  const parts: string[] = [];
  for (const g of r.groups)
    for (const f of g.faces) parts.push(parts.length === 0 ? (g.sign < 0 ? `−${f}` : String(f)) : g.sign < 0 ? `− ${f}` : `+ ${f}`);
  if (r.modifier) parts.push(r.modifier > 0 ? `+ ${r.modifier}` : `− ${-r.modifier}`);
  return parts.join(" ");
}

export default function Dice({ locale, notation: notation0 = "1d6" }: DiceProps) {
  const t = T[locale];
  const id = useId();
  const [notation, setNotation] = useState(notation0);
  const [roll, setRoll] = useState<(DiceRoll & { detail: string }) | null>(null);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const hid = useRef(0);

  const parsed = useMemo(() => parseDice(notation), [notation]);
  const single = parsed.ok && parsed.expr.terms.length === 1 && parsed.expr.terms[0].kind === "dice" && parsed.expr.terms[0].sign > 0 ? parsed.expr.terms[0] : null;
  const dieValue = single && (DIE_TYPES as readonly string[]).includes(String(single.sides)) ? String(single.sides) : "";
  const info = parsed.ok ? { ...diceRange(parsed.expr), ...diceStats(parsed.expr) } : null;

  function doRoll() {
    if (!parsed.ok) return;
    const r = rollDice(parsed.expr);
    const b = breakdown(r);
    const detail = b.length > 160 || b === String(r.total) ? "" : b;
    setRoll({ ...r, detail });
    setHistory((h) => pushHistory(h, { id: hid.current++, text: `${parsed.expr.text}: ${detail ? `${detail} = ` : ""}${r.total}` }));
  }

  const setSimple = (n: number, sides: string) => {
    setNotation(`${n}d${sides}`);
    setRoll(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-2">{t.die}</span>
            <Segmented
              label={t.die}
              value={dieValue}
              onChange={(v) => setSimple(single?.count ?? 1, v)}
              options={DIE_TYPES.map((d) => ({ value: d, label: `d${d}` }))}
            />
          </div>
          <Field label={t.count} htmlFor={`${id}-n`} className="sm:w-40">
            <Select id={`${id}-n`} value={single ? Math.min(single.count, 10) : ""} onChange={(e) => setSimple(Number(e.target.value), dieValue || "6")}>
              {!single && <option value="">—</option>}
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={t.formula} htmlFor={`${id}-f`} hint={parsed.ok || !notation ? t.formulaHint : undefined} error={!parsed.ok && notation ? t.errors[parsed.error] : undefined}>
          <Input
            id={`${id}-f`}
            value={notation}
            onChange={(e) => {
              setNotation(e.target.value);
              setRoll(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") doRoll();
            }}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!parsed.ok}
            className="font-mono"
            size="lg"
          />
        </Field>
        {info && (
          <p className="tabular text-sm text-fg-2">
            {t.range}: {formatNumber(locale, info.min)}…{formatNumber(locale, info.max)} · {t.mean}: {formatNumber(locale, info.mean, { maximumFractionDigits: 2 })}
          </p>
        )}
        <Button variant="primary" size="lg" onClick={doRoll} disabled={!parsed.ok} className="w-full sm:w-auto sm:self-start sm:min-w-48">
          {t.roll} {parsed.ok ? parsed.expr.text : ""}
        </Button>
      </Panel>

      <Presentable locale={locale} className="rounded-[0.75rem] border border-line bg-surface flex flex-col items-center gap-4 p-4 sm:p-5">
        {roll ? (
          <div className="flex max-w-full flex-wrap justify-center gap-2" aria-hidden>
            {roll.groups.flatMap((g, gi) => g.faces.map((f, i) => <DieFace key={`${gi}-${i}`} value={f} sides={g.sides} negative={g.sign < 0} />))}
            {roll.modifier !== 0 && (
              <span className="flex h-14 items-center rounded-[0.625rem] bg-surface-2 px-3 text-lg font-semibold text-fg-2 sm:h-16">
                {roll.modifier > 0 ? `+${roll.modifier}` : `−${-roll.modifier}`}
              </span>
            )}
          </div>
        ) : (
          <p className="py-4 text-sm text-fg-3">{t.idle}</p>
        )}
        <div className="text-center">
          <div className="text-[0.8125rem] font-medium text-fg-2">{t.total}</div>
          <div aria-live="polite" className="fs-big tabular min-h-12 text-5xl font-bold tracking-tight text-fg">
            {roll ? formatNumber(locale, roll.total) : ""}
          </div>
          {roll?.detail && <div className="tabular mt-1 max-w-full text-sm break-words text-fg-3">{roll.detail}</div>}
        </div>
      </Presentable>

      <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} />
    </div>
  );
}
