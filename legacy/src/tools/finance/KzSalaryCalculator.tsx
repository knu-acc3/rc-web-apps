"use client";

import { useState } from "react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const KZ_SALARY_2026 = Object.freeze({
  year: 2026,
  mrp: 4_325,
  minimumWage: 85_000,
  basicDeductionMrpPerMonth: 30,
  opvRate: 0.1,
  opvBaseCapMinimumWages: 50,
  vosmsRate: 0.02,
  vosmsBaseCapMinimumWages: 20,
  annualIitThresholdMrp: 8_500,
  lowerIitRate: 0.1,
  upperIitRate: 0.15,
  sourcesChecked: "2026-07-11",
});

export interface KzSalaryOptions {
  applyBasicDeduction?: boolean;
  opvExempt?: boolean;
  vosmsExempt?: boolean;
  additionalMonthlyTaxDeduction?: number;
}

export interface KzSalaryResult {
  gross: number;
  opv: number;
  vosms: number;
  basicDeduction: number;
  additionalDeduction: number;
  monthlyTaxableIncome: number;
  annualizedTaxableIncome: number;
  progressiveThreshold: number;
  mayReachProgressiveRate: boolean;
  estimatedMonthlyIit: number;
  estimatedNet: number;
  oosms: number;
  so: number;
  opvr: number;
  employerTotalCost: number;
}

const OFFICIAL_SOURCES = [
  {
    key: "indicators",
    url: "https://www.gov.kz/article/17157?lang=ru",
  },
  {
    key: "opv",
    url: "https://www.gov.kz/situations/332/861?lang=ru",
  },
  {
    key: "vosms",
    url: "https://www.gov.kz/memleket/entities/minfin/press/article/details/235407?lang=ru",
  },
  {
    key: "deduction",
    url: "https://astana.kgd.gov.kz/ru/news/primenenie-nalogovyh-vychetov-v-2026-godu-2-163796",
  },
  {
    key: "iitFormula",
    url: "https://portal.kgd.gov.kz/ru/pages/calculators/calculatoripn/",
  },
  {
    key: "iitRates",
    url: "https://www.gov.kz/memleket/entities/kgd-vko/press/article/details/236115",
  },
] as const;

function roundTenge(value: number) {
  return Math.round(value);
}

export function calculateKzSalary2026(
  grossInput: number,
  {
    applyBasicDeduction = true,
    opvExempt = false,
    vosmsExempt = false,
    additionalMonthlyTaxDeduction = 0,
  }: KzSalaryOptions = {},
): KzSalaryResult {
  const gross = roundTenge(grossInput);
  const opvBaseCap =
    KZ_SALARY_2026.minimumWage * KZ_SALARY_2026.opvBaseCapMinimumWages;
  const vosmsBaseCap =
    KZ_SALARY_2026.minimumWage * KZ_SALARY_2026.vosmsBaseCapMinimumWages;
  const opv = opvExempt
    ? 0
    : roundTenge(Math.min(gross, opvBaseCap) * KZ_SALARY_2026.opvRate);
  const vosms = vosmsExempt
    ? 0
    : roundTenge(Math.min(gross, vosmsBaseCap) * KZ_SALARY_2026.vosmsRate);
  const basicDeduction = applyBasicDeduction
    ? KZ_SALARY_2026.mrp * KZ_SALARY_2026.basicDeductionMrpPerMonth
    : 0;
  const additionalDeduction = Math.max(
    0,
    roundTenge(additionalMonthlyTaxDeduction),
  );
  const monthlyTaxableIncome = Math.max(
    0,
    gross - opv - vosms - basicDeduction - additionalDeduction,
  );
  const annualizedTaxableIncome = monthlyTaxableIncome * 12;
  const progressiveThreshold =
    KZ_SALARY_2026.mrp * KZ_SALARY_2026.annualIitThresholdMrp;
  const mayReachProgressiveRate =
    annualizedTaxableIncome > progressiveThreshold;

  const monthlyThreshold =
    (KZ_SALARY_2026.mrp * KZ_SALARY_2026.annualIitThresholdMrp) / 12;
  let estimatedMonthlyIit: number;

  if (monthlyTaxableIncome <= monthlyThreshold) {
    estimatedMonthlyIit = roundTenge(
      monthlyTaxableIncome * KZ_SALARY_2026.lowerIitRate,
    );
  } else {
    const baseTax = monthlyThreshold * KZ_SALARY_2026.lowerIitRate;
    const excessTax =
      (monthlyTaxableIncome - monthlyThreshold) * KZ_SALARY_2026.upperIitRate;
    estimatedMonthlyIit = roundTenge(baseTax + excessTax);
  }

  const estimatedNet = gross - opv - vosms - estimatedMonthlyIit;

  const oosms = roundTenge(Math.min(gross, vosmsBaseCap) * 0.03);
  const so = roundTenge(Math.min(Math.max(0, gross - opv), opvBaseCap) * 0.035);
  const opvr = roundTenge(gross * 0.015);
  const employerTotalCost = gross + oosms + so + opvr;

  return {
    gross,
    opv,
    vosms,
    basicDeduction,
    additionalDeduction,
    monthlyTaxableIncome,
    annualizedTaxableIncome,
    progressiveThreshold,
    mayReachProgressiveRate,
    estimatedMonthlyIit,
    estimatedNet,
    oosms,
    so,
    opvr,
    employerTotalCost,
  };
}

function formatTenge(value: number, isEn: boolean) {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function KzSalaryCalculator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [gross, setGross] = useState("");
  const [applyBasicDeduction, setApplyBasicDeduction] = useState(true);
  const [opvExempt, setOpvExempt] = useState(false);
  const [vosmsExempt, setVosmsExempt] = useState(false);
  const [additionalDeduction, setAdditionalDeduction] = useState("0");
  const [result, setResult] = useState<KzSalaryResult | null>(null);
  const [error, setError] = useState("");

  const invalidate = () => {
    setResult(null);
    setError("");
  };

  const calculate = () => {
    const parsedGross = Number(gross);
    const parsedAdditionalDeduction = Number(additionalDeduction);

    if (
      !Number.isInteger(parsedGross) ||
      parsedGross <= 0 ||
      parsedGross > 1_000_000_000
    ) {
      setResult(null);
      setError(
        isEn
          ? "Enter a whole monthly gross salary from 1 to 1,000,000,000 tenge."
          : "Введите целую начисленную зарплату от 1 до 1 000 000 000 тенге.",
      );
      return;
    }
    if (
      !Number.isInteger(parsedAdditionalDeduction) ||
      parsedAdditionalDeduction < 0 ||
      parsedAdditionalDeduction > 1_000_000_000
    ) {
      setResult(null);
      setError(
        isEn
          ? "Confirmed additional deduction must be a non-negative whole amount."
          : "Подтверждённый дополнительный вычет должен быть целой неотрицательной суммой.",
      );
      return;
    }

    setResult(
      calculateKzSalary2026(parsedGross, {
        applyBasicDeduction,
        opvExempt,
        vosmsExempt,
        additionalMonthlyTaxDeduction: parsedAdditionalDeduction,
      }),
    );
    setError("");
  };

  const sourceLabels: Record<
    (typeof OFFICIAL_SOURCES)[number]["key"],
    [string, string]
  > = {
    indicators: ["Gov.kz: МРП и МЗП 2026", "Gov.kz: 2026 MRP and minimum wage"],
    opv: ["Gov.kz: ставка и предел ОПВ", "Gov.kz: OPV rate and cap"],
    vosms: [
      "ФСМС: взносы ОСМС 2026",
      "Social Health Insurance Fund: 2026 MSHI contributions",
    ],
    deduction: [
      "КГД: базовый вычет 30 МРП",
      "State Revenue Committee: 30 MRP basic deduction",
    ],
    iitFormula: [
      "КГД: официальный расчёт ИПН",
      "State Revenue Committee: official IIT calculator",
    ],
    iitRates: [
      "КГД: ставки ИПН 10% / 15%",
      "State Revenue Committee: 10% / 15% IIT rates",
    ],
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="kz-salary-gross">
          {isEn ? "Monthly gross salary, ₸" : "Начисленная зарплата в месяц, ₸"}
        </Label>
        <Input
          id="kz-salary-gross"
          type="number"
          min="1"
          max="1000000000"
          step="1"
          inputMode="numeric"
          value={gross}
          onChange={(event) => {
            setGross(event.target.value);
            invalidate();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") calculate();
          }}
          placeholder={
            isEn ? "Enter gross salary" : "Введите начисленную зарплату"
          }
          className="mt-1.5 font-mono text-base"
        />

        <ToolPrimaryAction type="button" className="mt-4" onClick={calculate}>
          {isEn ? "Estimate take-home pay" : "Рассчитать зарплату на руки"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the amount" : "Проверьте сумму"}
            description={error}
            className="mt-5"
          />
        ) : result ? (
          <ToolResult
            status="success"
            title={isEn ? "Estimated take-home pay" : "Оценка зарплаты на руки"}
            description={
              isEn
                ? "Standard resident employee · 2026 assumptions"
                : "Стандартный работник-резидент · допущения 2026 года"
            }
            className="mt-5"
          >
            <output className="block overflow-x-auto whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-4 font-mono text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              {formatTenge(result.estimatedNet, isEn)}
            </output>

            <div className="mt-3 divide-y divide-[var(--color-border-subtle)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 text-sm">
              {[
                [isEn ? "Gross salary" : "Начислено", result.gross, false],
                [isEn ? "Employee OPV" : "ОПВ", result.opv, true],
                [isEn ? "Employee MSHI" : "Взнос ОСМС", result.vosms, true],
                [
                  isEn ? "Estimated IIT" : "Расчётный ИПН",
                  result.estimatedMonthlyIit,
                  true,
                ],
              ].map(([label, amount, subtract]) => (
                <div
                  key={label as string}
                  className="flex min-h-11 items-center justify-between gap-3 py-2"
                >
                  <span className="text-[var(--color-text-muted)]">
                    {label as string}
                  </span>
                  <strong className="font-mono text-[var(--color-text)]">
                    {subtract ? "−" : ""}
                    {formatTenge(amount as number, isEn)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {isEn ? "Employer contributions (payroll)" : "Отчисления работодателя (ФОТ)"}
              </h4>
              <div className="mt-2 divide-y divide-[var(--color-border-subtle)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 text-sm">
                {[
                  [isEn ? "Social Health Insurance (MSHI) 3%" : "ООСМС 3%", result.oosms],
                  [isEn ? "Social Contributions (SO) 3.5%" : "СО 3.5%", result.so],
                  [isEn ? "Employer Pension (OPVR) 1.5%" : "ОПВР 1.5%", result.opvr],
                  [isEn ? "Total employer cost" : "Всего расходов на сотрудника", result.employerTotalCost],
                ].map(([label, amount]) => (
                  <div
                    key={label as string}
                    className="flex min-h-11 items-center justify-between gap-3 py-2"
                  >
                    <span className="text-[var(--color-text-muted)]">
                      {label as string}
                    </span>
                    <strong className="font-mono text-[var(--color-text)]">
                      {formatTenge(amount as number, isEn)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
              <p className="font-mono">
                {isEn
                  ? "Net = Gross − OPV − MSHI − IIT"
                  : "На руки = начислено − ОПВ − ОСМС − ИПН"}
              </p>
              <p>
                {isEn
                  ? `Monthly taxable income used for the estimate: ${formatTenge(result.monthlyTaxableIncome, isEn)}.`
                  : `Месячный облагаемый доход для оценки: ${formatTenge(result.monthlyTaxableIncome, isEn)}.`}
              </p>
              <p>
                {isEn
                  ? result.basicDeduction > 0
                    ? `The 30 MRP basic deduction is applied: ${formatTenge(result.basicDeduction, isEn)}.`
                    : "The 30 MRP basic deduction is not applied."
                  : result.basicDeduction > 0
                    ? `Базовый вычет 30 МРП применён: ${formatTenge(result.basicDeduction, isEn)}.`
                    : "Базовый вычет 30 МРП не применён."}
              </p>
              {result.mayReachProgressiveRate ? (
                <p className="font-semibold text-[var(--color-warning)]">
                  {isEn
                    ? `Annualized taxable income may exceed the ${formatTenge(result.progressiveThreshold, isEn)} threshold. The 15% rate on the annual excess is not calculated without year-to-date and other income.`
                    : `Годовой облагаемый доход может превысить порог ${formatTenge(result.progressiveThreshold, isEn)}. Ставка 15% на годовое превышение не рассчитывается без дохода с начала года и других доходов.`}
                </p>
              ) : null}
              <p>
                {isEn
                  ? "Estimate only at the standard 10% IIT rate, not legal, tax or payroll advice. Actual withholding depends on year-to-date and other income, exemptions, documents and payroll rounding. Employer costs are not included."
                  : "Это оценка по стандартной ставке ИПН 10%, а не юридическая, налоговая или зарплатная консультация. Фактическое удержание зависит от дохода с начала года, других доходов, льгот, документов и округления. Расходы работодателя не включены."}
              </p>
            </div>
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The 2026 take-home estimate will appear here."
                : "Здесь появится оценка зарплаты на руки за 2026 год."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Employee assumptions" : "Допущения по работнику"}
          description={
            isEn
              ? "Deductions, exemptions and official 2026 sources"
              : "Вычеты, освобождения и официальные источники 2026 года"
          }
        >
          <div className="grid gap-1 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">
              <input
                type="checkbox"
                checked={applyBasicDeduction}
                onChange={(event) => {
                  setApplyBasicDeduction(event.target.checked);
                  invalidate();
                }}
                className="h-5 w-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span>
                {isEn
                  ? "Apply 30 MRP basic deduction (application filed)"
                  : "Применить вычет 30 МРП (заявление подано)"}
              </span>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">
              <input
                type="checkbox"
                checked={opvExempt}
                onChange={(event) => {
                  setOpvExempt(event.target.checked);
                  invalidate();
                }}
                className="h-5 w-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span>
                {isEn
                  ? "Employee is exempt from OPV"
                  : "Работник освобождён от ОПВ"}
              </span>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">
              <input
                type="checkbox"
                checked={vosmsExempt}
                onChange={(event) => {
                  setVosmsExempt(event.target.checked);
                  invalidate();
                }}
                className="h-5 w-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span>
                {isEn
                  ? "Employee is exempt from MSHI contributions"
                  : "Работник освобождён от взносов ОСМС"}
              </span>
            </label>
            <div className="px-2 py-2">
              <Label htmlFor="kz-salary-additional-deduction">
                {isEn
                  ? "Confirmed additional monthly deduction, ₸"
                  : "Подтверждённый доп. вычет в месяц, ₸"}
              </Label>
              <Input
                id="kz-salary-additional-deduction"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={additionalDeduction}
                onChange={(event) => {
                  setAdditionalDeduction(event.target.value);
                  invalidate();
                }}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4 text-xs leading-5 text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "2026 constants: MRP 4,325 ₸; minimum wage 85,000 ₸; OPV 10% with a 50 minimum-wage base cap; employee MSHI 2% with a 20 minimum-wage base cap; basic deduction 30 MRP per month."
                : "Показатели 2026 года: МРП 4 325 ₸; МЗП 85 000 ₸; ОПВ 10% с пределом базы 50 МЗП; взнос ОСМС 2% с пределом базы 20 МЗП; базовый вычет 30 МРП в месяц."}
            </p>
            <p className="mt-2">
              {isEn
                ? "The estimate applies the standard 10% IIT formula and rounds to the nearest tenge. If total annual taxable income exceeds 8,500 MRP, 15% applies to the excess; this requires year-to-date and other income, so the excess is not guessed here. The basic deduction is assumed only after an application at this employer."
                : "Оценка применяет стандартную формулу ИПН 10% и округляет до тенге. Если общий годовой облагаемый доход превышает 8 500 МРП, к превышению применяется 15%; для этого нужны доход с начала года и другие доходы, поэтому превышение здесь не угадывается. Базовый вычет предполагается только после заявления у этого работодателя."}
            </p>
            <p className="mt-2 font-semibold text-[var(--color-text)]">
              {isEn
                ? "Official sources checked 11 July 2026"
                : "Официальные источники проверены 11 июля 2026 года"}
            </p>
            <div className="mt-1 grid sm:grid-cols-2">
              {OFFICIAL_SOURCES.map((source) => (
                <a
                  key={source.key}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-2 py-2 font-medium text-[var(--color-primary)] underline-offset-4 hover:bg-[var(--color-surface-muted)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
                >
                  {sourceLabels[source.key][isEn ? 1 : 0]}
                </a>
              ))}
            </div>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
