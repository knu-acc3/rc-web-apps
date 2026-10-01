"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useId } from "react";
import { Button, IconButton } from "@/ui/button";
import { Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import type { ToolProps } from "../../../types";
import { Donut } from "../../shared/charts";
import { CURRENCY_SYMBOL, fmtMoney, fmtPct, isCurrency, moneyMax, type Currency } from "../../shared/fmt";
import { readNum, toInput } from "../../shared/num";
import { useStored } from "../../shared/storage";
import { Explain, NumSlider, OptionsRow, ResultMain, Stack, SubHeading } from "../../shared/ui";
import { BUCKETS, rule503020, type Bucket } from "../lib/money";
import { CurrencySelect } from "../loan/parts";

const T = {
  ru: {
    income: "Доход в месяц после налогов",
    stored: "Данные хранятся только в этом браузере",
    categories: "Расходы по категориям",
    name: "Категория",
    amount: "Сумма",
    bucket: "Группа",
    buckets: { needs: "Необходимое", wants: "Желания", savings: "Накопления" } satisfies Record<Bucket, string>,
    targets: { needs: "50 %", wants: "30 %", savings: "20 %" } satisfies Record<Bucket, string>,
    add: "Добавить категорию",
    remove: "Удалить",
    clear: "Очистить всё",
    left: "Осталось нераспределённым",
    over: "Расходы превышают доход на",
    sub: (spent: string, pct: string) => `распределено ${spent} (${pct} дохода)`,
    row: (plan: string, fact: string) => `${fact} из ${plan}`,
    split: "Правило 50/30/20",
    plan: "План",
    fact: "Факт",
    structure: "Структура расходов",
    defaults: [
      ["Аренда или ипотека", "needs", 150000],
      ["Продукты", "needs", 80000],
      ["Коммунальные и связь", "needs", 30000],
      ["Транспорт", "needs", 20000],
      ["Кафе и развлечения", "wants", 40000],
      ["Покупки и подписки", "wants", 25000],
      ["Накопления и инвестиции", "savings", 60000],
    ] as [string, Bucket, number][],
    defIncome: 450000,
  },
  en: {
    income: "Monthly income after tax",
    stored: "Your data stays in this browser only",
    categories: "Spending by category",
    name: "Category",
    amount: "Amount",
    bucket: "Group",
    buckets: { needs: "Needs", wants: "Wants", savings: "Savings" } satisfies Record<Bucket, string>,
    targets: { needs: "50%", wants: "30%", savings: "20%" } satisfies Record<Bucket, string>,
    add: "Add category",
    remove: "Remove",
    clear: "Clear all",
    left: "Left unallocated",
    over: "Spending exceeds income by",
    sub: (spent: string, pct: string) => `allocated ${spent} (${pct} of income)`,
    row: (plan: string, fact: string) => `${fact} of ${plan}`,
    split: "50/30/20 rule",
    plan: "Plan",
    fact: "Actual",
    structure: "Spending structure",
    defaults: [
      ["Rent or mortgage", "needs", 1500],
      ["Groceries", "needs", 600],
      ["Utilities and phone", "needs", 250],
      ["Transport", "needs", 200],
      ["Eating out and fun", "wants", 400],
      ["Shopping and subscriptions", "wants", 250],
      ["Savings and investing", "savings", 800],
    ] as [string, Bucket, number][],
    defIncome: 4500,
  },
} as const;

interface Row {
  name: string;
  amount: string;
  bucket: Bucket;
}
interface BudgetState {
  income: string;
  cur: string;
  rows: Row[];
}

function isState(x: unknown): x is BudgetState {
  if (!x || typeof x !== "object") return false;
  const s = x as BudgetState;
  return typeof s.income === "string" && typeof s.cur === "string" && Array.isArray(s.rows) && s.rows.every((r) => r && typeof r.name === "string" && typeof r.amount === "string" && (BUCKETS as readonly string[]).includes(r.bucket));
}

const TONES = { needs: "accent", wants: "warn", savings: "ok" } as const;

export default function Budget({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const fallback: BudgetState = {
    income: toInput(locale, t.defIncome),
    cur: locale === "ru" ? "KZT" : "USD",
    rows: t.defaults.map(([name, bucket, amount]) => ({ name, bucket, amount: toInput(locale, amount) })),
  };
  const [stored, save] = useStored<BudgetState | null>(`finance:budget:${locale}`, null, (x): x is BudgetState | null => x === null || isState(x));
  const st = stored ?? fallback;
  const cur: Currency = isCurrency(st.cur) ? st.cur : "KZT";
  const money = (v: number) => fmtMoney(locale, v, cur, 0);
  const update = (patch: Partial<BudgetState>) => save({ ...st, ...patch });
  const setRow = (i: number, patch: Partial<Row>) => update({ rows: st.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const income = readNum(locale, st.income, { min: 0 });
  const amounts = st.rows.map((r) => readNum(locale, r.amount, { min: 0 }).value ?? 0);
  const byBucket = Object.fromEntries(BUCKETS.map((b) => [b, st.rows.reduce((s, r, i) => s + (r.bucket === b ? amounts[i] : 0), 0)])) as Record<Bucket, number>;
  const spent = amounts.reduce((s, x) => s + x, 0);
  const plan = income.value !== null ? rule503020(income.value) : null;
  const left = income.value !== null ? income.value - spent : null;

  return (
    <Stack>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-6">
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
          <NumSlider id={`${id}-inc`} locale={locale} label={t.income} hint={t.stored} value={st.income} onChange={(v) => update({ income: v })} suffix={CURRENCY_SYMBOL[cur]} min={0} max={moneyMax(cur, 5_000_000)} scale="log" />
          <OptionsRow>
            <CurrencySelect locale={locale} value={cur} onChange={(c) => update({ cur: c })} />
          </OptionsRow>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-fg-2">{t.categories}</h2>
            <ul className="flex flex-col gap-2">
              {st.rows.map((r, i) => (
                <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 max-[519px]:rounded-[1rem] max-[519px]:bg-surface-2 max-[519px]:p-2 min-[520px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto_auto]">
                  <label className="min-w-0">
                    <span className="sr-only">{`${t.name} ${i + 1}`}</span>
                    <Input value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} autoComplete="off" />
                  </label>
                  <IconButton label={`${t.remove}: ${r.name}`} title={t.remove} icon={<X aria-hidden />} size="sm" className="min-[520px]:order-last" onClick={() => update({ rows: st.rows.filter((_, j) => j !== i) })} />
                  {/* Phones: amount and group on their own line; from 520px all four sit in one row. */}
                  <div className="col-span-2 grid grid-cols-[minmax(4.75rem,1fr)_auto] gap-2 max-[379px]:grid-cols-[minmax(0,1fr)] min-[520px]:contents">
                    <label className="relative min-w-0">
                      <span className="sr-only">{`${t.amount}: ${r.name}`}</span>
                      <Input value={r.amount} onChange={(e) => setRow(i, { amount: e.target.value })} inputMode="decimal" className="tabular pl-2.5 pr-6" autoComplete="off" aria-invalid={!!readNum(locale, r.amount, { min: 0 }).error} />
                      <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-fg-3">
                        {CURRENCY_SYMBOL[cur]}
                      </span>
                    </label>
                    <label className="flex min-w-0">
                      <span className="sr-only">{`${t.bucket}: ${r.name}`}</span>
                      <Select value={r.bucket} onChange={(e) => setRow(i, { bucket: e.target.value as Bucket })}>
                        {BUCKETS.map((b) => (
                          <option key={b} value={b}>
                            {t.buckets[b]}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="tonal" onClick={() => update({ rows: [...st.rows, { name: "", amount: "", bucket: "wants" }] })} disabled={st.rows.length >= 40}>
              <Plus aria-hidden />
              {t.add}
            </Button>
            <Button variant="text" size="sm" onClick={() => save(null)}>
              <Trash2 aria-hidden />
              {t.clear}
            </Button>
          </div>
        </Panel>
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20">
          <ResultMain
            label={left !== null && left < 0 ? t.over : t.left}
            value={left !== null ? money(Math.abs(left)) : "—"}
            sub={income.value ? t.sub(money(spent), fmtPct(locale, (spent / income.value) * 100, 0)) : undefined}
            rows={
              plan
                ? BUCKETS.map((b) => ({
                    label: `${t.buckets[b]} · ${t.targets[b]}`,
                    value: t.row(money(plan[b]), money(byBucket[b])),
                  }))
                : undefined
            }
          />
        </div>
      </div>
      {plan && income.value ? (
        <section>
          <SubHeading>{t.split}</SubHeading>
          <Panel className="grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ul className="flex flex-col gap-4">
              {BUCKETS.map((b) => {
                const share = plan[b] > 0 ? Math.min(1.5, byBucket[b] / plan[b]) : 0;
                return (
                  <li key={b}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-fg">
                        {t.buckets[b]} <span className="text-fg-3">{t.targets[b]}</span>
                      </span>
                      <span className="tabular text-fg-2">{t.row(money(plan[b]), money(byBucket[b]))}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${t.buckets[b]}: ${t.row(money(plan[b]), money(byBucket[b]))}`}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, share * 100)}%`, background: byBucket[b] > plan[b] && b !== "savings" ? "var(--err)" : `var(--${TONES[b]})` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <Donut
              ariaLabel={t.structure}
              format={money}
              parts={BUCKETS.map((b) => ({ label: t.buckets[b], value: byBucket[b], tone: TONES[b] }))}
              size={132}
            />
          </Panel>
        </section>
      ) : null}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Необходимое = 50 % дохода", "Желания = 30 % дохода", "Накопления = 20 % дохода"]}
          notes={[
            "Правило 50/30/20 популяризировала Элизабет Уоррен в книге «All Your Worth»: половина дохода — на обязательные расходы (жильё, еда, транспорт, кредиты), 30 % — на желания, 20 % — на накопления и досрочное погашение долгов.",
            "Это ориентир, а не закон: при высокой аренде доля необходимого может быть больше 50 % — главное, чтобы накопления не опускались до нуля.",
            "Категории и суммы сохраняются только в этом браузере (localStorage) и никуда не отправляются. «Очистить всё» удаляет их.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Needs = 50% of income", "Wants = 30% of income", "Savings = 20% of income"]}
          notes={[
            "The 50/30/20 rule was popularised by Elizabeth Warren in 'All Your Worth': half of your income for needs (housing, food, transport, debt payments), 30% for wants, 20% for savings and extra debt repayment.",
            "It is a guideline: with high rent your needs may exceed 50% — just keep savings above zero.",
            "Categories and amounts are stored only in this browser (localStorage) and never sent anywhere. 'Clear all' deletes them.",
          ]}
        />
      )}
    </Stack>
  );
}
