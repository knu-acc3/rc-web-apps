"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { validateIsbn, type IsbnError } from "./lib/isbn";
import { BigInput, Details, Problems, Verdict, type Row } from "./ui";

const T = {
  ru: {
    label: "ISBN",
    hint: "10 или 13 цифр, дефисы и префикс «ISBN» можно не убирать",
    ok: "ISBN корректен",
    bad: "ISBN с ошибкой",
    kind: "Формат",
    isbn10: "ISBN-10",
    isbn13: "ISBN-13",
    expected: "Правильная контрольная цифра даёт",
    no10: "нет (у ISBN с префиксом 979 нет 10-значной формы)",
    errors: { empty: "Введите ISBN", chars: "Допустимы цифры и X в конце ISBN-10", length: "В ISBN 10 или 13 цифр", checksum: "Контрольная цифра не сходится — вероятно, опечатка", prefix: "ISBN-13 начинается с 978 или 979; другой префикс — это EAN-13 не книги" } as Record<IsbnError, string>,
    note: "Проверяется контрольная цифра и выполняется перевод между ISBN-10 и ISBN-13. Название книги по номеру инструмент не ищет — для этого нужен запрос к каталогу.",
  },
  en: {
    label: "ISBN",
    hint: "10 or 13 digits; hyphens and an “ISBN” prefix are fine",
    ok: "Valid ISBN",
    bad: "Invalid ISBN",
    kind: "Format",
    isbn10: "ISBN-10",
    isbn13: "ISBN-13",
    expected: "The correct check digit gives",
    no10: "none (979-prefixed ISBNs have no 10-digit form)",
    errors: { empty: "Enter an ISBN", chars: "Digits only, plus X at the end of an ISBN-10", length: "An ISBN has 10 or 13 digits", checksum: "The check digit doesn't match — probably a typo", prefix: "ISBN-13 starts with 978 or 979; other prefixes are non-book EAN-13 codes" } as Record<IsbnError, string>,
    note: "The check digit is verified and ISBN-10 ↔ ISBN-13 conversion is done. The tool doesn't look up titles — that would need a catalogue request.",
  },
} as const;

export default function IsbnValidator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("978-0-306-40615-7");
  const r = validateIsbn(text);
  const empty = r.errors[0] === "empty";
  const rows: Row[] = [];
  if (r.kind) rows.push({ label: t.kind, value: r.kind === 10 ? t.isbn10 : t.isbn13 });
  if (r.valid) {
    rows.push({ label: t.isbn13, value: r.isbn13!, mono: true });
    rows.push({ label: t.isbn10, value: r.isbn10 ?? t.no10, mono: !!r.isbn10 });
  }
  if (r.expected) rows.push({ label: t.expected, value: r.expected, mono: true });
  return (
    <div className="flex flex-col gap-4">
      <BigInput id={`${id}-n`} label={t.label} value={text} onChange={setText} hint={t.hint} invalid={!empty && !r.valid} />
      {!empty && (
        <Verdict tone={r.valid ? "ok" : "err"} title={r.valid ? t.ok : t.bad} value={r.valid ? r.normalized : undefined}>
          <Problems items={r.errors.map((e) => t.errors[e])} />
        </Verdict>
      )}
      <Details rows={rows} locale={locale} />
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
