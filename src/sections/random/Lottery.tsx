"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatSmart, parseNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select, Switch } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { drawTicket, jackpotCombinations, validField, type LotteryField } from "./lib/lottery";

export interface LotteryProps {
  locale: Locale;
  fields?: LotteryField[];
  /** Fixed game format (variant pages): the drum sizes are shown but not editable. */
  fixed?: boolean;
}

const T = {
  ru: {
    pick: "Сколько чисел",
    of: "Из скольких",
    main: "Основные числа",
    bonus: "Дополнительные",
    second: "Второе поле (бонус-шары)",
    tickets: "Сколько билетов",
    generate: "Сгенерировать числа",
    ticket: "Билет",
    idle: "Нажмите «Сгенерировать числа»",
    odds: "Шанс угадать все числа одного билета",
    oneIn: "1 из",
    invalid: "Выберите от 1 до 100 чисел из барабана на 2–1000 шаров — чисел должно быть меньше, чем шаров",
    copy: "Копировать",
    copied: "Скопировано",
    note: "Числа выбираются случайно и без повторов. Никакой генератор не повышает шанс на выигрыш — любая комбинация так же вероятна, как любая другая.",
    format: "Формат",
  },
  en: {
    pick: "Numbers to pick",
    of: "Out of",
    main: "Main numbers",
    bonus: "Bonus",
    second: "Second drum (bonus balls)",
    tickets: "Tickets",
    generate: "Generate numbers",
    ticket: "Ticket",
    idle: "Press “Generate numbers”",
    odds: "Chance to match every number on one ticket",
    oneIn: "1 in",
    invalid: "Pick 1 to 100 numbers from a drum of 2–1000 balls, fewer than the drum holds",
    copy: "Copy",
    copied: "Copied",
    note: "Numbers are drawn at random without repeats. No generator improves your odds — every combination is exactly as likely as any other.",
    format: "Format",
  },
} as const;

function Ball({ n, bonus }: { n: number; bonus?: boolean }) {
  return (
    <span
      className={cn(
        "tabular inline-flex size-10 items-center justify-center rounded-full text-[15px] font-bold sm:size-11",
        bonus ? "bg-accent text-accent-fg" : "border-2 border-line-strong bg-surface text-fg",
      )}
    >
      {n}
    </span>
  );
}

export default function Lottery({ locale, fields: fields0 = [{ pick: 6, of: 45 }], fixed = false }: LotteryProps) {
  const t = T[locale];
  const id = useId();
  const [pick1, setPick1] = useState(String(fields0[0].pick));
  const [of1, setOf1] = useState(String(fields0[0].of));
  const [useSecond, setUseSecond] = useState(fields0.length > 1);
  const [pick2, setPick2] = useState(String(fields0[1]?.pick ?? 1));
  const [of2, setOf2] = useState(String(fields0[1]?.of ?? 20));
  const [tickets, setTickets] = useState(1);
  const [result, setResult] = useState<number[][][] | null>(null);

  const fields: LotteryField[] = fixed
    ? fields0
    : [
        { pick: parseNumber(pick1) ?? NaN, of: parseNumber(of1) ?? NaN },
        ...(useSecond ? [{ pick: parseNumber(pick2) ?? NaN, of: parseNumber(of2) ?? NaN }] : []),
      ];
  const valid = fields.every(validField);
  const odds = valid ? jackpotCombinations(fields) : null;

  function generate() {
    if (!valid) return;
    setResult(Array.from({ length: tickets }, () => drawTicket(fields)));
  }

  const asText = (r: number[][][]) =>
    r.map((tk, i) => `${r.length > 1 ? `${t.ticket} ${i + 1}: ` : ""}${tk[0].join(", ")}${tk[1] ? ` + ${tk[1].join(", ")}` : ""}`).join("\n");

  const num = (label: string, value: string, set: (v: string) => void, key: string) => (
    <Field label={label} htmlFor={`${id}-${key}`}>
      <Input id={`${id}-${key}`} inputMode="numeric" autoComplete="off" value={value} onChange={(e) => set(e.target.value)} aria-invalid={!valid} className="tabular" />
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        {fixed ? (
          <p className="text-[15px] text-fg-2">
            {t.format}:{" "}
            <strong className="text-fg">
              {fields.map((f) => `${f.pick} ${locale === "ru" ? "из" : "of"} ${f.of}`).join(" + ")}
            </strong>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {num(t.pick, pick1, setPick1, "p1")}
              {num(t.of, of1, setOf1, "o1")}
            </div>
            <Switch label={t.second} checked={useSecond} onChange={(e) => setUseSecond(e.target.checked)} />
            {useSecond && (
              <div className="grid grid-cols-2 gap-3">
                {num(t.pick, pick2, setPick2, "p2")}
                {num(t.of, of2, setOf2, "o2")}
              </div>
            )}
            {!valid && (
              <p className="text-sm text-err" role="alert">
                {t.invalid}
              </p>
            )}
          </>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label={t.tickets} htmlFor={`${id}-t`} className="sm:w-40">
            <Select id={`${id}-t`} value={tickets} onChange={(e) => setTickets(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="primary" size="lg" onClick={generate} disabled={!valid} className="w-full sm:w-auto sm:min-w-56">
            {t.generate}
          </Button>
        </div>
        {odds !== null && (
          <p className="tabular text-sm text-fg-2">
            {t.odds}: <strong className="text-fg">{`${t.oneIn} ${formatSmart(locale, Number(odds), 2)}`}</strong>
          </p>
        )}
      </Panel>

      <Panel>
        <PanelHeader title={tickets > 1 ? `${t.ticket} × ${tickets}` : t.ticket} actions={result && <CopyButton value={asText(result)} label={t.copy} copiedLabel={t.copied} variant="ghost" />} />
        <div className="flex flex-col gap-3 px-4 py-4">
          {result ? (
            result.map((tk, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                {result.length > 1 && <span className="tabular w-6 text-sm text-fg-3">{i + 1}.</span>}
                {tk[0].map((n) => (
                  <Ball key={`m${n}`} n={n} />
                ))}
                {tk[1] && <span className="px-1 text-fg-3">+</span>}
                {tk[1]?.map((n) => (
                  <Ball key={`b${n}`} n={n} bonus />
                ))}
              </div>
            ))
          ) : (
            <p className="text-sm text-fg-3">{t.idle}</p>
          )}
          <p className="sr-only" aria-live="polite">
            {result ? asText(result) : ""}
          </p>
        </div>
      </Panel>
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
