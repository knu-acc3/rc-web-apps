"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { detectKz, kzCheckDigit, parseBin, parseIin, type KzError } from "./lib/kz";
import { BigInput, Details, Problems, Verdict, type Row } from "./ui/kit";

const MONTHS = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  ru1: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const T = {
  ru: {
    label: "ИИН или БИН",
    hint: "12 цифр; тип номера определяется автоматически",
    iinOk: "ИИН корректен",
    binOk: "БИН корректен",
    iinBad: "ИИН с ошибкой",
    binBad: "БИН с ошибкой",
    kind: "Тип номера",
    iin: "ИИН — физическое лицо",
    bin: "БИН — юридическое лицо или ИП(С)",
    birth: "Дата рождения",
    gender: "Пол",
    male: "мужской",
    female: "женский",
    century: "Век рождения",
    centuries: { 19: "XIX век", 20: "XX век", 21: "XXI век" } as Record<number, string>,
    serial: "Порядковый номер",
    regDate: "Месяц и год регистрации",
    type: "Вид",
    types: { 4: "юридическое лицо — резидент", 5: "юридическое лицо — нерезидент", 6: "ИП, осуществляющий совместное предпринимательство (ИП(С))" } as Record<number, string>,
    attr: "Признак",
    attrs: { 0: "головное подразделение", 1: "филиал", 2: "представительство", 3: "крестьянское (фермерское) хозяйство на основе совместного предпринимательства" } as Record<number, string>,
    check: "Контрольная цифра",
    expected: (d: number) => `должна быть ${d}`,
    errors: {
      empty: "Введите номер",
      chars: "Номер состоит только из цифр",
      length: "В ИИН и БИН ровно 12 цифр",
      checksum: "Контрольная цифра не сходится — вероятно, опечатка",
      date: "Первые 6 цифр — не существующая дата рождения",
      century: "7-я цифра должна быть от 1 до 6 (век и пол)",
      type: "5-я цифра БИН должна быть 4, 5 или 6",
      attr: "6-я цифра БИН должна быть от 0 до 3",
      month: "3–4-я цифры БИН — месяц регистрации, от 01 до 12",
    } as Record<KzError, string>,
    note: "Проверяются структура и контрольная цифра по алгоритму, утверждённому в Казахстане. Выдан ли номер на самом деле и кому, проверить можно только в госбазах (например, через eGov) — сюда ничего не отправляется.",
  },
  en: {
    label: "IIN or BIN",
    hint: "12 digits; the number type is detected automatically",
    iinOk: "Valid IIN",
    binOk: "Valid BIN",
    iinBad: "Invalid IIN",
    binBad: "Invalid BIN",
    kind: "Number type",
    iin: "IIN — individual",
    bin: "BIN — legal entity or joint entrepreneurship",
    birth: "Date of birth",
    gender: "Sex",
    male: "male",
    female: "female",
    century: "Century of birth",
    centuries: { 19: "19th century", 20: "20th century", 21: "21st century" } as Record<number, string>,
    serial: "Serial number",
    regDate: "Registration month and year",
    type: "Entity type",
    types: { 4: "resident legal entity", 5: "non-resident legal entity", 6: "individual entrepreneur in joint entrepreneurship" } as Record<number, string>,
    attr: "Unit",
    attrs: { 0: "head office", 1: "branch", 2: "representative office", 3: "peasant (farm) enterprise in joint entrepreneurship" } as Record<number, string>,
    check: "Check digit",
    expected: (d: number) => `should be ${d}`,
    errors: {
      empty: "Enter a number",
      chars: "The number contains digits only",
      length: "IIN and BIN have exactly 12 digits",
      checksum: "The check digit doesn't match — probably a typo",
      date: "The first 6 digits aren't a real date of birth",
      century: "The 7th digit must be 1 to 6 (century and sex)",
      type: "The 5th digit of a BIN must be 4, 5 or 6",
      attr: "The 6th digit of a BIN must be 0 to 3",
      month: "Digits 3–4 of a BIN are the registration month, 01 to 12",
    } as Record<KzError, string>,
    note: "The structure and check digit are verified using Kazakhstan's official algorithm. Whether the number was actually issued, and to whom, can only be checked in government databases (e.g. eGov) — nothing is sent from here.",
  },
} as const;

export default function IinValidator({ locale, value = "900515312349" }: { locale: Locale; value?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const kind = detectKz(text);
  const r = kind === "bin" ? parseBin(text) : parseIin(text);
  const clean = text.replace(/[\s-]/g, "");
  const empty = r.errors[0] === "empty";
  const rows: Row[] = [{ label: t.kind, value: kind === "bin" ? t.bin : t.iin }];

  if (r.kind === "iin") {
    if (r.birth) rows.push({ label: t.birth, value: locale === "ru" ? `${r.birth.d} ${MONTHS.ru[r.birth.m - 1]} ${r.birth.y} г.` : `${MONTHS.en[r.birth.m - 1]} ${r.birth.d}, ${r.birth.y}` });
    if (r.gender) rows.push({ label: t.gender, value: r.gender === "m" ? t.male : t.female });
    if (r.century) rows.push({ label: t.century, value: t.centuries[r.century] });
    if (r.serial) rows.push({ label: t.serial, value: r.serial, mono: true });
  } else {
    if (r.year && r.month) rows.push({ label: t.regDate, value: locale === "ru" ? `${MONTHS.ru1[r.month - 1]} ${r.year}` : `${MONTHS.en[r.month - 1]} ${r.year}` });
    if (r.type) rows.push({ label: t.type, value: t.types[r.type] });
    if (r.attr !== undefined) rows.push({ label: t.attr, value: t.attrs[r.attr] });
    if (r.serial) rows.push({ label: t.serial, value: r.serial, mono: true });
  }
  if (/^\d{12}$/.test(clean)) {
    const c = kzCheckDigit(clean.slice(0, 11));
    rows.push({ label: t.check, value: `${clean[11]}${c !== null && c !== Number(clean[11]) ? ` (${t.expected(c)})` : ""}` });
  }

  return (
    <div className="flex flex-col gap-4">
      <BigInput id={`${id}-n`} label={t.label} value={text} onChange={setText} hint={t.hint} inputMode="numeric" invalid={!empty && !r.valid} />
      {!empty && (
        <Verdict tone={r.valid ? "ok" : "err"} title={r.valid ? (kind === "bin" ? t.binOk : t.iinOk) : kind === "bin" ? t.binBad : t.iinBad} value={r.valid ? clean : undefined}>
          <Problems items={r.errors.map((e) => t.errors[e])} />
        </Verdict>
      )}
      {!empty && r.errors[0] !== "chars" && r.errors[0] !== "length" && <Details rows={rows} locale={locale} />}
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
