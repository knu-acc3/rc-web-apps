"use client";

import { UserRound } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { Panel, PanelHeader } from "@/ui/panel";
import { formatName, randomName, toLatin, type Gender, type KkPatronymic, type NameFormat, type NameLang } from "./lib/names";
import { randomInt } from "./lib/rng";

export interface NameGenProps {
  locale: Locale;
  lang?: NameLang;
  gender?: Gender | "any";
  format?: NameFormat;
  count?: number;
}

const T = {
  ru: {
    lang: "Имена",
    langs: { ru: "Русские", kk: "Казахские", en: "Английские" },
    gender: "Пол",
    genders: { any: "Любой", male: "Мужские", female: "Женские" },
    format: "Формат",
    formats: { first: "Только имя", full: "Имя и фамилия", fio: "ФИО" },
    count: "Сколько",
    kkStyle: "Отчество",
    kkStyles: { ovich: "-ович / -овна", uly: "-ұлы / -қызы" },
    latin: "Латиницей",
    generate: "Сгенерировать",
    result: "Имена",
    idle: "Нажмите «Сгенерировать»",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    lang: "Names",
    langs: { ru: "Russian", kk: "Kazakh", en: "English" },
    gender: "Gender",
    genders: { any: "Any", male: "Male", female: "Female" },
    format: "Format",
    formats: { first: "First name", full: "First + last name", fio: "With patronymic" },
    count: "How many",
    kkStyle: "Patronymic",
    kkStyles: { ovich: "-ovich / -ovna", uly: "-uly / -kyzy" },
    latin: "Latin letters",
    generate: "Generate",
    result: "Names",
    idle: "Press “Generate”",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const COUNTS = [1, 5, 10, 20, 50];

export default function NameGen({ locale, lang: lang0, gender: gender0 = "any", format: format0 = "full", count: count0 = 5 }: NameGenProps) {
  const t = T[locale];
  const [lang, setLang] = useState<NameLang>(lang0 ?? (locale === "en" ? "en" : "ru"));
  const [gender, setGender] = useState<Gender | "any">(gender0);
  const [format, setFormat] = useState<NameFormat>(format0);
  const [n, setN] = useState(count0);
  const [kkStyle, setKkStyle] = useState<KkPatronymic>("ovich");
  const [latin, setLatin] = useState(locale === "en" && lang0 !== undefined && lang0 !== "en");
  const [names, setNames] = useState<string[] | null>(null);

  const fmt = lang === "en" && format === "fio" ? "full" : format;

  function generate() {
    const out: string[] = [];
    const seen = new Set<string>();
    for (let tries = 0; out.length < n && tries < n * 30; tries++) {
      const g: Gender = gender === "any" ? (randomInt(2) === 0 ? "male" : "female") : gender;
      let s = formatName(randomName(lang, g, fmt, kkStyle));
      if (latin && lang !== "en") s = toLatin(s);
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
    setNames(out);
  }

  const seg = <K extends string>(label: string, value: K, set: (v: K) => void, options: Record<K, string>) => (
    <Field label={label}>
      <Segmented label={label} value={value} onChange={set} options={(Object.keys(options) as K[]).map((k) => ({ value: k, label: options[k] }))} />
    </Field>
  );

  const formats = lang === "en" ? { first: t.formats.first, full: t.formats.full } : t.formats;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      <Panel className="flex flex-col gap-4 p-4 sm:p-5">
        {seg(t.lang, lang, (v) => setLang(v as NameLang), t.langs)}
        {seg(t.gender, gender, (v) => setGender(v as Gender | "any"), t.genders)}
        {seg(t.format, fmt, (v) => setFormat(v as NameFormat), formats as Record<NameFormat, string>)}
        {lang === "kk" && fmt === "fio" && seg(t.kkStyle, kkStyle, (v) => setKkStyle(v as KkPatronymic), t.kkStyles)}
        <Field label={t.count}>
          <Segmented label={t.count} value={String(n)} onChange={(v) => setN(Number(v))} options={COUNTS.map((c) => ({ value: String(c), label: String(c) }))} />
        </Field>
        {lang !== "en" && <Switch label={t.latin} checked={latin} onChange={(e) => setLatin(e.target.checked)} />}
        <Button variant="filled" size="xl" onClick={generate} className="w-full">
          <UserRound aria-hidden />
          {t.generate}
        </Button>
      </Panel>

      <Panel>
        <PanelHeader title={t.result} actions={names && <CopyButton value={names.join("\n")} label={t.copy} copiedLabel={t.copied} variant="ghost" />} />
        <div className="px-4 py-4">
          {!names && <p className="py-6 text-center text-sm text-fg-3">{t.idle}</p>}
          <div aria-live="polite">
            {names &&
              (names.length === 1 ? (
                <p key={names[0]} className="py-6 text-center text-4xl font-bold break-words text-fg motion-safe:animate-[menu-in_0.3s_ease-out]">
                  {names[0]}
                </p>
              ) : (
                <ol key={names.join("|")} className="grid gap-x-6 gap-y-1.5 text-lg text-fg motion-safe:animate-[menu-in_0.3s_ease-out] sm:grid-cols-2">
                  {names.map((s, i) => (
                    <li key={s} className="flex gap-3 break-words">
                      <span className="tabular w-6 shrink-0 text-right text-sm leading-7 text-fg-3">{i + 1}.</span>
                      <span className="min-w-0">{s}</span>
                    </li>
                  ))}
                </ol>
              ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
