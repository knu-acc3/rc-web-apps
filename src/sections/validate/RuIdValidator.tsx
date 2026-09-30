"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { validateInn, validateOgrn, validateSnils, type RuError } from "./lib/ru";
import { BigInput, Details, Problems, Verdict, type Row } from "./ui";

type Kind = "inn" | "snils" | "ogrn";

const T = {
  ru: {
    label: { inn: "ИНН", snils: "СНИЛС", ogrn: "ОГРН или ОГРНИП" },
    hint: { inn: "10 цифр у организаций, 12 — у физлиц и ИП", snils: "11 цифр, можно с дефисами и пробелом", ogrn: "13 цифр у юрлица, 15 — у ИП" },
    ok: { inn: "ИНН корректен", snils: "СНИЛС корректен", ogrn: "Номер корректен" },
    bad: { inn: "ИНН с ошибкой", snils: "СНИЛС с ошибкой", ogrn: "Номер с ошибкой" },
    errors: {
      empty: "Введите номер",
      chars: "Номер состоит только из цифр",
      length: { inn: "В ИНН 10 или 12 цифр", snils: "В СНИЛС 11 цифр", ogrn: "В ОГРН 13 цифр, в ОГРНИП — 15" },
      checksum: "Контрольное число не сходится — вероятно, опечатка",
      checksum2: "Не сходится последняя (12-я) контрольная цифра",
      zero: "Номер из одних нулей не выдаётся",
    },
    kind: "Тип",
    legal: "ИНН организации",
    person: "ИНН физического лица или ИП",
    region: "Код региона (первые 2 цифры)",
    correct: "Правильный вариант с этими цифрами",
    formatted: "Запись",
    noChecksum: "Для номеров до 001-001-998 контрольное число не рассчитывается",
    ogrnKind: { ogrn: "ОГРН — юридическое лицо", ogrnip: "ОГРНИП — индивидуальный предприниматель" },
    year: "Год присвоения номера",
    sign: "Признак (1-я цифра)",
    signs: { 1: "ОГРН юрлица", 5: "ОГРН юрлица", 3: "ОГРНИП индивидуального предпринимателя", 2: "другой государственный регистрационный номер", 4: "другой государственный регистрационный номер", 6: "другой государственный регистрационный номер", 7: "другой государственный регистрационный номер", 8: "другой государственный регистрационный номер", 9: "другой государственный регистрационный номер" } as Record<number, string>,
    note: "Проверяются длина и контрольные цифры по алгоритмам ФНС и СФР. Кому принадлежит номер и действует ли организация, можно узнать только в официальных сервисах (ЕГРЮЛ, «Прозрачный бизнес») — отсюда ничего не отправляется.",
  },
  en: {
    label: { inn: "INN", snils: "SNILS", ogrn: "OGRN or OGRNIP" },
    hint: { inn: "10 digits for companies, 12 for individuals", snils: "11 digits, hyphens and a space are fine", ogrn: "13 digits for companies, 15 for sole proprietors" },
    ok: { inn: "Valid INN", snils: "Valid SNILS", ogrn: "Valid number" },
    bad: { inn: "Invalid INN", snils: "Invalid SNILS", ogrn: "Invalid number" },
    errors: {
      empty: "Enter a number",
      chars: "The number contains digits only",
      length: { inn: "An INN has 10 or 12 digits", snils: "A SNILS has 11 digits", ogrn: "OGRN has 13 digits, OGRNIP 15" },
      checksum: "The check number doesn't match — probably a typo",
      checksum2: "The last (12th) check digit doesn't match",
      zero: "An all-zero number is never issued",
    },
    kind: "Type",
    legal: "Company INN",
    person: "Individual / sole proprietor INN",
    region: "Region code (first 2 digits)",
    correct: "Correct variant with these digits",
    formatted: "Formatted",
    noChecksum: "Numbers up to 001-001-998 have no check number",
    ogrnKind: { ogrn: "OGRN — legal entity", ogrnip: "OGRNIP — sole proprietor" },
    year: "Year the number was assigned",
    sign: "Sign (1st digit)",
    signs: { 1: "company OGRN", 5: "company OGRN", 3: "sole proprietor OGRNIP", 2: "other state registration number", 4: "other state registration number", 6: "other state registration number", 7: "other state registration number", 8: "other state registration number", 9: "other state registration number" } as Record<number, string>,
    note: "Length and check digits are verified using the Federal Tax Service and Social Fund algorithms. Who owns the number and whether the company is active can only be checked in official registries — nothing is sent from here.",
  },
} as const;

const SAMPLE: Record<Kind, string> = { inn: "7707083893", snils: "112-233-445 95", ogrn: "1027700132195" };

export default function RuIdValidator({ locale, kind, value }: { locale: Locale; kind: Kind; value?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value ?? SAMPLE[kind]);
  const rows: Row[] = [];
  let valid = false;
  let errors: RuError[] = [];
  let shown: string | undefined;

  if (kind === "inn") {
    const r = validateInn(text);
    valid = r.valid;
    errors = r.errors;
    if (r.kind) rows.push({ label: t.kind, value: r.kind === "legal" ? t.legal : t.person });
    if (r.region) rows.push({ label: t.region, value: r.region, mono: true });
    if (r.expected) rows.push({ label: t.correct, value: r.expected, mono: true });
    if (valid) shown = text.replace(/\D/g, "");
  } else if (kind === "snils") {
    const r = validateSnils(text);
    valid = r.valid;
    errors = r.errors;
    if (r.formatted) rows.push({ label: t.formatted, value: r.formatted, mono: true });
    if (r.expected) rows.push({ label: t.correct, value: r.expected, mono: true });
    if (valid) shown = r.formatted;
    if (r.noChecksum) rows.push({ label: "—", value: t.noChecksum });
  } else {
    const r = validateOgrn(text);
    valid = r.valid;
    errors = r.errors;
    if (r.kind) rows.push({ label: t.kind, value: t.ogrnKind[r.kind] });
    if (r.sign !== undefined) rows.push({ label: t.sign, value: `${r.sign} — ${t.signs[r.sign] ?? "—"}` });
    if (r.year) rows.push({ label: t.year, value: String(r.year) });
    if (r.region) rows.push({ label: t.region, value: r.region, mono: true });
    if (r.expected) rows.push({ label: t.correct, value: r.expected, mono: true });
    if (valid) shown = text.replace(/\D/g, "");
  }
  const empty = errors[0] === "empty";
  const messages = errors.map((e) => (e === "length" ? t.errors.length[kind] : t.errors[e]));

  return (
    <div className="flex flex-col gap-4">
      <BigInput id={`${id}-n`} label={t.label[kind]} value={text} onChange={setText} hint={t.hint[kind]} inputMode="numeric" invalid={!empty && !valid} />
      {!empty && (
        <Verdict tone={valid ? "ok" : "err"} title={valid ? t.ok[kind] : t.bad[kind]} value={shown}>
          <Problems items={messages} />
        </Verdict>
      )}
      {!empty && errors[0] !== "chars" && errors[0] !== "length" && <Details rows={rows} locale={locale} />}
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
