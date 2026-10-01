"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Switch } from "@/ui/field";
import { cleanText, countInvisible, type CleanOptions } from "./lib/clean";
import { InlineSelect, InputPanel, MoreOptions, OptionsBar, OutputPanel, TwoPane } from "./ui/shared";

export type CleanPreset = "default" | "line-breaks" | "spaces" | "html" | "invisible";

const T = {
  ru: {
    trimLines: "Обрезать пробелы по краям строк",
    collapseSpaces: "Убрать лишние пробелы",
    lineBreaks: "Переносы строк",
    lbKeep: "оставить",
    lbPara: "склеить строки внутри абзацев",
    lbAll: "удалить все",
    emptyLines: "Пустые строки",
    emptyKeep: "оставить",
    emptyCollapse: "не больше одной подряд",
    emptyRemove: "удалить",
    tabs: "Табуляция",
    tabsKeep: "оставить",
    tabsSpaces: "в пробелы",
    tabsRemove: "в один пробел",
    tabWidth: "Ширина табуляции",
    stripHtml: "Удалить HTML-теги",
    invisible: "Удалить невидимые символы",
    specialSpaces: "Неразрывные и узкие пробелы → обычные",
    quotes: "Кавычки",
    qKeep: "не менять",
    qStraight: "прямые \" '",
    qCurly: "английские “ ”",
    qGuil: "«ёлочки»",
    dashes: "Тире и минусы → дефис",
    yo: "Заменить ё на е",
    punctuation: "Удалить знаки препинания и спецсимволы",
    emoji: "Удалить эмодзи",
    diacritics: "Удалить диакритику (é → e; ё и й остаются)",
    invisibleFound: "Невидимых символов в исходном тексте",
    punctNote: "Буквы любых алфавитов (кириллица, казахские буквы, латиница с диакритикой, греческий…) и цифры сохраняются.",
    samples: {
      default:
        "  Этот   текст скопирован\nиз PDF-файла и разбит\nна строки.  \n\n\n\nВ нём есть лишние   пробелы,​ невидимые­ символы и\tтабуляция.\nЭмодзи 👨‍👩‍👧 должны остаться целыми.",
      "line-breaks": "Этот текст скопирован из PDF-\nфайла, поэтому каждая строка\nобрывается посередине\nпредложения.\n\nВторой абзац тоже разбит\nна несколько коротких строк.",
      spaces: "  Слишком    много   пробелов  между   словами.  Неразрывные  пробелы тоже  здесь.  \n\tСтрока с табуляцией   в начале.",
      html: '<h2>Заголовок</h2>\n<p>Абзац с <b>жирным</b> текстом и <a href="https://example.com">ссылкой</a>.</p>\n<ul><li>Первый пункт</li><li>Второй&nbsp;пункт</li></ul>\n<script>alert(1)</script>',
      invisible: "Этот​ текст­ выглядит⁠ обычным,﻿ но‎ содержит⠀ невидимые символы. Эмодзи 👨‍👩‍👧 и 🏳️‍🌈 не пострадают.",
    },
  },
  en: {
    trimLines: "Trim spaces at line edges",
    collapseSpaces: "Remove extra spaces",
    lineBreaks: "Line breaks",
    lbKeep: "keep",
    lbPara: "join lines within paragraphs",
    lbAll: "remove all",
    emptyLines: "Empty lines",
    emptyKeep: "keep",
    emptyCollapse: "at most one in a row",
    emptyRemove: "remove",
    tabs: "Tabs",
    tabsKeep: "keep",
    tabsSpaces: "to spaces",
    tabsRemove: "to a single space",
    tabWidth: "Tab width",
    stripHtml: "Strip HTML tags",
    invisible: "Remove invisible characters",
    specialSpaces: "Non-breaking and thin spaces → regular",
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
    invisibleFound: "Invisible characters in the source text",
    punctNote: "Letters of every alphabet (Latin with accents, Cyrillic, Greek…) and digits are kept.",
    samples: {
      default:
        "  This   text was copied\nfrom a PDF file and broken\ninto lines.  \n\n\n\nIt has extra   spaces,​ invisible­ characters and\ttabs.\nEmoji 👨‍👩‍👧 must stay intact.",
      "line-breaks": "This text was copied from a PDF\nfile, so every line breaks in\nthe middle of a sentence.\n\nThe second paragraph is also\nsplit into short lines.",
      spaces: "  Far    too   many  spaces   between   words.  Non-breaking  spaces are  here  too.  \n\tA line with a tab   at the start.",
      html: '<h2>Heading</h2>\n<p>A paragraph with <b>bold</b> text and a <a href="https://example.com">link</a>.</p>\n<ul><li>First item</li><li>Second&nbsp;item</li></ul>\n<script>alert(1)</script>',
      invisible: "This​ text­ looks⁠ normal,﻿ but‎ contains⠀ invisible characters. Emoji 👨‍👩‍👧 and 🏳️‍🌈 stay intact.",
    },
  },
} as const;

type Key = "trimLines" | "collapseSpaces" | "lineBreaks" | "emptyLines" | "tabs" | "stripHtml" | "invisible" | "specialSpaces" | "quotes" | "dashes" | "yo" | "emoji" | "diacritics" | "punctuation";
const ALL_KEYS: Key[] = ["trimLines", "collapseSpaces", "lineBreaks", "emptyLines", "stripHtml", "invisible", "specialSpaces", "tabs", "quotes", "dashes", "yo", "emoji", "diacritics", "punctuation"];

const PRESETS: Record<CleanPreset, { primary: Key[]; options: CleanOptions }> = {
  default: {
    primary: ["collapseSpaces", "trimLines", "emptyLines", "invisible"],
    options: { trimLines: true, collapseSpaces: true, emptyLines: "collapse", invisible: true, tabs: "keep", tabWidth: 4, lineBreaks: "keep", quotes: "keep" },
  },
  "line-breaks": {
    primary: ["lineBreaks", "emptyLines"],
    options: { trimLines: true, collapseSpaces: true, lineBreaks: "paragraphs", emptyLines: "collapse", tabs: "keep", tabWidth: 4, quotes: "keep" },
  },
  spaces: {
    primary: ["collapseSpaces", "trimLines", "specialSpaces", "tabs"],
    options: { trimLines: true, collapseSpaces: true, specialSpaces: true, tabs: "remove", tabWidth: 4, lineBreaks: "keep", emptyLines: "keep", quotes: "keep" },
  },
  html: {
    primary: ["stripHtml", "emptyLines"],
    options: { stripHtml: true, trimLines: true, collapseSpaces: true, emptyLines: "collapse", tabs: "keep", tabWidth: 4, lineBreaks: "keep", quotes: "keep" },
  },
  invisible: {
    primary: ["invisible", "specialSpaces"],
    options: { invisible: true, specialSpaces: true, tabs: "keep", tabWidth: 4, lineBreaks: "keep", emptyLines: "keep", quotes: "keep" },
  },
};

export default function TextCleaner({ locale, preset = "default" }: { locale: Locale; preset?: CleanPreset }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.samples[preset]);
  const [o, setO] = useState<CleanOptions>(PRESETS[preset].options);
  const out = useMemo(() => cleanText(text, o), [text, o]);
  const invisible = useMemo(() => countInvisible(text), [text]);
  const primary = PRESETS[preset].primary;

  const flag = (k: Key) => <Switch key={k} label={t[k as "yo"]} checked={!!o[k as "yo"]} onChange={(e) => setO((p) => ({ ...p, [k]: e.target.checked }))} />;
  const select = <K extends "lineBreaks" | "emptyLines" | "quotes" | "tabs">(k: K, options: { value: NonNullable<CleanOptions[K]>; label: string }[]) => (
    <InlineSelect key={k} id={`${id}-${k}`} label={t[k]} value={(o[k] ?? "keep") as NonNullable<CleanOptions[K]>} onChange={(v) => setO((p) => ({ ...p, [k]: v }))} options={options} />
  );
  const render = (k: Key): ReactNode => {
    switch (k) {
      case "lineBreaks":
        return select("lineBreaks", [
          { value: "keep", label: t.lbKeep },
          { value: "paragraphs", label: t.lbPara },
          { value: "all", label: t.lbAll },
        ]);
      case "emptyLines":
        return select("emptyLines", [
          { value: "keep", label: t.emptyKeep },
          { value: "collapse", label: t.emptyCollapse },
          { value: "remove", label: t.emptyRemove },
        ]);
      case "quotes":
        return select("quotes", [
          { value: "keep", label: t.qKeep },
          { value: "straight", label: t.qStraight },
          { value: "curly", label: t.qCurly },
          { value: "guillemets", label: t.qGuil },
        ]);
      case "tabs":
        return (
          <span key="tabs" className="flex flex-wrap items-center gap-3">
            {select("tabs", [
              { value: "keep", label: t.tabsKeep },
              { value: "spaces", label: t.tabsSpaces },
              { value: "remove", label: t.tabsRemove },
            ])}
            {o.tabs === "spaces" && (
              <InlineSelect
                id={`${id}-tw`}
                label={t.tabWidth}
                value={String(o.tabWidth ?? 4) as "2" | "3" | "4" | "8"}
                onChange={(v) => setO((p) => ({ ...p, tabWidth: Number(v) }))}
                options={(["2", "3", "4", "8"] as const).map((v) => ({ value: v, label: v }))}
              />
            )}
          </span>
        );
      default:
        return flag(k);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <OptionsBar>{primary.map(render)}</OptionsBar>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} />
        <OutputPanel locale={locale} value={out} filename="clean.txt" />
      </TwoPane>
      {(preset === "invisible" || invisible > 0) && (
        <p className="tabular text-sm text-fg-2">
          {t.invisibleFound}: <span className="font-semibold text-fg">{formatNumber(locale, invisible)}</span>
        </p>
      )}
      {o.punctuation && <p className="text-sm text-fg-3">{t.punctNote}</p>}
      <MoreOptions locale={locale}>{ALL_KEYS.filter((k) => !primary.includes(k)).map(render)}</MoreOptions>
    </div>
  );
}
