"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Switch } from "@/ui/field";
import { EXTRACT_KINDS, extractPhones, extractSync, uniqueList, type ExtractKind, type PhoneFormat } from "./lib/extract";
import { InlineSelect, InputPanel, MoreOptions, OptionsBar, OutputPanel, TwoPane } from "./ui/shared";
import { ChipChoice } from "@/ui/chip-choice";

const T = {
  ru: {
    kind: "Что извлечь",
    emails: "E-mail адреса",
    urls: "Ссылки (URL)",
    phones: "Номера телефонов",
    numbers: "Числа",
    hashtags: "Хештеги",
    mentions: "Упоминания @",
    dates: "Даты",
    unique: "Без повторов",
    sort: "Сортировать",
    sep: "Разделитель",
    sepNl: "новая строка",
    sepComma: "запятая",
    sepSemi: "точка с запятой",
    sepSpace: "пробел",
    bare: "Адреса без http:// (example.kz)",
    country: "Страна по умолчанию",
    format: "Формат номера",
    fIntl: "+7 701 123 4567",
    fE164: "+77011234567",
    fNational: "национальный",
    found: "Найдено",
    loading: "Загрузка базы номеров…",
    sample:
      "Пишите на info@example.kz или sales@пример.рф, копия — @manager (не путать с user@mail.ru).\nСайт: https://example.kz/contacts?utm=1, зеркало www.example.com и example.org/help.\nТелефоны: +7 (701) 123-45-67, 8 (727) 355-00-00, +7 495 123-45-67. Не телефоны: 12.03.2024, 192.168.1.1, 2024-01-15.\nЦена 1 250 000 ₸, скидка 15,5 %, оборот 1,000,000 $. #скидки #Алматы2025 встреча 5 марта 2025 года.",
  },
  en: {
    kind: "Extract",
    emails: "Email addresses",
    urls: "Links (URLs)",
    phones: "Phone numbers",
    numbers: "Numbers",
    hashtags: "Hashtags",
    mentions: "@mentions",
    dates: "Dates",
    unique: "Unique only",
    sort: "Sort",
    sep: "Separator",
    sepNl: "new line",
    sepComma: "comma",
    sepSemi: "semicolon",
    sepSpace: "space",
    bare: "Addresses without http:// (example.com)",
    country: "Default country",
    format: "Number format",
    fIntl: "+1 650 253 0000",
    fE164: "+16502530000",
    fNational: "national",
    found: "Found",
    loading: "Loading phone metadata…",
    sample:
      "Write to info@example.com or sales@example.co.uk, cc @manager (not the same as user@mail.com).\nSite: https://example.com/contacts?utm=1, mirror www.example.org and example.net/help.\nPhones: +1 650-253-0000, +44 20 7946 0958, +7 701 123 4567. Not phones: 12/03/2024, 192.168.1.1, 2024-01-15.\nPrice $1,250,000, discount 15.5%, revenue 1 000 000. #sale #NewYork2025 meeting on March 5, 2025.",
  },
} as const;

const COUNTRIES = ["KZ", "RU", "UZ", "KG", "BY", "UA", "US", "GB", "DE", "TR"] as const;
type Sep = "nl" | "comma" | "semi" | "space";
const SEP: Record<Sep, string> = { nl: "\n", comma: ", ", semi: "; ", space: " " };
type PhoneLib = typeof import("libphonenumber-js/max");

export default function Extractor({ locale, kind: kind0 = "emails" }: { locale: Locale; kind?: ExtractKind }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample);
  const [kind, setKind] = useState<ExtractKind>(kind0);
  const [unique, setUnique] = useState(true);
  const [sort, setSort] = useState(false);
  const [sep, setSep] = useState<Sep>("nl");
  const [bare, setBare] = useState(true);
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>(locale === "ru" ? "KZ" : "US");
  const [format, setFormat] = useState<PhoneFormat>("international");
  const [lib, setLib] = useState<PhoneLib | null>(null);

  // libphonenumber-js metadata is ~150 KB: load it only when phone extraction is used.
  useEffect(() => {
    if (kind !== "phones" || lib) return;
    let alive = true;
    import("libphonenumber-js/max").then((m) => {
      if (alive) setLib(m);
    });
    return () => {
      alive = false;
    };
  }, [kind, lib]);

  const items = useMemo(() => {
    let list: string[];
    if (kind === "phones") list = lib ? extractPhones(text, lib, country, format) : [];
    else list = extractSync(kind, text, { bareDomains: bare });
    if (unique) list = uniqueList(list, kind !== "numbers");
    if (sort) list = [...list].sort(new Intl.Collator(locale, { numeric: true }).compare);
    return list;
  }, [kind, lib, text, country, format, bare, unique, sort, locale]);

  const waiting = kind === "phones" && !lib;
  return (
    <div className="flex flex-col gap-4">
      <ChipChoice label={t.kind} value={kind} onChange={setKind} grid="grid-cols-2 sm:grid-cols-4 xl:grid-cols-7" options={EXTRACT_KINDS.map((k) => ({ value: k, label: t[k] }))} />
      <OptionsBar>
        <Switch label={t.unique} checked={unique} onChange={(e) => setUnique(e.target.checked)} />
        <Switch label={t.sort} checked={sort} onChange={(e) => setSort(e.target.checked)} />
      </OptionsBar>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} />
        <OutputPanel
          locale={locale}
          value={items.join(SEP[sep])}
          title={waiting ? t.loading : `${t.found}: ${formatNumber(locale, items.length)}`}
          filename={`${kind}.txt`}
        />
      </TwoPane>
      <MoreOptions locale={locale}>
        <InlineSelect
          id={`${id}-sep`}
          label={t.sep}
          value={sep}
          onChange={setSep}
          options={[
            { value: "nl", label: t.sepNl },
            { value: "comma", label: t.sepComma },
            { value: "semi", label: t.sepSemi },
            { value: "space", label: t.sepSpace },
          ]}
        />
        {kind === "urls" && <Switch label={t.bare} checked={bare} onChange={(e) => setBare(e.target.checked)} />}
        {kind === "phones" && (
          <>
            <InlineSelect id={`${id}-cc`} label={t.country} value={country} onChange={setCountry} options={COUNTRIES.map((c) => ({ value: c, label: c }))} />
            <InlineSelect
              id={`${id}-fmt`}
              label={t.format}
              value={format}
              onChange={setFormat}
              options={[
                { value: "international", label: t.fIntl },
                { value: "e164", label: t.fE164 },
                { value: "national", label: t.fNational },
              ]}
            />
          </>
        )}
      </MoreOptions>
    </div>
  );
}
