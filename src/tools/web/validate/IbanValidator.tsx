"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { IBAN_BY_CODE } from "./data/iban-countries";
import { validateIban, type IbanError } from "./lib/iban";
import { BigInput, Details, Problems, Verdict, type Row } from "./ui/kit";

const T = {
  ru: {
    label: "IBAN",
    hint: "Пробелы и регистр не важны",
    valid: "IBAN корректен",
    invalid: "IBAN с ошибкой",
    country: "Страна",
    length: "Длина",
    bank: "Код банка",
    branch: "Код отделения",
    account: "Номер счёта (остаток BBAN)",
    check: "Контрольные цифры",
    electronic: "Электронная запись",
    chars: (n: number) => `${n} симв.`,
    errors: {
      empty: "Введите IBAN",
      chars: "Допустимы только латинские буквы и цифры",
      country: "Первые две буквы — не код страны, использующей IBAN",
      length: "Неверная длина для этой страны",
      structure: "Буквы или цифры стоят не на своих местах для формата этой страны",
      checksum: "Контрольная сумма не сходится — вероятно, опечатка",
    } as Record<IbanError, string>,
    expected: (d: string) => `При таком номере счёта контрольные цифры должны быть ${d}. Проверьте, в каком символе опечатка.`,
    note: "Проверяется формат и контрольная сумма ISO 13616. Существование счёта и название банка проверить без запроса в банк нельзя.",
    ruNote: "Россия есть в реестре IBAN с 2023 года: 33 символа — RU, контрольные цифры, БИК банка и 20-значный номер счёта. Но российские банки IBAN клиентам почти не выдают: для перевода в Россию обычно указывают БИК, корреспондентский счёт и номер счёта, а из-за рубежа ещё и SWIFT-код банка.",
  },
  en: {
    label: "IBAN",
    hint: "Spaces and letter case don't matter",
    valid: "Valid IBAN",
    invalid: "Invalid IBAN",
    country: "Country",
    length: "Length",
    bank: "Bank code",
    branch: "Branch code",
    account: "Account number (rest of BBAN)",
    check: "Check digits",
    electronic: "Electronic format",
    chars: (n: number) => `${n} chars`,
    errors: {
      empty: "Enter an IBAN",
      chars: "Only Latin letters and digits are allowed",
      country: "The first two letters aren't a country that uses IBAN",
      length: "Wrong length for this country",
      structure: "Letters or digits are in the wrong places for this country's format",
      checksum: "The checksum doesn't match — probably a typo",
    } as Record<IbanError, string>,
    expected: (d: string) => `For this account number the check digits would be ${d}. Look for the mistyped character.`,
    note: "The format and ISO 13616 checksum are checked. Whether the account exists or which bank holds it can't be checked without asking the bank.",
    ruNote: "Russia has been in the IBAN registry since 2023: 33 characters — RU, check digits, the bank's BIK and the 20-digit account number. Russian banks rarely give customers an IBAN, though: payments to Russia usually need the BIK, the correspondent account and the account number, plus the bank's SWIFT code from abroad.",
  },
} as const;

export default function IbanValidator({ locale, country, value }: { locale: Locale; country?: string; value?: string }) {
  const t = T[locale];
  const id = useId();
  const sample = value ?? (country ? IBAN_BY_CODE.get(country)?.example.replace(/(.{4})(?=.)/g, "$1 ") : "KZ86 125K ZT50 0410 0100") ?? "";
  const [text, setText] = useState(sample);
  const r = validateIban(text);
  const c = r.country;
  const name = c ? (locale === "ru" ? c.ru : c.en) : "";

  const rows: Row[] = [];
  if (c) {
    rows.push({ label: t.country, value: `${name} (${c.code})` });
    rows.push({ label: t.length, value: `${t.chars(r.iban.length)} / ${t.chars(c.length)}` });
    if (r.bank) rows.push({ label: t.bank, value: r.bank, mono: true });
    if (r.branch) rows.push({ label: t.branch, value: r.branch, mono: true });
    if (r.account) rows.push({ label: t.account, value: r.account, mono: true });
    rows.push({ label: t.check, value: r.iban.slice(2, 4), mono: true });
    if (r.valid) rows.push({ label: t.electronic, value: r.iban, mono: true });
  }

  const empty = r.errors[0] === "empty";
  return (
    <div className="flex flex-col gap-4">
      <BigInput id={`${id}-iban`} label={t.label} value={text} onChange={setText} placeholder={sample} hint={t.hint} invalid={!empty && !r.valid} />
      {!empty && (
        <Verdict tone={r.valid ? "ok" : "err"} title={r.valid ? `${t.valid}${name ? ` · ${name}` : ""}` : t.invalid} value={r.valid ? r.formatted : undefined}>
          <Problems items={r.errors.map((e) => t.errors[e])} />
          {r.expectedCheck && r.errors.length === 1 && <p>{t.expected(r.expectedCheck)}</p>}
        </Verdict>
      )}
      <Details rows={rows} locale={locale} />
      {c?.code === "RU" && <p className="rounded-[0.75rem] bg-warn-soft px-4 py-3 text-sm text-warn">{t.ruNote}</p>}
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
