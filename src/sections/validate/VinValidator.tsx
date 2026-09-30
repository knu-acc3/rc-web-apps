"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { validateVin, type Region, type VinError } from "./lib/vin";
import { BigInput, Details, Problems, Verdict, type Row } from "./ui";

const T = {
  ru: {
    label: "VIN-код",
    hint: "17 символов: латинские буквы (кроме I, O, Q) и цифры",
    ok: "VIN корректен, контрольная цифра сходится",
    okNoCheck: "Структура VIN корректна",
    bad: "VIN с ошибкой",
    checkWarn: (exp: string) => `Контрольная цифра (9-й символ) должна быть ${exp}. Для автомобилей для рынка Северной Америки это ошибка; у европейских и азиатских машин 9-й символ часто не контрольный — тогда несовпадение нормально.`,
    wmi: "WMI — производитель (1–3)",
    vds: "VDS — описание модели (4–9)",
    vis: "VIS — экземпляр (10–17)",
    region: "Регион сборки",
    regions: { africa: "Африка (A–H)", asia: "Азия (J–R)", europe: "Европа (S–Z), включая Россию (X, Z)", "north-america": "Северная Америка (1–5)", oceania: "Океания (6–7)", "south-america": "Южная Америка (8–9)", unknown: "не определён" } as Record<Region, string>,
    year: "Модельный год (10-й символ)",
    years: (a: number, b: number) => `${a} или ${b}`,
    noYear: "код не используется для года",
    plant: "Код завода (11-й символ)",
    serial: "Серийный номер (12–17)",
    check: "Контрольная цифра (9-й символ)",
    errors: { empty: "Введите VIN", length: "В VIN ровно 17 символов", chars: "Допустимы только латинские буквы и цифры", ioq: "Буквы I, O и Q в VIN не используются, чтобы их не путали с 1 и 0", check: "" } as Record<VinError, string>,
    note: "Инструмент проверяет структуру VIN и контрольную цифру, определяет регион по первому символу и модельный год. Марку, комплектацию и историю автомобиля по VIN он не ищет — для этого нужны базы производителей и сервисы проверки истории.",
  },
  en: {
    label: "VIN",
    hint: "17 characters: Latin letters (except I, O, Q) and digits",
    ok: "Valid VIN, check digit matches",
    okNoCheck: "The VIN structure is valid",
    bad: "Invalid VIN",
    checkWarn: (exp: string) => `The check digit (9th character) should be ${exp}. For vehicles built for North America that's an error; many European and Asian vehicles don't use position 9 as a check digit, so a mismatch is normal there.`,
    wmi: "WMI — manufacturer (1–3)",
    vds: "VDS — vehicle attributes (4–9)",
    vis: "VIS — vehicle identifier (10–17)",
    region: "Region",
    regions: { africa: "Africa (A–H)", asia: "Asia (J–R)", europe: "Europe (S–Z)", "north-america": "North America (1–5)", oceania: "Oceania (6–7)", "south-america": "South America (8–9)", unknown: "unknown" } as Record<Region, string>,
    year: "Model year (10th character)",
    years: (a: number, b: number) => `${a} or ${b}`,
    noYear: "not a model-year code",
    plant: "Plant code (11th character)",
    serial: "Serial number (12–17)",
    check: "Check digit (9th character)",
    errors: { empty: "Enter a VIN", length: "A VIN has exactly 17 characters", chars: "Latin letters and digits only", ioq: "The letters I, O and Q are never used, to avoid confusion with 1 and 0", check: "" } as Record<VinError, string>,
    note: "The tool checks the VIN structure and check digit and decodes the region and model year. It doesn't look up the make, trim or vehicle history — that needs manufacturer databases and history services.",
  },
} as const;

export default function VinValidator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("1HGCM82633A004352");
  const r = validateVin(text);
  const empty = r.errors[0] === "empty";
  const structural = r.errors.filter((e) => e !== "check");
  const rows: Row[] = [];
  if (r.valid) {
    rows.push({ label: t.wmi, value: r.wmi!, mono: true });
    rows.push({ label: t.vds, value: r.vds!, mono: true });
    rows.push({ label: t.vis, value: r.vis!, mono: true });
    rows.push({ label: t.region, value: t.regions[r.region!] });
    rows.push({ label: t.year, value: r.years ? t.years(r.years[0], r.years[1]) : t.noYear });
    rows.push({ label: t.plant, value: r.plant!, mono: true });
    rows.push({ label: t.serial, value: r.serial!, mono: true });
    rows.push({ label: t.check, value: `${r.vin[8]}${r.checkOk ? " ✓" : ` → ${r.expectedCheck}`}`, mono: true });
  }
  const tone = empty ? "idle" : structural.length ? "err" : r.checkOk ? "ok" : "warn";
  return (
    <div className="flex flex-col gap-4">
      <BigInput id={`${id}-n`} label={t.label} value={text} onChange={(v) => setText(v.toUpperCase())} hint={t.hint} invalid={!empty && structural.length > 0} />
      {!empty && (
        <Verdict tone={tone} title={structural.length ? t.bad : r.checkOk ? t.ok : t.okNoCheck} value={r.valid ? r.vin : undefined}>
          <Problems items={structural.map((e) => t.errors[e])} />
          {r.valid && !r.checkOk && <p>{t.checkWarn(r.expectedCheck!)}</p>}
        </Verdict>
      )}
      <Details rows={rows} locale={locale} />
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
