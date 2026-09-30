"use client";

import { Download } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { BarChart } from "../../calc/kit/charts";
import { toCsv } from "../../calc/kit/csv";
import { CURRENCIES, CURRENCY_SYMBOL, fmtCompact, fmtMoney, type Currency } from "../../calc/kit/fmt";
import { DataTable, InlineSelect, SubHeading } from "../../calc/kit/ui";
import { yearlyTotals, type LoanResult, type LoanRow } from "../engines/loan";

const T = {
  ru: {
    schedule: "График платежей",
    month: "Месяц",
    payment: "Платёж",
    principal: "Основной долг",
    interest: "Проценты",
    extra: "Досрочно",
    balance: "Остаток",
    total: "Итого",
    csv: "CSV",
    csvLong: "Скачать график в CSV",
    byYear: "Погашение по годам",
    byMonth: "Погашение по месяцам",
    currency: "Валюта",
    years: ["год", "года", "лет"],
    months: ["месяц", "месяца", "месяцев"],
  },
  en: {
    schedule: "Payment schedule",
    month: "Month",
    payment: "Payment",
    principal: "Principal",
    interest: "Interest",
    extra: "Extra",
    balance: "Balance",
    total: "Total",
    csv: "CSV",
    csvLong: "Download the schedule as CSV",
    byYear: "Repayment by year",
    byMonth: "Repayment by month",
    currency: "Currency",
    years: ["year", "years"],
    months: ["month", "months"],
  },
} as const;

/** "5 лет 3 месяца" / "5 years 3 months". */
export function termText(locale: Locale, months: number): string {
  const t = T[locale];
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} ${plural(locale, y, t.years)}`);
  if (m || !y) parts.push(`${m} ${plural(locale, m, t.months)}`);
  return parts.join(" ");
}

/** Currency label picker (label only — no exchange rates). */
export function CurrencySelect({ id, locale, value, onChange }: { id: string; locale: Locale; value: Currency; onChange: (c: Currency) => void }) {
  return <InlineSelect id={id} label={T[locale].currency} value={value} onChange={onChange} options={CURRENCIES.map((c) => ({ value: c, label: CURRENCY_SYMBOL[c] }))} />;
}

export interface ExtraColumn {
  label: string;
  values: number[];
}

/** Quiet chart + full schedule table + CSV export, shown below the calculator. */
export function ScheduleView({
  locale,
  result,
  cur,
  extraCols = [],
  filename,
}: {
  locale: Locale;
  result: LoanResult;
  cur: Currency;
  /** Additional per-month columns (e.g. insurance), same length as result.rows. */
  extraCols?: ExtraColumn[];
  filename: string;
}) {
  const t = T[locale];
  const rows = result.rows;
  const money = (v: number) => fmtMoney(locale, v, cur);
  const hasExtra = rows.some((r) => r.extra > 0);
  const byYear = rows.length > 24;
  const yearly = yearlyTotals(rows);
  const chartLabels = byYear ? yearly.map((y) => String(y.year)) : rows.map((r) => String(r.month));
  const chartPrincipal = byYear ? yearly.map((y) => y.principal) : rows.map((r) => r.principal + r.extra);
  const chartInterest = byYear ? yearly.map((y) => y.interest) : rows.map((r) => r.interest);

  const head = [t.month, t.payment, t.principal, t.interest, ...(hasExtra ? [t.extra] : []), ...extraCols.map((c) => c.label), t.balance];
  const cell = (r: LoanRow, i: number) => [
    String(r.month),
    money(r.payment),
    money(r.principal),
    money(r.interest),
    ...(hasExtra ? [r.extra ? money(r.extra) : "—"] : []),
    ...extraCols.map((c) => money(c.values[i] ?? 0)),
    money(r.balance),
  ];
  const sumCol = (vals: number[]) => Math.round(vals.reduce((s, v) => s + Math.round(v * 100), 0)) / 100;
  const foot = [
    t.total,
    money(sumCol(rows.map((r) => r.payment))),
    money(sumCol(rows.map((r) => r.principal))),
    money(result.totalInterest),
    ...(hasExtra ? [money(result.totalExtra)] : []),
    ...extraCols.map((c) => money(sumCol(c.values))),
    "",
  ];

  function exportCsv() {
    const sym = CURRENCY_SYMBOL[cur];
    const csvHead = [t.month, `${t.payment}, ${sym}`, `${t.principal}, ${sym}`, `${t.interest}, ${sym}`, `${t.extra}, ${sym}`, ...extraCols.map((c) => `${c.label}, ${sym}`), `${t.balance}, ${sym}`];
    const body = rows.map((r, i) => [r.month, r.payment, r.principal, r.interest, r.extra, ...extraCols.map((c) => c.values[i] ?? 0), r.balance]);
    downloadText(toCsv(locale, [csvHead, ...body]), filename, "text/csv;charset=utf-8");
  }

  return (
    <>
      <section>
        <SubHeading>{byYear ? t.byYear : t.byMonth}</SubHeading>
        <BarChart
          ariaLabel={byYear ? t.byYear : t.byMonth}
          labels={chartLabels}
          series={[
            { label: t.principal, values: chartPrincipal, tone: "accent" },
            { label: t.interest, values: chartInterest, tone: "warn" },
          ]}
          yFormat={(v) => fmtCompact(locale, v)}
        />
      </section>
      <section>
        <SubHeading
          aside={
            <Button variant="ghost" size="sm" onClick={exportCsv} title={t.csvLong} aria-label={t.csvLong}>
              <Download aria-hidden />
              {t.csv}
            </Button>
          }
        >
          {t.schedule}
        </SubHeading>
        <DataTable caption={t.schedule} head={head} rows={rows.map(cell)} foot={foot} maxHeight={440} />
      </section>
    </>
  );
}
