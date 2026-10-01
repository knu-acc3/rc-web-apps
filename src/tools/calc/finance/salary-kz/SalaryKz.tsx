"use client";

import { useId } from "react";
import { Checkbox } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { fmtPct } from "../../shared/fmt";
import { field, toInput } from "../../shared/num";
import { CalcGrid, DataTable, Disclaimer, Explain, InlineSelect, NumField, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { grossFromNet, salaryKz, SALARY_YEARS, type SalaryYear } from "../lib/salary-kz";
import { constantRows, employeeLines, employerLines, tg } from "./content";

const T = {
  ru: {
    dir: "Направление расчёта",
    g2n: "Из оклада на руки",
    n2g: "Из «на руки» в оклад",
    gross: "Зарплата до вычетов (оклад)",
    net: "Зарплата на руки",
    year: "Год",
    deduction: "Стандартный вычет (основное место работы)",
    netLabel: "На руки",
    grossLabel: "Нужно начислить (оклад)",
    subNet: (w: string, p: string) => `удержано ${w} (${p} оклада)`,
    subGross: (n: string) => `на руки выйдет ${n}`,
    employerTotal: "Расходы работодателя",
    enter: "Введите сумму зарплаты",
    employee: "Удержания из зарплаты",
    employer: "Платит работодатель сверху",
    item: "Статья",
    how: "Как считается",
    amount: "Сумма",
    totalWithheld: "Всего удержано",
    totalEmployer: "Всего налогов и взносов работодателя",
    cost: "Полная стоимость сотрудника",
    burden: "Все налоги и взносы",
    constants: (y: number) => `Константы ${y} года`,
    param: "Параметр",
    value: "Значение",
  },
  en: {
    dir: "Direction",
    g2n: "Gross to net",
    n2g: "Net to gross",
    gross: "Gross monthly salary",
    net: "Take-home pay",
    year: "Year",
    deduction: "Standard deduction (main employer)",
    netLabel: "Take-home pay",
    grossLabel: "Gross salary needed",
    subNet: (w: string, p: string) => `withheld ${w} (${p} of gross)`,
    subGross: (n: string) => `take-home pay ${n}`,
    employerTotal: "Employer's total cost",
    enter: "Enter the salary",
    employee: "Withheld from the salary",
    employer: "Paid by the employer on top",
    item: "Item",
    how: "How",
    amount: "Amount",
    totalWithheld: "Total withheld",
    totalEmployer: "Total employer charges",
    cost: "Total cost of the employee",
    burden: "All taxes and contributions",
    constants: (y: number) => `${y} constants`,
    param: "Parameter",
    value: "Value",
  },
} as const;

const DIRS = ["g", "n"] as const;
const YEARS = SALARY_YEARS.map(String) as readonly string[];

export default function SalaryKz({ locale, gross = 500_000, year = 2026 }: ToolProps<{ gross?: number; year?: SalaryYear }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ a: toInput(locale, gross), d: "g", y: String(year), v: "1" }, { enums: { d: DIRS, y: YEARS, v: ["0", "1"] } });
  const dir = q.v.d as (typeof DIRS)[number];
  const y = Number(q.v.y) as SalaryYear;
  const deduction = q.v.v === "1";
  const A = field(locale, q.v.a, { min: 0, max: 1e10 });
  const b = A.value === null ? null : dir === "g" ? salaryKz(A.value, y, { deduction }) : grossFromNet(A.value, y, { deduction });
  const t2 = (v: number) => tg(locale, v);
  const emp = b ? employeeLines(locale, b) : [];
  const empr = b ? employerLines(locale, b) : [];
  const withheld = b ? b.gross - b.net : 0;

  const inputs = (
    <>
      <Segmented
        label={t.dir}
        value={dir}
        onChange={(d) => {
          // keep the same salary when switching direction: show the other side of the current result
          q.set({ d, a: b ? toInput(locale, d === "g" ? b.gross : b.net) : q.v.a });
        }}
        options={[
          { value: "g", label: t.g2n },
          { value: "n", label: t.n2g },
        ]}
      />
      <NumField id={`${id}-a`} label={dir === "g" ? t.gross : t.net} value={q.v.a} onChange={(a) => q.set({ a })} suffix="₸" error={A.message} size="lg" />
      <OptionsRow>
        <InlineSelect id={`${id}-y`} label={t.year} value={q.v.y} onChange={(v) => q.set({ y: v })} options={YEARS.map((x) => ({ value: x, label: x }))} />
        <Checkbox label={<span className="text-sm text-fg-2">{t.deduction}</span>} checked={deduction} onChange={(e) => q.set({ v: e.target.checked ? "1" : "0" })} />
      </OptionsRow>
    </>
  );

  const result = (
    <ResultMain
      label={dir === "g" ? t.netLabel : t.grossLabel}
      value={b ? t2(dir === "g" ? b.net : b.gross) : "—"}
      sub={b ? (dir === "g" ? t.subNet(t2(withheld), fmtPct(locale, b.gross ? (withheld / b.gross) * 100 : 0, 1)) : t.subGross(t2(b.net))) : t.enter}
      rows={b ? [...emp.map((l) => ({ label: l.label, value: t2(l.value) })), { label: t.employerTotal, value: t2(b.employerTotal) }] : undefined}
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    />
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {b && (
        <section>
          <SubHeading>{t.employee}</SubHeading>
          <DataTable
            caption={t.employee}
            head={[t.item, t.how, t.amount]}
            rows={emp.map((l) => [l.label, <span key="h" className="whitespace-normal text-fg-2">{l.how}</span>, t2(l.value)])}
            foot={[t.totalWithheld, "", t2(withheld)]}
            align={["left", "left", "right"]}
          />
        </section>
      )}
      {b && (
        <section>
          <SubHeading>{t.employer}</SubHeading>
          <DataTable
            caption={t.employer}
            head={[t.item, t.how, t.amount]}
            rows={[...empr.map((l) => [l.label, <span key="h" className="whitespace-normal text-fg-2">{l.how}</span>, t2(l.value)]), [t.cost, "", t2(b.employerTotal)]]}
            foot={[t.burden, "", `${t2(b.burden)} (${fmtPct(locale, b.employerTotal ? (b.burden / b.employerTotal) * 100 : 0, 1)})`]}
            align={["left", "left", "right"]}
          />
        </section>
      )}
      <section>
        <SubHeading>{t.constants(y)}</SubHeading>
        <DataTable caption={t.constants(y)} head={[t.param, t.value]} rows={constantRows(locale, y).map(([k, v]) => [k, <span key="v" className="whitespace-normal">{v}</span>])} alignRight={false} />
      </section>
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["На руки = Оклад − ОПВ − ВОСМС − ИПН", "ИПН = 10 % × (Оклад − ОПВ − ВОСМС − вычет)", "Стоимость для работодателя = Оклад + СО + ОПВР + ООСМС + СН"]}
          notes={[
            "Расчёт для резидента РК по трудовому договору, за один месяц, с округлением каждой строки до целого тенге.",
            "Стандартный вычет применяется только на основном месте работы по заявлению сотрудника. Снимите галочку для работы по совместительству.",
            "В 2026 году действует новый Налоговый кодекс: вычет 30 МРП вместо 14, корректировка 90 % отменена, ИПН 15 % — с части годового дохода свыше 8 500 МРП. Для помесячного расчёта порог берётся как 1/12 годового (при одинаковой зарплате каждый месяц); у работодателя фактическое удержание может распределяться по месяцам иначе.",
            "Социальный налог 2026 года: 6 % без уменьшения на социальные отчисления; база взята как в 2025 году (доход − ОПВ − ВОСМС). Льготы (инвалидность, пенсионеры, ИП, спецрежимы) не учитываются.",
            "Ставки и лимиты меняются — сверяйте с действующим законодательством или бухгалтером.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Net = Gross − OPV − VOSMS − IPN", "IPN = 10% × (Gross − OPV − VOSMS − deduction)", "Employer cost = Gross + SO + OPVR + OOSMS + SN"]}
          notes={[
            "For a Kazakhstan tax resident employed under a labour contract, for one month, each line rounded to whole tenge.",
            "The standard deduction applies only at the main place of work on the employee's application. Untick it for a second job.",
            "2026 uses the new Tax Code: a 30 MRP deduction instead of 14, no 90% adjustment, and 15% IPN on the part of annual income above 8,500 MRP. For a monthly figure the threshold is taken as 1/12 of the annual one (same salary every month); an employer may spread the actual withholding differently across months.",
            "2026 social tax: 6% without deducting social contributions; the base is assumed unchanged from 2025 (income − OPV − VOSMS). Benefits for people with disabilities, pensioners, sole proprietors and special regimes are not included.",
            "Rates and limits change — check current law or ask an accountant.",
          ]}
        />
      )}
      <Disclaimer locale={locale}>
        {locale === "ru"
          ? "Расчёт справочный. Константы 2025 и 2026 годов указаны выше — проверьте их по действующему законодательству перед начислением зарплаты."
          : "For reference only. The 2025 and 2026 constants are listed above — verify them against current law before running payroll."}
      </Disclaimer>
    </Stack>
  );
}
