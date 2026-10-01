"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Field, Input } from "@/ui/field";
import type { ToolProps } from "../../../types";
import { useToday } from "../../shared/clock";
import { daysInMonth, fmtDay, parseIso, partsOf } from "../../shared/dates";
import { field } from "../../shared/num";
import { Advanced, CalcGrid, Disclaimer, Explain, FieldRow, NumField, ResultMain, Stack, SubHeading, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { cycles, type CycleDays } from "../lib/cycle";

const T = {
  ru: {
    lmp: "Первый день последних месячных",
    cycle: "Длина цикла, дней",
    more: "Длина лютеиновой фазы",
    luteal: "Лютеиновая фаза, дней",
    lutealHint: "Обычно 12–16 дней; если не знаете — оставьте 14",
    label: "Ближайшая овуляция",
    sub: (a: string, b: string) => `фертильное окно: ${a} — ${b}`,
    nextPeriod: "Следующие месячные",
    enter: "Укажите дату начала последних месячных",
    future: "Дата не может быть в будущем",
    calendar: "Календарь на ближайшие циклы",
    period: "Месячные (ожидаемые)",
    fertile: "Фертильные дни",
    ovulation: "Овуляция",
    list: "Циклы",
    cycleN: (n: number) => `Цикл ${n}`,
    week: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    notContraception: "Расчёт основан на средних значениях и не подходит как способ контрацепции. При нерегулярном цикле точность заметно ниже.",
  },
  en: {
    lmp: "First day of your last period",
    cycle: "Cycle length, days",
    more: "Luteal phase length",
    luteal: "Luteal phase, days",
    lutealHint: "Usually 12–16 days; leave 14 if unsure",
    label: "Next ovulation",
    sub: (a: string, b: string) => `fertile window: ${a} — ${b}`,
    nextPeriod: "Next period",
    enter: "Enter the first day of your last period",
    future: "The date cannot be in the future",
    calendar: "Calendar for the next cycles",
    period: "Period (expected)",
    fertile: "Fertile days",
    ovulation: "Ovulation",
    list: "Cycles",
    cycleN: (n: number) => `Cycle ${n}`,
    week: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    notContraception: "The estimate uses average values and is not a method of contraception. With irregular cycles accuracy is much lower.",
  },
} as const;

type Kind = "period" | "fertile" | "ovulation" | null;

function kindOf(day: number, cs: CycleDays[], periodLen = 5): Kind {
  for (const c of cs) {
    if (day === c.ovulation) return "ovulation";
    if (day >= c.fertileStart && day <= c.fertileEnd) return "fertile";
    if ((day >= c.start && day < c.start + periodLen) || (day >= c.nextStart && day < c.nextStart + periodLen && c === cs[cs.length - 1])) return "period";
  }
  return null;
}

function MonthGrid({ locale, year, month, cs, today }: { locale: Locale; year: number; month: number; cs: CycleDays[]; today: number | null }) {
  const t = T[locale];
  const first = parseIso(`${year}-${String(month).padStart(2, "0")}-01`)!;
  const offset = partsOf(first).weekday;
  const n = daysInMonth(year, month);
  const cells: (number | null)[] = [...Array.from({ length: offset }, () => null), ...Array.from({ length: n }, (_, i) => first + i)];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const title = fmtDay(locale, first, { month: "long", year: "numeric" });
  return (
    <table className="w-full table-fixed border-separate border-spacing-1 text-center text-sm">
      <caption className="mb-1 text-left text-sm font-semibold capitalize text-fg">{title}</caption>
      <thead>
        <tr>
          {t.week.map((d) => (
            <th key={d} scope="col" className="text-[0.75rem] font-medium text-fg-3">
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((w, i) => (
          <tr key={i}>
            {w.map((d, j) => {
              if (d === null) return <td key={j} />;
              const k = kindOf(d, cs);
              const label = k === "ovulation" ? t.ovulation : k === "fertile" ? t.fertile : k === "period" ? t.period : undefined;
              return (
                <td
                  key={j}
                  title={label}
                  aria-label={label ? `${fmtDay(locale, d)} — ${label}` : undefined}
                  className={cn(
                    "tabular h-8 rounded-[0.5rem]",
                    k === "ovulation" && "bg-ok font-bold text-white",
                    k === "fertile" && "bg-ok-soft font-medium text-ok",
                    k === "period" && "bg-err-soft text-err",
                    !k && "text-fg-2",
                    d === today && "outline outline-2 outline-accent",
                  )}
                >
                  {partsOf(d).d}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Ovulation({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const today = useToday();
  const todayDay = today ? parseIso(today) : null;
  const q = useQueryState({ d: "", c: "28", l: "14" });
  const C = field(locale, q.v.c, { min: 21, max: 45, int: true });
  const L = field(locale, q.v.l, { min: 10, max: 16, int: true });
  const lmp = q.v.d ? parseIso(q.v.d) : null;
  const future = lmp !== null && todayDay !== null && lmp > todayDay;
  const all = lmp !== null && !future && C.value !== null && L.value !== null ? cycles(lmp, C.value, L.value, 24) : null;
  // Start from the cycle that contains today (or the first one) and show three cycles.
  const startIdx = all && todayDay !== null ? Math.max(0, all.findIndex((c) => c.nextStart > todayDay)) : 0;
  const cs = all ? all.slice(startIdx, startIdx + 3) : null;
  const next = cs && todayDay !== null ? (all!.find((c) => c.fertileEnd >= todayDay) ?? cs[0]) : cs?.[0];
  const day = (d: number) => fmtDay(locale, d, { day: "numeric", month: "long" });

  const months: { y: number; m: number }[] = [];
  if (cs) {
    const a = partsOf(cs[0].start);
    const b = partsOf(cs[cs.length - 1].nextStart);
    for (let y = a.y, m = a.m; y < b.y || (y === b.y && m <= b.m); m === 12 ? ((m = 1), y++) : m++) months.push({ y, m });
  }

  const inputs = (
    <>
      <Field label={t.lmp} htmlFor={`${id}-d`} error={future ? t.future : undefined}>
        <Input id={`${id}-d`} type="date" size="lg" value={q.v.d} onChange={(e) => q.set({ d: e.target.value })} max={today ?? undefined} aria-invalid={future} />
      </Field>
      <NumField id={`${id}-c`} label={t.cycle} value={q.v.c} onChange={(c) => q.set({ c })} error={C.message} inputMode="numeric" size="lg" />
      <Advanced title={t.more} open={q.v.l !== "14"}>
        <FieldRow>
          <NumField id={`${id}-l`} label={t.luteal} hint={t.lutealHint} value={q.v.l} onChange={(l) => q.set({ l })} error={L.message} inputMode="numeric" />
        </FieldRow>
      </Advanced>
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={t.label}
            value={next ? fmtDay(locale, next.ovulation, { day: "numeric", month: "long", weekday: "short" }) : "—"}
            sub={next ? t.sub(day(next.fertileStart), day(next.fertileEnd)) : t.enter}
            rows={next ? [{ label: t.nextPeriod, value: day(next.nextStart) }] : undefined}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
            size="md"
          >
            <p className="mt-3 text-[0.8125rem] text-fg-2">{t.notContraception}</p>
          </ResultMain>
        }
      />
      {cs && (
        <section>
          <SubHeading>{t.calendar}</SubHeading>
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] text-fg-2">
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="inline-block size-3 rounded bg-err-soft" /> {t.period}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="inline-block size-3 rounded bg-ok-soft" /> {t.fertile}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden className="inline-block size-3 rounded bg-ok" /> {t.ovulation}
            </li>
          </ul>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {months.slice(0, 6).map(({ y, m }) => (
              <div key={`${y}-${m}`} className="rounded-[0.75rem] border border-line bg-surface p-3">
                <MonthGrid locale={locale} year={y} month={m} cs={cs} today={todayDay} />
              </div>
            ))}
          </div>
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["День овуляции = длина цикла − лютеиновая фаза (обычно 14 дней)", "Фертильное окно = 5 дней до овуляции + день овуляции + 1 день после", "Первый день месячных — 1-й день цикла"]}
          notes={[
            "Сперматозоиды сохраняют активность до 5 дней, яйцеклетка — около суток, поэтому шансы на зачатие есть примерно 6 дней цикла.",
            "Лютеиновая фаза (от овуляции до месячных) у большинства женщин стабильна — 12–16 дней, а длина цикла меняется за счёт первой фазы.",
            "Точнее определить овуляцию помогают тесты на ЛГ, измерение базальной температуры и УЗИ-мониторинг.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Ovulation day = cycle length − luteal phase (usually 14 days)", "Fertile window = 5 days before ovulation + ovulation day + 1 day after", "The first day of your period is cycle day 1"]}
          notes={[
            "Sperm can survive up to 5 days and the egg about a day, so there are roughly 6 fertile days per cycle.",
            "The luteal phase (from ovulation to the period) is fairly stable at 12–16 days for most women; cycle length varies because of the first phase.",
            "LH tests, basal body temperature and ultrasound monitoring pinpoint ovulation more accurately.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
