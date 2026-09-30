"use client";

import Link from "next/link";
import { useId } from "react";
import { href } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Field, Input } from "@/ui/field";
import type { ToolProps } from "../../types";
import { useToday } from "../../calc/kit/clock";
import { fmtDay, isoOf, parseIso } from "../../calc/kit/dates";
import { field } from "../../calc/kit/num";
import { CalcGrid, Disclaimer, Explain, FieldRow, NumField, ResultMain, SelectField, Stack, SubHeading, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { eddFromConception, eddFromIvf, eddFromLmp, eddFromUltrasound, gestationalAge, keyDates, splitWeeks, trimester, type DatingMethod } from "../engines/cycle";
import { weekInfo } from "./weeks";

const METHODS = ["lmp", "conception", "ivf5", "ivf3", "ultrasound"] as const;

const T = {
  ru: {
    method: "Как считать",
    methods: { lmp: "По первому дню последних месячных", conception: "По дате зачатия", ivf5: "ЭКО: перенос 5-дневного эмбриона", ivf3: "ЭКО: перенос 3-дневного эмбриона", ultrasound: "По данным УЗИ" } satisfies Record<DatingMethod, string>,
    lmp: "Первый день последних месячных",
    cycle: "Длина цикла, дней",
    conception: "Дата зачатия",
    transfer: "Дата переноса эмбриона",
    scan: "Дата УЗИ",
    gaW: "Срок по УЗИ, недель",
    gaD: "и дней",
    label: "Предполагаемая дата родов",
    enter: "Укажите дату",
    future: "Дата не может быть в будущем",
    tooOld: "Дата слишком давняя — проверьте ввод",
    weeks: ["неделя", "недели", "недель"],
    days: ["день", "дня", "дней"],
    now: (w: string, tri: number) => `сейчас ${w}, ${tri}-й триместр`,
    before: "беременность ещё не наступила по расчёту",
    born: "срок родов прошёл",
    left: (d: number) => `до родов ${d} ${plural("ru", d, ["день", "дня", "дней"])}`,
    kConception: "Примерная дата зачатия",
    kT1: "Конец 1-го триместра (13 нед. 6 дн.)",
    kT2: "Конец 2-го триместра (27 нед. 6 дн.)",
    kTerm: "Доношенный срок с (37 нед.)",
    kPost: "Переношенная беременность с (42 нед.)",
    weekTitle: (w: number) => `${w}-я неделя: что происходит`,
    size: (l: string, g: string | null) => `Размер плода ≈ ${l}${g ? `, вес ≈ ${g}` : ""}`,
    more: "Подробнее о неделе",
    ifWeek: (w: number) => `Если сейчас ${w}-я неделя беременности`,
  },
  en: {
    method: "Method",
    methods: { lmp: "First day of last period", conception: "Conception date", ivf5: "IVF: day-5 embryo transfer", ivf3: "IVF: day-3 embryo transfer", ultrasound: "Ultrasound dating" } satisfies Record<DatingMethod, string>,
    lmp: "First day of your last period",
    cycle: "Cycle length, days",
    conception: "Conception date",
    transfer: "Embryo transfer date",
    scan: "Ultrasound date",
    gaW: "Age at the scan, weeks",
    gaD: "and days",
    label: "Estimated due date",
    enter: "Enter a date",
    future: "The date cannot be in the future",
    tooOld: "The date is too far back — please check",
    weeks: ["week", "weeks"],
    days: ["day", "days"],
    now: (w: string, tri: number) => `now ${w}, trimester ${tri}`,
    before: "the pregnancy has not started yet by this estimate",
    born: "the due date has passed",
    left: (d: number) => `${d} ${d === 1 ? "day" : "days"} to go`,
    kConception: "Estimated conception",
    kT1: "End of 1st trimester (13w 6d)",
    kT2: "End of 2nd trimester (27w 6d)",
    kTerm: "Term from (37 weeks)",
    kPost: "Post-term from (42 weeks)",
    weekTitle: (w: number) => `Week ${w}: what is happening`,
    size: (l: string, g: string | null) => `Baby ≈ ${l}${g ? `, ≈ ${g}` : ""}`,
    more: "More about this week",
    ifWeek: (w: number) => `If you are ${w} weeks pregnant today`,
  },
} as const;

export default function Pregnancy({ locale, week }: ToolProps<{ week?: number }>) {
  const t = T[locale];
  const id = useId();
  const today = useToday();
  const todayDay = today ? parseIso(today) : null;
  const q = useQueryState({ m: "lmp", d: "", c: "28", w: "8", dd: "0" }, { enums: { m: METHODS } });
  const method = q.v.m as DatingMethod;
  const C = field(locale, q.v.c, { min: 21, max: 45, int: true });
  const GW = field(locale, q.v.w, { min: 4, max: 42, int: true });
  const GD = field(locale, q.v.dd, { min: 0, max: 6, int: true });
  const entered = q.v.d ? parseIso(q.v.d) : null;
  // On week pages without an entered date, assume "today is week N" (client only).
  const assumed = !q.v.d && week && todayDay !== null && method === "lmp" ? todayDay - week * 7 : null;
  const base = entered ?? assumed;

  let edd: number | null = null;
  if (base !== null) {
    if (method === "lmp" && C.value !== null) edd = eddFromLmp(base, C.value);
    if (method === "conception") edd = eddFromConception(base);
    if (method === "ivf5") edd = eddFromIvf(base, 5);
    if (method === "ivf3") edd = eddFromIvf(base, 3);
    if (method === "ultrasound" && GW.value !== null && GD.value !== null) edd = eddFromUltrasound(base, GW.value, GD.value);
  }
  let dateErr: string | undefined;
  if (entered !== null && todayDay !== null) {
    if (entered > todayDay) dateErr = t.future;
    else if (todayDay - entered > 45 * 7) dateErr = t.tooOld;
  }
  if (dateErr) edd = null;

  const ga = edd !== null && todayDay !== null ? gestationalAge(edd, todayDay) : null;
  const gaText = ga !== null ? (() => {
    const { weeks, days } = splitWeeks(ga);
    return `${weeks} ${plural(locale, weeks, t.weeks)}${days ? ` ${days} ${plural(locale, days, t.days)}` : ""}`;
  })() : "";
  let sub: string = dateErr ?? t.enter;
  if (edd !== null) {
    if (ga === null) sub = "";
    else if (ga < 0) sub = t.before;
    else if (ga > 44 * 7) sub = t.born;
    else sub = `${t.now(gaText, trimester(ga))}; ${edd - todayDay! >= 0 ? t.left(edd - todayDay!) : t.born}`;
  }
  const k = edd !== null ? keyDates(edd) : null;
  const day = (d: number) => fmtDay(locale, d);
  const currentWeek = ga !== null && ga >= 0 ? Math.floor(ga / 7) : null;
  const infoWeek = week ?? (currentWeek !== null && currentWeek >= 4 && currentWeek <= 42 ? currentWeek : null);
  const info = infoWeek !== null ? weekInfo(infoWeek) : undefined;
  const cm = (v: number) => `${v < 1 ? v.toLocaleString(locale === "ru" ? "ru-RU" : "en-US") : Math.round(v).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} ${locale === "ru" ? "см" : "cm"}`;
  const g = (v: number) => (v >= 1000 ? `${(Math.round(v / 100) / 10).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")} ${locale === "ru" ? "кг" : "kg"}` : `${v} ${locale === "ru" ? "г" : "g"}`);

  const dateLabel = method === "lmp" ? t.lmp : method === "conception" ? t.conception : method === "ultrasound" ? t.scan : t.transfer;
  const inputs = (
    <>
      <SelectField id={`${id}-m`} label={t.method} value={method} onChange={(m) => q.set({ m })} options={METHODS.map((m) => ({ value: m, label: t.methods[m] }))} />
      <Field label={dateLabel} htmlFor={`${id}-d`} error={dateErr}>
        <Input id={`${id}-d`} type="date" size="lg" value={q.v.d || (assumed !== null ? isoOf(assumed) : "")} onChange={(e) => q.set({ d: e.target.value })} max={today ?? undefined} aria-invalid={!!dateErr} />
      </Field>
      {method === "lmp" && <NumField id={`${id}-c`} label={t.cycle} value={q.v.c} onChange={(c) => q.set({ c })} error={C.message} inputMode="numeric" />}
      {method === "ultrasound" && (
        <FieldRow>
          <NumField id={`${id}-w`} label={t.gaW} value={q.v.w} onChange={(w) => q.set({ w })} error={GW.message} inputMode="numeric" />
          <NumField id={`${id}-dd`} label={t.gaD} value={q.v.dd} onChange={(dd) => q.set({ dd })} error={GD.message} inputMode="numeric" />
        </FieldRow>
      )}
    </>
  );

  const progress = ga !== null ? Math.min(1, Math.max(0, ga / 280)) : null;
  const result = (
    <ResultMain
      label={assumed !== null && entered === null && week ? t.ifWeek(week) : t.label}
      value={edd !== null ? day(edd) : "—"}
      sub={sub || undefined}
      rows={
        k
          ? [
              { label: t.kConception, value: day(k.conception) },
              { label: t.kT1, value: day(k.endT1) },
              { label: t.kT2, value: day(k.endT2) },
              { label: t.kTerm, value: day(k.fullTerm) },
              { label: t.kPost, value: day(k.postTerm) },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
      size="md"
    >
      {progress !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface" role="img" aria-label={gaText}>
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </ResultMain>
  );

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={result} />
      {info && (
        <section>
          <SubHeading>{t.weekTitle(info.week)}</SubHeading>
          <p className="text-sm font-medium text-fg">{t.size(cm(info.length), info.weight ? g(info.weight) : null)}</p>
          <ul className="mt-2 max-w-[75ch] list-disc space-y-1 pl-5 text-[15px] text-fg-2">
            {info[locale].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {!week && (
            <Link href={href(locale, ["pregnancy-calculator", `week-${info.week}`])} className="mt-2 inline-block text-sm text-accent hover:underline">
              {t.more}
            </Link>
          )}
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["По месячным: ПДР = первый день + 280 дней + (длина цикла − 28)", "По зачатию: ПДР = дата зачатия + 266 дней", "ЭКО: перенос 5-дневного эмбриона + 261 день, 3-дневного + 263 дня", "По УЗИ: ПДР = дата УЗИ + 280 дней − срок на УЗИ"]}
          notes={[
            "Правило Негеле рассчитано на цикл 28 дней. При другой длине цикла сдвигаются и дата родов, и текущий срок — калькулятор применяет поправку одинаково к обоим.",
            "Срок беременности считают в акушерских неделях — от первого дня последних месячных, то есть примерно на 2 недели больше, чем от зачатия.",
            "Если срок по УЗИ первого триместра расходится с расчётом по месячным, врачи обычно ориентируются на УЗИ.",
            "Только около 4–5 % детей рождаются точно в предполагаемую дату; нормой считаются роды с 37 до 42 недель.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["From your period: EDD = first day + 280 days + (cycle length − 28)", "From conception: EDD = conception + 266 days", "IVF: day-5 transfer + 261 days, day-3 transfer + 263 days", "Ultrasound: EDD = scan date + 280 days − age at the scan"]}
          notes={[
            "Naegele's rule assumes a 28-day cycle. With a different cycle both the due date and the current age shift — the calculator applies the correction to both consistently.",
            "Pregnancy is dated in gestational weeks from the first day of the last period, about 2 weeks more than from conception.",
            "If a first-trimester ultrasound disagrees with the date from your period, doctors usually go by the ultrasound.",
            "Only about 4–5% of babies arrive on the due date; birth between 37 and 42 weeks is normal.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
