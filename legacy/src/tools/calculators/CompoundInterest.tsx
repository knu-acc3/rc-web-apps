"use client";

import { useState } from "react";
import { Calculator, DownloadSimple, Warning } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { downloadBlob } from "@/src/utils/exportHelpers";

type ContributionFrequency = 1 | 4 | 12;
type CompoundFrequency = 0 | 1 | 2 | 4 | 12 | 365;

interface YearRow {
  year: number;
  balance: number;
  contributed: number;
  growth: number;
  realBalance: number;
}

interface CalculationResult {
  finalBalance: number;
  totalContributed: number;
  totalGrowth: number;
  realFinalBalance: number;
  rows: YearRow[];
}

interface CalculationInput {
  principal: number;
  annualRate: number;
  years: number;
  contribution: number;
  contributionFrequency: ContributionFrequency;
  compoundFrequency: CompoundFrequency;
  inflation: number;
}

const CONTRIBUTION_FREQUENCIES: Array<{
  value: ContributionFrequency;
  ru: string;
  en: string;
}> = [
  { value: 12, ru: "Ежемесячно", en: "Monthly" },
  { value: 4, ru: "Ежеквартально", en: "Quarterly" },
  { value: 1, ru: "Ежегодно", en: "Annually" },
];

const COMPOUND_FREQUENCIES: Array<{
  value: CompoundFrequency;
  ru: string;
  en: string;
}> = [
  { value: 1, ru: "Ежегодно", en: "Annually" },
  { value: 2, ru: "Раз в полгода", en: "Semi-annually" },
  { value: 4, ru: "Ежеквартально", en: "Quarterly" },
  { value: 12, ru: "Ежемесячно", en: "Monthly" },
  { value: 365, ru: "Ежедневно", en: "Daily" },
  { value: 0, ru: "Непрерывно", en: "Continuously" },
];

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateCompound(input: CalculationInput): CalculationResult | null {
  const rate = input.annualRate / 100;
  const periodsPerYear =
    input.contribution > 0 ? input.contributionFrequency : 1;
  const growthFactor =
    input.compoundFrequency === 0
      ? Math.exp(rate / periodsPerYear)
      : (1 + rate / input.compoundFrequency) **
        (input.compoundFrequency / periodsPerYear);

  let balance = input.principal;
  let totalContributed = input.principal;
  const rows: YearRow[] = [];

  for (let year = 1; year <= input.years; year += 1) {
    for (let period = 1; period <= periodsPerYear; period += 1) {
      balance *= growthFactor;

      if (input.contribution > 0) {
        balance += input.contribution;
        totalContributed += input.contribution;
      }

      if (!Number.isFinite(balance)) return null;
    }

    const realBalance =
      input.inflation > 0
        ? balance / (1 + input.inflation / 100) ** year
        : balance;

    rows.push({
      year,
      balance,
      contributed: totalContributed,
      growth: balance - totalContributed,
      realBalance,
    });
  }

  return {
    finalBalance: balance,
    totalContributed,
    totalGrowth: balance - totalContributed,
    realFinalBalance: rows.at(-1)?.realBalance ?? balance,
    rows,
  };
}

function downloadTable(result: CalculationResult, isEn: boolean) {
  const header = isEn
    ? [
        "Year",
        "Balance",
        "Contributed",
        "Calculated growth",
        "Inflation-adjusted balance",
      ]
    : ["Год", "Капитал", "Внесено", "Расчётный прирост", "С учётом инфляции"];
  const lines = [
    header.join(","),
    ...result.rows.map((row) =>
      [row.year, row.balance, row.contributed, row.growth, row.realBalance]
        .map((value) => (typeof value === "number" ? value.toFixed(2) : value))
        .join(","),
    ),
  ];
  downloadBlob(
    new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" }),
    "compound-interest.csv",
  );
}

export default function CompoundInterest() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [years, setYears] = useState("");
  const [contribution, setContribution] = useState("");
  const [contributionFrequency, setContributionFrequency] =
    useState<ContributionFrequency>(12);
  const [compoundFrequency, setCompoundFrequency] =
    useState<CompoundFrequency>(12);
  const [inflation, setInflation] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");

  const clearResult = () => {
    setResult(null);
    setError("");
  };

  const calculate = () => {
    const parsedPrincipal = parseNumber(principal);
    const parsedRate = parseNumber(annualRate);
    const parsedYears = parseNumber(years);
    const parsedContribution = contribution.trim()
      ? parseNumber(contribution)
      : 0;
    const parsedInflation = inflation.trim() ? parseNumber(inflation) : 0;

    if (
      parsedPrincipal === null ||
      parsedPrincipal < 0 ||
      parsedPrincipal > 1e15
    ) {
      setError(
        isEn
          ? "Enter a starting amount from 0 to 1,000,000,000,000,000."
          : "Введите начальную сумму от 0 до 1 000 000 000 000 000.",
      );
      setResult(null);
      return;
    }
    if (parsedRate === null || parsedRate <= -100 || parsedRate > 1_000) {
      setError(
        isEn
          ? "Enter an annual rate greater than −100% and no higher than 1,000%."
          : "Введите годовую ставку больше −100% и не выше 1 000%.",
      );
      setResult(null);
      return;
    }
    if (
      parsedYears === null ||
      !Number.isInteger(parsedYears) ||
      parsedYears < 1 ||
      parsedYears > 100
    ) {
      setError(
        isEn
          ? "Enter a whole term from 1 to 100 years."
          : "Введите целый срок от 1 до 100 лет.",
      );
      setResult(null);
      return;
    }
    if (
      parsedContribution === null ||
      parsedContribution < 0 ||
      parsedContribution > 1e15
    ) {
      setError(
        isEn
          ? "Regular contribution must be a non-negative number."
          : "Регулярный взнос должен быть неотрицательным числом.",
      );
      setResult(null);
      return;
    }
    if (
      parsedInflation === null ||
      parsedInflation < 0 ||
      parsedInflation > 100
    ) {
      setError(
        isEn
          ? "Inflation must be from 0% to 100%."
          : "Инфляция должна быть от 0% до 100%.",
      );
      setResult(null);
      return;
    }

    const nextResult = calculateCompound({
      principal: parsedPrincipal,
      annualRate: parsedRate,
      years: parsedYears,
      contribution: parsedContribution,
      contributionFrequency,
      compoundFrequency,
      inflation: parsedInflation,
    });

    if (!nextResult) {
      setError(
        isEn
          ? "These assumptions produce a number too large to calculate safely."
          : "При таких параметрах результат слишком велик для безопасного расчёта.",
      );
      setResult(null);
      return;
    }

    setError("");
    setResult(nextResult);
  };

  const formatAmount = (value: number) =>
    value.toLocaleString(isEn ? "en-US" : "ru-RU", {
      maximumFractionDigits: 2,
    });

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="min-w-0">
            <Label
              htmlFor="compound-principal"
              className="text-sm font-semibold"
            >
              {isEn ? "Starting amount" : "Начальная сумма"}
            </Label>
            <Input
              id="compound-principal"
              value={principal}
              inputMode="decimal"
              autoComplete="off"
              onChange={(event) => {
                setPrincipal(event.target.value);
                clearResult();
              }}
              placeholder="0"
              className="mt-2 h-12 text-base tabular-nums"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="compound-rate" className="text-sm font-semibold">
              {isEn ? "Annual rate, %" : "Годовая ставка, %"}
            </Label>
            <Input
              id="compound-rate"
              value={annualRate}
              inputMode="decimal"
              autoComplete="off"
              onChange={(event) => {
                setAnnualRate(event.target.value);
                clearResult();
              }}
              placeholder="0"
              className="mt-2 h-12 text-base tabular-nums"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="compound-years" className="text-sm font-semibold">
              {isEn ? "Term, years" : "Срок, лет"}
            </Label>
            <Input
              id="compound-years"
              type="number"
              min={1}
              max={100}
              step={1}
              value={years}
              onChange={(event) => {
                setYears(event.target.value);
                clearResult();
              }}
              placeholder="1"
              className="mt-2 h-12 text-base tabular-nums"
            />
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          >
            <Warning size={19} weight="fill" className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!principal.trim() || !annualRate.trim() || !years.trim()}
          onClick={calculate}
          leadingIcon={<Calculator size={20} weight="bold" />}
        >
          {isEn ? "Calculate growth" : "Рассчитать капитал"}
        </ToolPrimaryAction>
      </section>

      {result ? (
        <section
          aria-live="polite"
          className="rounded-[var(--radius-lg)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)] p-4 sm:p-5"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            {isEn ? "Estimated final capital" : "Расчётный итоговый капитал"}
          </p>
          <p className="mt-1 break-words text-3xl font-extrabold tabular-nums text-[var(--color-text)]">
            {formatAmount(result.finalBalance)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn ? "Calculated growth" : "Расчётный прирост"}
              </p>
              <p className="mt-1 break-words text-lg font-bold tabular-nums">
                {formatAmount(result.totalGrowth)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn ? "Total contributed" : "Всего внесено"}
              </p>
              <p className="mt-1 break-words text-lg font-bold tabular-nums">
                {formatAmount(result.totalContributed)}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "Advanced settings" : "Расширенные настройки"}
        description={
          isEn
            ? "Regular contributions, compounding, inflation and yearly table"
            : "Регулярные взносы, капитализация, инфляция и таблица по годам"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="compound-contribution">
              {isEn ? "Regular contribution" : "Регулярный взнос"}
            </Label>
            <Input
              id="compound-contribution"
              value={contribution}
              inputMode="decimal"
              onChange={(event) => {
                setContribution(event.target.value);
                clearResult();
              }}
              placeholder="0"
              className="mt-1.5 h-11 tabular-nums"
            />
          </div>
          <div>
            <Label htmlFor="compound-contribution-frequency">
              {isEn ? "Contribution frequency" : "Частота взносов"}
            </Label>
            <select
              id="compound-contribution-frequency"
              value={contributionFrequency}
              onChange={(event) => {
                setContributionFrequency(
                  Number(event.target.value) as ContributionFrequency,
                );
                clearResult();
              }}
              className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
            >
              {CONTRIBUTION_FREQUENCIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {isEn ? option.en : option.ru}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="compound-frequency">
              {isEn ? "Interest compounding" : "Капитализация процентов"}
            </Label>
            <select
              id="compound-frequency"
              value={compoundFrequency}
              onChange={(event) => {
                setCompoundFrequency(
                  Number(event.target.value) as CompoundFrequency,
                );
                clearResult();
              }}
              className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
            >
              {COMPOUND_FREQUENCIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {isEn ? option.en : option.ru}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="compound-inflation">
              {isEn
                ? "Annual inflation, % — optional"
                : "Годовая инфляция, % — необязательно"}
            </Label>
            <Input
              id="compound-inflation"
              value={inflation}
              inputMode="decimal"
              onChange={(event) => {
                setInflation(event.target.value);
                clearResult();
              }}
              placeholder="0"
              className="mt-1.5 h-11 tabular-nums"
            />
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Contributions are added at the end of each selected period; compounding is converted to its equivalent rate for that period. Inflation changes only the purchasing-power estimate, not the nominal balance."
            : "Взносы добавляются в конце каждого выбранного периода; капитализация переводится в эквивалентную ставку этого периода. Инфляция влияет только на оценку покупательной способности, а не на номинальный капитал."}
        </p>

        {result ? (
          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">
                  {isEn ? "Yearly projection" : "Расчёт по годам"}
                </h3>
                {inflation.trim() ? (
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {isEn
                      ? `Final purchasing-power estimate: ${formatAmount(result.realFinalBalance)}`
                      : `Итог с учётом инфляции: ${formatAmount(result.realFinalBalance)}`}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={() => downloadTable(result, isEn)}
              >
                <DownloadSimple size={18} />
                {isEn ? "Download CSV" : "Скачать CSV"}
              </Button>
            </div>

            <div className="mt-3 max-w-full overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <table className="min-w-[620px] w-full text-sm">
                <thead className="bg-[var(--color-surface-muted)] text-left text-xs text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-3 py-2.5">{isEn ? "Year" : "Год"}</th>
                    <th className="px-3 py-2.5 text-right">
                      {isEn ? "Balance" : "Капитал"}
                    </th>
                    <th className="px-3 py-2.5 text-right">
                      {isEn ? "Contributed" : "Внесено"}
                    </th>
                    <th className="px-3 py-2.5 text-right">
                      {isEn ? "Growth" : "Прирост"}
                    </th>
                    <th className="px-3 py-2.5 text-right">
                      {isEn ? "Real value" : "С инфляцией"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {result.rows.map((row) => (
                    <tr key={row.year}>
                      <td className="px-3 py-2.5 font-semibold">{row.year}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatAmount(row.balance)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatAmount(row.contributed)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatAmount(row.growth)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatAmount(row.realBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </AdvancedSettings>

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        {isEn
          ? "Educational mathematical estimate based only on the assumptions you enter. It does not guarantee returns and is not investment advice."
          : "Учебная математическая оценка только по введённым вами допущениям. Она не гарантирует доходность и не является инвестиционной рекомендацией."}
      </p>
    </div>
  );
}
