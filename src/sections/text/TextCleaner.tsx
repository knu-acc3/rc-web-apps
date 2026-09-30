"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Checkbox } from "@/ui/field";
import { cleanText, countInvisible, type CleanOptions } from "./lib/clean";
import { InlineSelect, InputPanel, OptionsBar, OutputPanel, TwoPane } from "./shared";

export type CleanPreset = "default" | "line-breaks" | "spaces" | "html" | "invisible" | "quotes" | "yo";

const T = {
  ru: {
    trimLines: "Обрезать пробелы по краям строк",
    collapse: "Убрать лишние пробелы",
    lineBreaks: "Переносы строк",
    lbKeep: "оставить",
    lbPara: "склеить строки внутри абзацев",
    lbAll: "удалить все",
    empty: "Пустые строки",
    emptyKeep: "оставить",
    emptyCollapse: "не больше одной подряд",
    emptyRemove: "удалить",
    tabs: "Табуляция",
    tabsKeep: "оставить",
    tabsSpaces: "в пробелы",
    tabsRemove: "в один пробел",
    tabWidth: "Ширина табуляции",
    html: "Удалить HTML-теги",
    invisible: "Удалить невидимые символы",
    special: "Неразрывные и узкие пробелы → обычные",
    quotes: "Кавычки",
    qKeep: "не менять",
    qStraight: "прямые \" '",
    qCurly: "английские “ ”",
    qGuil: "«ёлочки»",
    dashes: "Тире и минусы → дефис",
    yo: "Заменить ё на е",
    punctuation: "Удалить знаки препинания и спецсимволы",
    emoji: "Удалить эмодзи",
    diacritics: "Удалить диакритику (é → e), ё и й сохраняются",
    invisibleFound: "Невидимых символов в тексте",
    punctNote: "Буквы любых алфавитов (кириллица, казахские, латиница с диакритикой, греческий…) и цифры сохраняются.",
    sample:
      "  Этот   текст скопирован\nиз PDF-файла и разбит\nна строки.  \n\n\n\n<p>В нём есть <b>HTML-теги</b>,&nbsp;лишние пробелы​ и невидимые символы.</p>\n\t\"Кавычки\" — прямые, а эмодзи 👨‍👩‍👧 должны остаться целыми.",
  },
  en: {
    trimLines: "Trim spaces at line edges",
    collapse: "Remove extra spaces",
    lineBreaks: "Line breaks",
    lbKeep: "keep",
    lbPara: "join lines within paragraphs",
    lbAll: "remove all",
    empty: "Empty lines",
    emptyKeep: "keep",
    emptyCollapse: "at most one in a row",
    emptyRemove: "remove",
    tabs: "Tabs",
    tabsKeep: "keep",
    tabsSpaces: "to spaces",
    tabsRemove: "to a single space",
    tabWidth: "Tab width",
    html: "Strip HTML tags",
    invisible: "Remove invisible characters",
    special: "Non-breaking and thin spaces → regular",
    quotes: "Quotes",
    qKeep: "don’t change",
    qStraight: "straight \" '",
    qCurly: "curly “ ”",
    qGuil: "«guillemets»",
    dashes: "Dashes and minus signs → hyphen",
    yo: "Replace ё with е (Russian)",
    punctuation: "Remove punctuation and symbols",
    emoji: "Remove emoji",
    diacritics: "Remove accents (é → e)",
    invisibleFound: "Invisible characters in the text",
    punctNote: "Letters of every alphabet (Latin with accents, Cyrillic, Greek…) and digits are kept.",
    sample:
      "  This   text was copied\nfrom a PDF file and broken\ninto lines.  \n\n\n\n<p>It has <b>HTML tags</b>,&nbsp;extra spaces​ and invisible characters.</p>\n\t\"Quotes\" are straight, and emoji 👨‍👩‍👧 must stay intact.",
  },
} as const;

const PRESETS: Record<CleanPreset, CleanOptions> = {
  default: { trimLines: true, collapseSpaces: true, emptyLines: "collapse", invisible: true, stripHtml: false, tabs: "keep", tabWidth: 4, lineBreaks: "keep", quotes: "keep" },
  "line-breaks": { trimLines: true, collapseSpaces: true, lineBreaks: "paragraphs", emptyLines: "collapse", tabs: "keep", tabWidth: 4, quotes: "keep" },
  spaces: { trimLines: true, collapseSpaces: true, specialSpaces: true, tabs: "remove", tabWidth: 4, lineBreaks: "keep", emptyLines: "keep", quotes: "keep" },
  html: { stripHtml: true, trimLines: true, collapseSpaces: true, emptyLines: "collapse", tabs: "keep", tabWidth: 4, lineBreaks: "keep", quotes: "keep" },
  invisible: { invisible: true, specialSpaces: true, tabs: "keep", tabWidth: 4, lineBreaks: "keep", emptyLines: "keep", quotes: "keep" },
  quotes: { quotes: "straight", tabs: "keep", tabWidth: 4, lineBreaks: "keep", emptyLines: "keep" },
  yo: { yo: true, tabs: "keep", tabWidth: 4, lineBreaks: "keep", emptyLines: "keep", quotes: "keep" },
};

const YO_SAMPLE = {
  ru: "Ёлка стоит в зелёном лесу, а ещё ёж нашёл жёлудь.\nВсё, что пришлось учесть, — буква «ё» в 12 словах.",
  en: "Ёлка, ёж и жёлудь — Russian words with the letter ё.",
};

export default function TextCleaner({ locale, preset = "default" }: { locale: Locale; preset?: CleanPreset }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(preset === "yo" ? YO_SAMPLE[locale] : t.sample);
  const [o, setO] = useState<CleanOptions>(PRESETS[preset]);
  const out = useMemo(() => cleanText(text, o), [text, o]);
  const invisible = useMemo(() => countInvisible(text), [text]);
  const flag = (k: keyof CleanOptions) => (e: React.ChangeEvent<HTMLInputElement>) => setO((p) => ({ ...p, [k]: e.target.checked }));
  const pick = <K extends keyof CleanOptions>(k: K) => (v: CleanOptions[K]) => setO((p) => ({ ...p, [k]: v }));

  return (
    <div className="flex flex-col gap-4">
      <OptionsBar className="grid! gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Checkbox label={t.trimLines} checked={!!o.trimLines} onChange={flag("trimLines")} />
        <Checkbox label={t.collapse} checked={!!o.collapseSpaces} onChange={flag("collapseSpaces")} />
        <Checkbox label={t.html} checked={!!o.stripHtml} onChange={flag("stripHtml")} />
        <Checkbox label={t.invisible} checked={!!o.invisible} onChange={flag("invisible")} />
        <Checkbox label={t.special} checked={!!o.specialSpaces} onChange={flag("specialSpaces")} />
        <Checkbox label={t.dashes} checked={!!o.dashes} onChange={flag("dashes")} />
        <Checkbox label={t.yo} checked={!!o.yo} onChange={flag("yo")} />
        <Checkbox label={t.emoji} checked={!!o.emoji} onChange={flag("emoji")} />
        <Checkbox label={t.diacritics} checked={!!o.diacritics} onChange={flag("diacritics")} />
        <Checkbox label={t.punctuation} checked={!!o.punctuation} onChange={flag("punctuation")} />
        <InlineSelect
          id={`${id}-lb`}
          label={t.lineBreaks}
          value={o.lineBreaks ?? "keep"}
          onChange={pick("lineBreaks")}
          options={[
            { value: "keep", label: t.lbKeep },
            { value: "paragraphs", label: t.lbPara },
            { value: "all", label: t.lbAll },
          ]}
        />
        <InlineSelect
          id={`${id}-el`}
          label={t.empty}
          value={o.emptyLines ?? "keep"}
          onChange={pick("emptyLines")}
          options={[
            { value: "keep", label: t.emptyKeep },
            { value: "collapse", label: t.emptyCollapse },
            { value: "remove", label: t.emptyRemove },
          ]}
        />
        <InlineSelect
          id={`${id}-q`}
          label={t.quotes}
          value={o.quotes ?? "keep"}
          onChange={pick("quotes")}
          options={[
            { value: "keep", label: t.qKeep },
            { value: "straight", label: t.qStraight },
            { value: "curly", label: t.qCurly },
            { value: "guillemets", label: t.qGuil },
          ]}
        />
        <InlineSelect
          id={`${id}-tabs`}
          label={t.tabs}
          value={o.tabs ?? "keep"}
          onChange={pick("tabs")}
          options={[
            { value: "keep", label: t.tabsKeep },
            { value: "spaces", label: t.tabsSpaces },
            { value: "remove", label: t.tabsRemove },
          ]}
        />
        {o.tabs === "spaces" && (
          <InlineSelect
            id={`${id}-tw`}
            label={t.tabWidth}
            value={String(o.tabWidth ?? 4) as "2" | "4" | "8"}
            onChange={(v) => setO((p) => ({ ...p, tabWidth: Number(v) }))}
            options={(["2", "3", "4", "8"] as const).map((v) => ({ value: v, label: v }))}
          />
        )}
      </OptionsBar>
      {o.punctuation && <p className="text-sm text-fg-3">{t.punctNote}</p>}
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} />
        <OutputPanel locale={locale} value={out} filename="clean.txt" />
      </TwoPane>
      <p className="tabular text-sm text-fg-2">
        {t.invisibleFound}: {formatNumber(locale, invisible)}
      </p>
    </div>
  );
}
