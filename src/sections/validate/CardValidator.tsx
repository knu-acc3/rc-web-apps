"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { validateCard, type CardError } from "./lib/card";
import { BigInput, Details, Problems, Verdict, type Row } from "./ui";

const T = {
  ru: {
    label: "Номер карты",
    hint: "Номер не отправляется и не сохраняется — проверка идёт в браузере",
    valid: "Номер корректен",
    invalid: "Номер с ошибкой",
    brand: "Платёжная система",
    unknown: "не определена",
    length: "Длина",
    lengths: "Допустимые длины",
    luhn: "Контрольная цифра (Луна)",
    luhnOk: "сходится",
    luhnBad: "не сходится",
    cvc: "Длина CVC/CVV",
    iin: "Первые 6 цифр (BIN/IIN)",
    errors: {
      empty: "Введите номер карты",
      chars: "Номер карты состоит только из цифр",
      short: "Слишком короткий номер: у карт от 12 до 19 цифр",
      long: "Слишком длинный номер: у карт не больше 19 цифр",
      length: "Для этой платёжной системы такая длина номера не используется",
      luhn: "Не проходит проверку по алгоритму Луна — вероятно, опечатка",
    } as Record<CardError, string>,
    note: "Проверяется только формат: алгоритм Луна и диапазон номеров платёжной системы. Существует ли карта, какой банк её выпустил и есть ли на ней деньги, по номеру узнать нельзя.",
    digits: "цифр",
  },
  en: {
    label: "Card number",
    hint: "The number isn't sent or stored — the check runs in your browser",
    valid: "Valid card number",
    invalid: "Invalid card number",
    brand: "Card network",
    unknown: "unknown",
    length: "Length",
    lengths: "Allowed lengths",
    luhn: "Check digit (Luhn)",
    luhnOk: "matches",
    luhnBad: "doesn't match",
    cvc: "CVC/CVV length",
    iin: "First 6 digits (BIN/IIN)",
    errors: {
      empty: "Enter a card number",
      chars: "A card number contains digits only",
      short: "Too short: cards have 12 to 19 digits",
      long: "Too long: cards have at most 19 digits",
      length: "This card network doesn't use this length",
      luhn: "Fails the Luhn check — probably a typo",
    } as Record<CardError, string>,
    note: "Only the format is checked: the Luhn algorithm and the network's number ranges. Whether the card exists, which bank issued it or its balance can't be known from the number.",
    digits: "digits",
  },
} as const;

export default function CardValidator({ locale, value = "4111 1111 1111 1111" }: { locale: Locale; value?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const r = validateCard(text);
  const empty = r.errors[0] === "empty";
  const rows: Row[] = [];
  if (!empty && r.errors[0] !== "chars") {
    rows.push({ label: t.brand, value: r.brand?.name ?? t.unknown });
    rows.push({ label: t.length, value: `${r.digits.length} ${t.digits}` });
    if (r.brand) rows.push({ label: t.lengths, value: r.brand.lengths.join(", ") });
    if (r.digits.length >= 12) rows.push({ label: t.luhn, value: r.errors.includes("luhn") ? t.luhnBad : t.luhnOk });
    if (r.brand) rows.push({ label: t.cvc, value: String(r.brand.cvcLength) });
    if (r.digits.length >= 6) rows.push({ label: t.iin, value: r.digits.slice(0, 6), mono: true });
  }
  return (
    <div className="flex flex-col gap-4">
      <BigInput id={`${id}-card`} label={t.label} value={text} onChange={setText} hint={t.hint} inputMode="numeric" invalid={!empty && !r.valid} />
      {!empty && (
        <Verdict tone={r.valid ? "ok" : "err"} title={r.valid ? `${t.valid}${r.brand ? ` · ${r.brand.name}` : ""}` : t.invalid} value={r.valid ? r.formatted : undefined}>
          <Problems items={r.errors.map((e) => t.errors[e])} />
        </Verdict>
      )}
      <Details rows={rows} locale={locale} />
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
