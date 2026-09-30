"use client";

import { Plus, X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/ui/button";
import { Input, Select } from "@/ui/field";
import { Notice } from "@/ui/panel";
import type { ToolProps } from "../../types";
import { fmtRound } from "../../calc/kit/fmt";
import { field, readNum } from "../../calc/kit/num";
import { CalcGrid, Disclaimer, Explain, FieldRow, NumField, OptionsRow, ResultMain, Stack, ToolActions } from "../../calc/kit/ui";
import { useQueryState } from "../../calc/kit/url-state";
import { alcoholGrams, ELIMINATION, widmark, WIDMARK_R, type Sex } from "../engines/body";
import { SEXES, SexToggle } from "../parts";

const PRESETS = [
  { id: "beer", ml: 500, abv: 5 },
  { id: "wine", ml: 150, abv: 12 },
  { id: "champagne", ml: 150, abv: 11 },
  { id: "vodka", ml: 50, abv: 40 },
  { id: "cognac", ml: 50, abv: 40 },
  { id: "cocktail", ml: 250, abv: 10 },
] as const;

const T = {
  ru: {
    weight: "Вес, кг",
    hours: "Прошло часов с начала",
    drinks: "Что выпито",
    ml: "Объём, мл",
    abv: "Крепость, %",
    count: "Сколько",
    add: "Добавить напиток",
    presets: { beer: "Пиво 0,5 л, 5 %", wine: "Вино 150 мл, 12 %", champagne: "Шампанское 150 мл, 11 %", vodka: "Водка 50 мл, 40 %", cognac: "Коньяк 50 мл, 40 %", cocktail: "Коктейль 250 мл, 10 %" } as Record<string, string>,
    remove: "Удалить",
    label: "Примерно сейчас в крови",
    permille: "‰",
    sub: (peak: string, h: string) => `пик ≈ ${peak} ‰; снижение до нуля — примерно через ${h} ч после начала`,
    subZero: (h: string) => `по оценке алкоголь уже выведен; расчётное время — около ${h} ч`,
    grams: "Чистый алкоголь",
    g: "г",
    peak: "Расчётный пик",
    warn: "Это очень грубая оценка. Фактическая концентрация зависит от еды, скорости употребления, здоровья, лекарств и генетики и может быть заметно выше. Не садитесь за руль после употребления алкоголя — ни один калькулятор не может сказать, что это безопасно.",
    enter: "Введите вес и напитки",
  },
  en: {
    weight: "Weight, kg",
    hours: "Hours since the first drink",
    drinks: "Drinks",
    ml: "Volume, ml",
    abv: "ABV, %",
    count: "How many",
    add: "Add a drink",
    presets: { beer: "Beer 500 ml, 5%", wine: "Wine 150 ml, 12%", champagne: "Sparkling wine 150 ml, 11%", vodka: "Vodka 50 ml, 40%", cognac: "Brandy 50 ml, 40%", cocktail: "Cocktail 250 ml, 10%" } as Record<string, string>,
    remove: "Remove",
    label: "Estimated blood alcohol now",
    permille: "‰",
    sub: (peak: string, h: string) => `peak ≈ ${peak} ‰; back to zero roughly ${h} h after you started`,
    subZero: (h: string) => `estimated to be eliminated; the estimate is about ${h} h`,
    grams: "Pure alcohol",
    g: "g",
    peak: "Estimated peak",
    warn: "This is a very rough estimate. Real blood alcohol depends on food, drinking speed, health, medication and genetics and can be considerably higher. Do not drive after drinking — no calculator can tell you it is safe.",
    enter: "Enter your weight and drinks",
  },
} as const;

interface Drink {
  ml: string;
  abv: string;
  n: string;
}
const decode = (s: string): Drink[] =>
  s
    .split("|")
    .filter(Boolean)
    .slice(0, 20)
    .map((c) => {
      const [ml = "", abv = "", n = "1"] = c.split("~");
      return { ml, abv, n };
    });
const encode = (d: Drink[]) => d.map((x) => [x.ml, x.abv, x.n].map((v) => v.replace(/[|~]/g, "")).join("~")).join("|");

export default function Bac({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ s: "male", w: "80", h: "1", d: encode([{ ml: "500", abv: "5", n: "2" }]) }, { enums: { s: SEXES } });
  const sex = q.v.s as Sex;
  const W = field(locale, q.v.w, { min: 30, max: 300 });
  const H = field(locale, q.v.h, { min: 0, max: 48 });
  const drinks = decode(q.v.d);
  const grams = drinks.reduce((s, d) => {
    const ml = readNum(locale, d.ml, { min: 0 }).value ?? 0;
    const abv = readNum(locale, d.abv, { min: 0, max: 100 }).value ?? 0;
    const n = readNum(locale, d.n, { min: 0 }).value ?? 0;
    return s + alcoholGrams(ml, abv) * n;
  }, 0);
  const r = W.value !== null && H.value !== null && grams > 0 ? widmark(grams, W.value, sex, H.value) : null;
  const pm = (v: number) => fmtRound(locale, v, 2);
  const setDrink = (i: number, patch: Partial<Drink>) => q.set({ d: encode(drinks.map((d, j) => (j === i ? { ...d, ...patch } : d))) });

  const inputs = (
    <>
      <FieldRow>
        <NumField id={`${id}-w`} label={t.weight} value={q.v.w} onChange={(w) => q.set({ w })} error={W.message} size="lg" />
        <NumField id={`${id}-h`} label={t.hours} value={q.v.h} onChange={(h) => q.set({ h })} error={H.message} size="lg" />
      </FieldRow>
      <OptionsRow>
        <SexToggle locale={locale} value={sex} onChange={(s) => q.set({ s })} />
      </OptionsRow>
      <div>
        <h2 className="mb-2 text-sm font-semibold text-fg-2">{t.drinks}</h2>
        <ul className="flex flex-col gap-2">
          {drinks.map((d, i) => (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] items-center gap-2">
              <label className="min-w-0">
                <span className="sr-only">{`${t.ml} ${i + 1}`}</span>
                <Input value={d.ml} onChange={(e) => setDrink(i, { ml: e.target.value })} inputMode="decimal" placeholder={t.ml} className="tabular" autoComplete="off" />
              </label>
              <label className="min-w-0">
                <span className="sr-only">{`${t.abv} ${i + 1}`}</span>
                <Input value={d.abv} onChange={(e) => setDrink(i, { abv: e.target.value })} inputMode="decimal" placeholder={t.abv} className="tabular" autoComplete="off" />
              </label>
              <label className="min-w-0">
                <span className="sr-only">{`${t.count} ${i + 1}`}</span>
                <Input value={d.n} onChange={(e) => setDrink(i, { n: e.target.value })} inputMode="decimal" placeholder={t.count} className="tabular" autoComplete="off" />
              </label>
              <Button variant="ghost" size="icon-sm" onClick={() => q.set({ d: encode(drinks.filter((_, j) => j !== i)) })} aria-label={t.remove} title={t.remove}>
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[0.75rem] text-fg-3">
          {t.ml} · {t.abv} · {t.count}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Plus className="size-4 text-fg-3" aria-hidden />
          <label htmlFor={`${id}-add`} className="sr-only">
            {t.add}
          </label>
          <Select
            id={`${id}-add`}
            size="sm"
            value=""
            onChange={(e) => {
              const p = PRESETS.find((x) => x.id === e.target.value);
              if (p) q.set({ d: encode([...drinks, { ml: String(p.ml), abv: String(p.abv), n: "1" }]) });
            }}
          >
            <option value="">{t.add}</option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {t.presets[p.id]}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </>
  );

  return (
    <Stack>
      <CalcGrid
        inputs={inputs}
        result={
          <ResultMain
            label={t.label}
            value={r ? `≈ ${pm(r.now)} ${t.permille}` : "—"}
            sub={r ? (r.now > 0 ? t.sub(pm(r.peak), fmtRound(locale, r.hoursToZero, 1)) : t.subZero(fmtRound(locale, r.hoursToZero, 1))) : t.enter}
            rows={
              r
                ? [
                    { label: t.grams, value: `${fmtRound(locale, grams, 1)} ${t.g}` },
                    { label: t.peak, value: `${pm(r.peak)} ${t.permille}` },
                  ]
                : undefined
            }
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          >
            <Notice tone="warn" className="mt-4">
              {t.warn}
            </Notice>
          </ResultMain>
        }
      />
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["Алкоголь, г = объём (мл) × крепость / 100 × 0,789", "Промилле = г / (r × вес) − β × часы", `r = ${fmtRound(locale, WIDMARK_R.male, 2)} (муж.), ${fmtRound(locale, WIDMARK_R.female, 2)} (жен.); β = ${fmtRound(locale, ELIMINATION, 2)} ‰/ч`]}
          notes={[
            "Формула Видмарка (1932) предполагает, что весь алкоголь всосался сразу, и даёт среднюю оценку. Коэффициент r зависит от доли воды в организме и у разных людей заметно различается.",
            "Скорость выведения у большинства людей — 0,1–0,2 ‰ в час; калькулятор использует 0,15. Кофе, душ и сон не ускоряют выведение алкоголя.",
            "При сильном опьянении, спутанности сознания, рвоте или потере сознания вызывайте скорую помощь (103 в Казахстане и России, 112 — единый номер).",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Alcohol, g = volume (ml) × ABV / 100 × 0.789", "‰ = g / (r × weight) − β × hours", `r = ${fmtRound(locale, WIDMARK_R.male, 2)} (men), ${fmtRound(locale, WIDMARK_R.female, 2)} (women); β = ${fmtRound(locale, ELIMINATION, 2)} ‰/h`]}
          notes={[
            "The Widmark formula (1932) assumes all alcohol is absorbed at once and gives an average estimate. The factor r depends on body water and varies considerably between people.",
            "Most people eliminate 0.1–0.2 ‰ per hour; the calculator uses 0.15. Coffee, showers and sleep do not speed it up.",
            "With severe intoxication, confusion, vomiting or loss of consciousness, call emergency services.",
          ]}
        />
      )}
      <Disclaimer locale={locale} kind="medical" />
    </Stack>
  );
}
