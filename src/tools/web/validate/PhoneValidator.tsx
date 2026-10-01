"use client";

import type { CountryCode } from "libphonenumber-js/max";
import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Select } from "@/ui/field";
import { analyzePhone, type PhoneLib } from "./lib/phone";
import { BigInput, Details, Problems, Verdict, type Row } from "./ui/kit";

const T = {
  ru: {
    number: "Номер телефона",
    country: "Страна по умолчанию",
    countryHint: "Для номеров без +код страны",
    loading: "Загружаем правила нумерации…",
    valid: "Номер корректен",
    possible: "Номер возможен, но не соответствует текущим правилам нумерации",
    invalid: "Номер с ошибкой",
    other: (c: string, want: string) => `Это номер страны «${c}», а не «${want}»`,
    type: "Тип",
    countryOf: "Страна номера",
    e164: "E.164 (для баз данных и API)",
    intl: "Международный формат",
    national: "Национальный формат",
    uri: "Ссылка tel:",
    code: "Код страны",
    types: { MOBILE: "мобильный", FIXED_LINE: "стационарный", FIXED_LINE_OR_MOBILE: "стационарный или мобильный", TOLL_FREE: "бесплатный (8-800)", PREMIUM_RATE: "платный", SHARED_COST: "с разделённой оплатой", VOIP: "IP-телефония", PERSONAL_NUMBER: "персональный", PAGER: "пейджер", UAN: "единый номер организации", VOICEMAIL: "голосовая почта" } as Record<string, string>,
    len: { TOO_SHORT: "Слишком мало цифр", TOO_LONG: "Слишком много цифр", INVALID_LENGTH: "Неверное число цифр", INVALID_COUNTRY: "Не удалось определить страну — добавьте код, например +7", NOT_A_NUMBER: "Это не похоже на номер телефона" } as Record<string, string>,
    note: "Проверка идёт по открытой базе правил нумерации Google libphonenumber прямо в браузере: номер никуда не отправляется. Существует ли номер и кому он принадлежит, так узнать нельзя.",
  },
  en: {
    number: "Phone number",
    country: "Default country",
    countryHint: "For numbers without a +country code",
    loading: "Loading numbering rules…",
    valid: "Valid number",
    possible: "Possible number, but it doesn't match current numbering rules",
    invalid: "Invalid number",
    other: (c: string, want: string) => `This number belongs to ${c}, not ${want}`,
    type: "Type",
    countryOf: "Number's country",
    e164: "E.164 (for databases and APIs)",
    intl: "International format",
    national: "National format",
    uri: "tel: link",
    code: "Country code",
    types: { MOBILE: "mobile", FIXED_LINE: "fixed line", FIXED_LINE_OR_MOBILE: "fixed line or mobile", TOLL_FREE: "toll-free", PREMIUM_RATE: "premium rate", SHARED_COST: "shared cost", VOIP: "VoIP", PERSONAL_NUMBER: "personal number", PAGER: "pager", UAN: "universal access number", VOICEMAIL: "voicemail" } as Record<string, string>,
    len: { TOO_SHORT: "Too few digits", TOO_LONG: "Too many digits", INVALID_LENGTH: "Wrong number of digits", INVALID_COUNTRY: "Can't tell the country — add a code like +1", NOT_A_NUMBER: "This doesn't look like a phone number" } as Record<string, string>,
    note: "Checked against Google's open libphonenumber numbering rules right in your browser; the number isn't sent anywhere. Whether the number exists or who owns it can't be known this way.",
  },
} as const;

export default function PhoneValidator({ locale, country = "KZ", value, countries: all }: { locale: Locale; country?: string; value?: string; countries: Record<Locale, [code: string, name: string][]> }) {
  const t = T[locale];
  const countries = all[locale];
  const id = useId();
  const [text, setText] = useState(value ?? "");
  const [cc, setCc] = useState(country);
  const [lib, setLib] = useState<PhoneLib | null>(null);

  useEffect(() => {
    let alive = true;
    import("libphonenumber-js/max").then((m) => {
      if (alive) setLib(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Names come from the server (deterministic for hydration); others are resolved on demand.
  const names = useMemo(() => {
    const known = new Map(countries);
    let dn: Intl.DisplayNames | null = null;
    return (c: string) => {
      const k = known.get(c);
      if (k) return k;
      dn ??= new Intl.DisplayNames([locale === "ru" ? "ru" : "en"], { type: "region" });
      return dn.of(c) ?? c;
    };
  }, [countries, locale]);

  const r = lib && text.trim() ? analyzePhone(lib, text, cc as CountryCode, country as CountryCode) : null;
  const rows: Row[] = [];
  if (r?.parsed) {
    if (r.country) rows.push({ label: t.countryOf, value: `${names(r.country)} (${r.country})` });
    rows.push({ label: t.code, value: `+${r.callingCode}` });
    if (r.type) rows.push({ label: t.type, value: t.types[r.type] ?? r.type });
    rows.push({ label: t.e164, value: r.e164!, mono: true });
    rows.push({ label: t.intl, value: r.international!, mono: true });
    rows.push({ label: t.national, value: r.national!, mono: true });
    rows.push({ label: t.uri, value: r.uri!, mono: true });
  }
  const tone = !r ? "idle" : r.otherCountry ? "warn" : r.valid ? "ok" : r.possible ? "warn" : "err";
  const title = !r ? t.loading : r.otherCountry ? t.other(names(r.country!), names(country)) : r.valid ? t.valid : r.possible ? t.possible : t.invalid;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
        <BigInput id={`${id}-n`} label={t.number} value={text} onChange={setText} inputMode="tel" placeholder={cc === "KZ" ? "+7 701 234 56 78" : cc === "RU" ? "+7 912 345 67 89" : "+1 201 555 0123"} invalid={!!r && !r.valid} />
        <Field label={t.country} htmlFor={`${id}-c`} hint={t.countryHint}>
          <Select id={`${id}-c`} value={cc} onChange={(e) => setCc(e.target.value)} size="lg">
            {countries.map(([c, n]) => (
              <option key={c} value={c}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {(text.trim() || !lib) && (
        <Verdict tone={tone} title={title} value={r?.valid ? r.international : undefined}>
          {r && !r.valid && r.lengthIssue && <Problems items={[t.len[r.lengthIssue] ?? r.lengthIssue]} />}
        </Verdict>
      )}
      <Details rows={rows} locale={locale} />
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
