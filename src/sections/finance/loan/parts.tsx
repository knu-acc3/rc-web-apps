"use client";

import { Download } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Panel } from "@/ui/panel";
import { BarChart, Donut } from "../../calc/kit/charts";
import { toCsv } from "../../calc/kit/csv";
import { CURRENCY_SYMBOL, fmtCompact, fmtMoney, type Currency } from "../../calc/kit/fmt";
import { DataTable } from "../../calc/kit/ui";
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
    csv: "Скачать CSV",
    byYear: "Погашение по годам",
    byMonth: "Погашение по месяцам",
    year: "Год",
    structure: "Структура выплат",
    loan: "Сумма кредита",
    overpay: "Переплата",
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
    csv: "Download CSV",
    byYear: "Repayment by year",
    byMonth: "Repayment by month",
    year: "Year",
    structure: "What you pay",
    loan: "Loan amount",
    overpay: "Interest",
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

export interface ExtraColumn {
  label: string;
  values: number[];
}

/** Donut: principal vs interest (vs extra lines such as insurance). */
export function LoanDonut({ locale, principal, interest, extra, cur }: { locale: Locale; principal: number; interest: number; extra?: { label: string; value: number }[]; cur: Currency }) {
  const t = T[locale];
  return (
    <Panel className="p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-fg">{t.structure}</h2>
      <Donut
        ariaLabel={t.structure}
        format={(v) => fmtMoney(locale, v, cur, 0)}
        parts={[
          { label: t.loan, value: principal, tone: "accent" },
          { label: t.overpay, value: interest, tone: "warn" },
          ...(extra ?? []).map((e) => ({ label: e.label, value: e.value, tone: "muted" as const })),
        ]}
      />
    </Panel>
  );
}

/** Chart + full schedule table + CSV export. */
export function ScheduleView({
  locale,
  result,
  cur,
  extraCols = [],
  filename,
  children,
}: {
  locale: Locale;
  result: LoanResult;
  cur: Currency;
  /** Additional per-month columns (e.g. insurance), same length as result.rows. */
  extraCols?: ExtraColumn[];
  filename: string;
  children?: ReactNode;
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
      <Panel className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-fg">{byYear ? t.byYear : t.byMonth}</h2>
        <BarChart
          ariaLabel={byYear ? t.byYear : t.byMonth}
          labels={chartLabels}
          series={[
            { label: t.principal, values: chartPrincipal, tone: "accent" },
            { label: t.interest, values: chartInterest, tone: "warn" },
          ]}
          yFormat={(v) => fmtCompact(locale, v)}
        />
      </Panel>
      {children}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-fg">{t.schedule}</h2>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download aria-hidden />
            {t.csv}
          </Button>
        </div>
        <DataTable caption={t.schedule} head={head} rows={rows.map(cell)} foot={foot} maxHeight={480} />
      </section>
    </>
  );
}
