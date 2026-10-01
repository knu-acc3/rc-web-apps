"use client";

import { Ticket } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatSmart } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
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
        "tabular inline-flex size-11 items-center justify-center rounded-full text-base font-bold shadow-elev-1 sm:size-12 sm:text-lg",
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
  const [pick1, setPick1] = useState<number | null>(fields0[0].pick);
  const [of1, setOf1] = useState<number | null>(fields0[0].of);
  const [useSecond, setUseSecond] = useState(fields0.length > 1);
  const [pick2, setPick2] = useState<number | null>(fields0[1]?.pick ?? 1);
  const [of2, setOf2] = useState<number | null>(fields0[1]?.of ?? 20);
  const [tickets, setTickets] = useState(1);
  const [result, setResult] = useState<number[][][] | null>(null);
  const [draws, setDraws] = useState(0);

  const fields: LotteryField[] = fixed
    ? fields0
    : [{ pick: pick1 ?? NaN, of: of1 ?? NaN }, ...(useSecond ? [{ pick: pick2 ?? NaN, of: of2 ?? NaN }] : [])];
  const valid = fields.every(validField);
  const odds = valid ? jackpotCombinations(fields) : null;

  function generate() {
    if (!valid) return;
    setResult(Array.from({ length: tickets }, () => drawTicket(fields)));
    setDraws((d) => d + 1);
  }

  const asText = (r: number[][][]) =>
    r.map((tk, i) => `${r.length > 1 ? `${t.ticket} ${i + 1}: ` : ""}${tk[0].join(", ")}${tk[1] ? ` + ${tk[1].join(", ")}` : ""}`).join("\n");

  const num = (label: string, value: number | null, set: (v: number | null) => void, key: string, max: number) => (
    <Field label={label} htmlFor={`${id}-${key}`}>
      <NumberInput id={`${id}-${key}`} locale={locale} min={1} max={max} value={value} onChange={set} invalid={!valid} />
    </Field>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        {fixed ? (
          <p className="text-[0.9375rem] text-fg-2">
            {t.format}:{" "}
            <strong className="text-fg">
              {fields.map((f) => `${f.pick} ${locale === "ru" ? "из" : "of"} ${f.of}`).join(" + ")}
            </strong>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {num(t.pick, pick1, setPick1, "p1", 100)}
              {num(t.of, of1, setOf1, "o1", 1000)}
            </div>
            <Switch label={t.second} checked={useSecond} onChange={(e) => setUseSecond(e.target.checked)} />
            {useSecond && (
              <div className="grid grid-cols-2 gap-3">
                {num(t.pick, pick2, setPick2, "p2", 100)}
                {num(t.of, of2, setOf2, "o2", 1000)}
              </div>
            )}
            {!valid && (
              <p className="text-sm text-err" role="alert">
                {t.invalid}
              </p>
            )}
          </>
        )}
        <Field label={t.tickets} htmlFor={`${id}-t`} className="w-44">
          <NumberInput id={`${id}-t`} locale={locale} min={1} max={10} value={tickets} onChange={(v) => v !== null && setTickets(v)} />
        </Field>
        <Button variant="filled" size="xl" onClick={generate} disabled={!valid} className="w-full">
          <Ticket aria-hidden />
          {t.generate}
        </Button>
        {odds !== null && (
          <p className="tabular text-center text-sm text-fg-2">
            {t.odds}: <strong className="whitespace-nowrap text-fg">{`${t.oneIn} ${formatSmart(locale, Number(odds), 2)}`}</strong>
          </p>
        )}
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel>
          <PanelHeader title={tickets > 1 ? `${t.ticket} × ${tickets}` : t.ticket} actions={result && <CopyButton value={asText(result)} label={t.copy} copiedLabel={t.copied} variant="ghost" />} />
          <div key={draws} className="flex min-h-28 flex-col justify-center gap-3 px-4 py-4 motion-safe:animate-[menu-in_0.3s_ease-out]">
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
              <p className="text-center text-sm text-fg-3">{t.idle}</p>
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {result ? asText(result) : ""}
          </p>
        </Panel>
        <p className="text-sm text-fg-3">{t.note}</p>
      </div>
    </div>
  );
}
