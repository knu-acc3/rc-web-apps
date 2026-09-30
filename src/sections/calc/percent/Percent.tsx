"use client";

import { useId } from "react";
import { CopyButton } from "@/ui/copy-button";
import { Tabs } from "@/ui/tabs";
import type { ToolProps } from "../../types";
import { fmtN, fmtRound } from "../kit/fmt";
import { tidy } from "../kit/math";
import { field, toInput } from "../kit/num";
import { CalcGrid, Explain, FieldRow, InlineSelect, NumField, OptionsRow, ResultMain, ResultRows, Stack, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";
import { computePercent, PERCENT_DEFAULTS, PERCENT_MODES, type PercentMode } from "./engine";

type Mode = PercentMode;

const PRECISION = ["auto", "0", "1", "2", "3", "4"] as const;

const T = {
  ru: {
    modeLabel: "Что посчитать",
    modes: {
      "x-percent-of-y": "Процент от числа",
      "what-percent": "Сколько процентов",
      "percent-change": "Изменение в %",
      "add-percent": "Прибавить %",
      "subtract-percent": "Вычесть %",
      "reverse-percent": "Число по проценту",
      "percentage-points": "Процентные пункты",
    } satisfies Record<Mode, string>,
    fields: {
      "x-percent-of-y": ["Процент", "От числа"],
      "what-percent": ["Число", "От числа"],
      "percent-change": ["Было", "Стало"],
      "add-percent": ["Число", "Прибавить"],
      "subtract-percent": ["Число", "Вычесть"],
      "reverse-percent": ["Число", "Составляет"],
      "percentage-points": ["Было", "Стало"],
    } satisfies Record<Mode, [string, string]>,
    answer: "Ответ",
    precision: "Округление",
    auto: "Авто",
    digits: (n: string) => `${n} зн.`,
    div0: "На ноль делить нельзя — измените число",
    enter: "Введите оба числа",
    copy: "Копировать",
    copied: "Скопировано",
    grow: "Рост",
    fall: "Снижение",
    same: "Без изменений",
    delta: "Разница",
    multiplier: "Коэффициент",
    added: "Прибавка",
    removed: "Вычтено",
    relative: "Относительное изменение",
    others: (b: string) => `Другие проценты от ${b}`,
    pp: "п. п.",
    formulaTitle: "Формула",
    formulas: {
      "x-percent-of-y": ["Результат = Число × Процент / 100"],
      "what-percent": ["Процент = Часть / Целое × 100"],
      "percent-change": ["Изменение = (Стало − Было) / |Было| × 100"],
      "add-percent": ["Результат = Число × (1 + Процент / 100)"],
      "subtract-percent": ["Результат = Число × (1 − Процент / 100)"],
      "reverse-percent": ["Целое = Часть × 100 / Процент"],
      "percentage-points": ["Разница, п. п. = Стало − Было", "Относительное изменение = (Стало − Было) / Было × 100 %"],
    } satisfies Record<Mode, string[]>,
    notes: {
      "x-percent-of-y": ["1 % — это одна сотая часть числа, поэтому число делят на 100 и умножают на процент.", "Числа можно вводить с запятой и пробелами: «1 000,5»."],
      "what-percent": ["Если часть больше целого, ответ будет больше 100 %.", "Целое не может быть равно нулю."],
      "percent-change": ["Изменение считается относительно исходного значения «Было».", "Рост с 50 до 100 — это +100 %, а снижение со 100 до 50 — только −50 %: база у них разная."],
      "add-percent": ["Так считают наценку и цену с НДС: 1000 + 16 % = 1160.", "Прибавить 10 %, а затем вычесть 10 % — не то же самое, что вернуться к исходному числу."],
      "subtract-percent": ["Так считают цену со скидкой: 1000 − 20 % = 800.", "Процент больше 100 даёт отрицательный результат."],
      "reverse-percent": ["Помогает найти исходную сумму, если известна её часть и доля в процентах.", "Чтобы узнать цену без НДС из цены с НДС, используйте калькулятор НДС."],
      "percentage-points": ["Процентный пункт — это разница между двумя процентами: ставка выросла с 12 % до 16 % — на 4 п. п.", "В относительном выражении тот же рост составляет 33,33 %."],
    } satisfies Record<Mode, string[]>,
  },
  en: {
    modeLabel: "What to calculate",
    modes: {
      "x-percent-of-y": "Percent of a number",
      "what-percent": "What percent",
      "percent-change": "Percent change",
      "add-percent": "Add %",
      "subtract-percent": "Subtract %",
      "reverse-percent": "Find the whole",
      "percentage-points": "Percentage points",
    } satisfies Record<Mode, string>,
    fields: {
      "x-percent-of-y": ["Percent", "Of number"],
      "what-percent": ["Number", "Of number"],
      "percent-change": ["From", "To"],
      "add-percent": ["Number", "Add"],
      "subtract-percent": ["Number", "Subtract"],
      "reverse-percent": ["Number", "Is this percent"],
      "percentage-points": ["From", "To"],
    } satisfies Record<Mode, [string, string]>,
    answer: "Answer",
    precision: "Rounding",
    auto: "Auto",
    digits: (n: string) => `${n} dp`,
    div0: "Division by zero — change the number",
    enter: "Enter both numbers",
    copy: "Copy",
    copied: "Copied",
    grow: "Increase",
    fall: "Decrease",
    same: "No change",
    delta: "Difference",
    multiplier: "Multiplier",
    added: "Added",
    removed: "Subtracted",
    relative: "Relative change",
    others: (b: string) => `Other percentages of ${b}`,
    pp: "pp",
    formulaTitle: "Formula",
    formulas: {
      "x-percent-of-y": ["Result = Number × Percent / 100"],
      "what-percent": ["Percent = Part / Whole × 100"],
      "percent-change": ["Change = (New − Old) / |Old| × 100"],
      "add-percent": ["Result = Number × (1 + Percent / 100)"],
      "subtract-percent": ["Result = Number × (1 − Percent / 100)"],
      "reverse-percent": ["Whole = Part × 100 / Percent"],
      "percentage-points": ["Difference, pp = New − Old", "Relative change = (New − Old) / Old × 100%"],
    } satisfies Record<Mode, string[]>,
    notes: {
      "x-percent-of-y": ["1% is one hundredth of a number, so divide by 100 and multiply by the percentage.", "You can type numbers with separators, e.g. 1,000.5."],
      "what-percent": ["If the part is larger than the whole, the answer is above 100%.", "The whole cannot be zero."],
      "percent-change": ["The change is measured against the original (From) value.", "Going from 50 to 100 is +100%, but going from 100 to 50 is only −50% — the base differs."],
      "add-percent": ["This is how markups and prices with VAT are calculated: 1000 + 16% = 1160.", "Adding 10% and then subtracting 10% does not bring you back to the starting number."],
      "subtract-percent": ["This is how sale prices are calculated: 1000 − 20% = 800.", "A percentage above 100 gives a negative result."],
      "reverse-percent": ["Finds the original total when you know a part and its share in percent.", "To remove VAT from a gross price, use the VAT calculator."],
      "percentage-points": ["A percentage point is the difference between two percentages: a rate rising from 12% to 16% rose by 4 pp.", "In relative terms the same increase is 33.33%."],
    } satisfies Record<Mode, string[]>,
  },
} as const;

const OTHER_PERCENTS = [1, 5, 10, 20, 25, 50, 75];

export default function Percent({ locale, mode: mode0 = "x-percent-of-y" }: ToolProps<{ mode?: Mode }>) {
  const t = T[locale];
  const id = useId();
  const [da, db] = PERCENT_DEFAULTS[mode0];
  const q = useQueryState(
    { m: mode0, a: toInput(locale, da), b: toInput(locale, db), d: "auto" },
    { enums: { m: PERCENT_MODES, d: PRECISION } },
  );
  const mode = q.v.m as Mode;
  const prec = q.v.d as (typeof PRECISION)[number];
  const A = field(locale, q.v.a);
  const B = field(locale, q.v.b);
  const r = A.value !== null && B.value !== null ? computePercent(mode, A.value, B.value) : null;

  const f = (n: number, maxAuto = 6) => (prec === "auto" ? fmtN(locale, n, maxAuto) : fmtRound(locale, n, Number(prec)));
  const pct = (n: number) => `${f(n, 4)}${locale === "ru" ? " %" : "%"}`;
  const signed = (n: number, s: string) => (n > 0 ? `+${s}` : n < 0 ? s.replace("-", "−") : s);
  const a = A.value ?? 0;
  const b = B.value ?? 0;

  let main = "—";
  let sentence: string = t.enter;
  let formula = "";
  const extra: { label: string; value: string }[] = [];

  if (r && !r.ok) sentence = t.div0;
  if (r && r.ok) {
    const v = r.value;
    switch (mode) {
      case "x-percent-of-y":
        main = f(v);
        sentence = `${pct(a)} ${locale === "ru" ? "от" : "of"} ${f(b)} = ${f(v)}`;
        formula = `${f(b)} × ${f(a)} / 100 = ${f(v)}`;
        break;
      case "what-percent":
        main = pct(v);
        sentence = locale === "ru" ? `${f(a)} — это ${pct(v)} от ${f(b)}` : `${f(a)} is ${pct(v)} of ${f(b)}`;
        formula = `${f(a)} / ${f(b)} × 100 = ${f(v, 4)}`;
        break;
      case "percent-change":
        main = signed(v, pct(v));
        sentence = `${f(a)} → ${f(b)}: ${v > 0 ? t.grow : v < 0 ? t.fall : t.same}${v !== 0 ? (locale === "ru" ? " на " : " of ") + pct(Math.abs(v)) : ""}`;
        formula = `(${f(b)} − ${f(a)}) / ${f(Math.abs(a))} × 100 = ${f(v, 4)}`;
        extra.push({ label: t.delta, value: signed(r.delta ?? 0, f(r.delta ?? 0)) }, { label: t.multiplier, value: `× ${f(tidy(b / a), 6)}` });
        break;
      case "add-percent":
        main = f(v);
        sentence = `${f(a)} + ${pct(b)} = ${f(v)}`;
        formula = `${f(a)} × (1 + ${f(b)} / 100) = ${f(v)}`;
        extra.push({ label: t.added, value: f(r.delta ?? 0) });
        break;
      case "subtract-percent":
        main = f(v);
        sentence = `${f(a)} − ${pct(b)} = ${f(v)}`;
        formula = `${f(a)} × (1 − ${f(b)} / 100) = ${f(v)}`;
        extra.push({ label: t.removed, value: f(r.delta ?? 0) });
        break;
      case "reverse-percent":
        main = f(v);
        sentence = locale === "ru" ? `${f(a)} — это ${pct(b)} от ${f(v)}` : `${f(a)} is ${pct(b)} of ${f(v)}`;
        formula = `${f(a)} × 100 / ${f(b)} = ${f(v)}`;
        break;
      case "percentage-points":
        main = `${signed(v, f(v))} ${t.pp}`;
        sentence = `${pct(a)} → ${pct(b)}: ${signed(v, f(v))} ${t.pp}`;
        formula = `${f(b)} − ${f(a)} = ${f(v)} ${t.pp}`;
        if (r.relative !== undefined) extra.push({ label: t.relative, value: signed(r.relative, pct(r.relative)) });
        break;
    }
  }

  const [la, lb] = t.fields[mode];
  const pctA = mode === "x-percent-of-y" || mode === "percentage-points";
  const pctB = mode === "add-percent" || mode === "subtract-percent" || mode === "reverse-percent" || mode === "percentage-points";

  function switchMode(m: Mode) {
    const [x, y] = PERCENT_DEFAULTS[m];
    q.set({ m, a: toInput(locale, x), b: toInput(locale, y) });
  }

  return (
    <Stack>
      <div className="flex flex-col gap-4">
        <Tabs label={t.modeLabel} value={mode} onChange={switchMode} items={PERCENT_MODES.map((m) => ({ value: m, label: t.modes[m] }))} />
        <CalcGrid
          inputs={
            <>
              <FieldRow>
                <NumField id={`${id}-a`} label={la} value={q.v.a} onChange={(a) => q.set({ a })} suffix={pctA ? "%" : undefined} error={A.message} size="lg" />
                <NumField id={`${id}-b`} label={lb} value={q.v.b} onChange={(b) => q.set({ b })} suffix={pctB ? "%" : undefined} error={B.message} size="lg" />
              </FieldRow>
              <OptionsRow>
                <InlineSelect
                  id={`${id}-d`}
                  label={t.precision}
                  value={prec}
                  onChange={(d) => q.set({ d })}
                  options={PRECISION.map((p) => ({ value: p, label: p === "auto" ? t.auto : t.digits(p) }))}
                />
              </OptionsRow>
            </>
          }
          result={
            <ResultMain
              label={t.answer}
              value={main}
              sub={sentence}
              rows={extra}
              actions={
                <ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl}>
                  {r?.ok && <CopyButton value={main.replace(/[  ]/g, " ")} label={t.copy} copiedLabel={t.copied} variant="ghost" />}
                </ToolActions>
              }
            >
              {formula && <code className="tabular mt-3 inline-block rounded-[6px] bg-surface px-2 py-1 text-sm text-fg-2">{formula}</code>}
            </ResultMain>
          }
        />
      </div>
      {mode === "x-percent-of-y" && B.value !== null && (
        <ResultRows title={t.others(f(b))} rows={OTHER_PERCENTS.filter((p) => p !== a).map((p) => ({ label: pct(p), value: f(tidy((b * p) / 100)) }))} />
      )}
      <Explain locale={locale} formula={t.formulas[mode]} notes={t.notes[mode]} />
    </Stack>
  );
}

