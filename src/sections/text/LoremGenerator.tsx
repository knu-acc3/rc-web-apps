"use client";

import { Download, RefreshCw } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { downloadText } from "@/lib/clipboard";
import { Button, buttonClass } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Checkbox, Input } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { textStats } from "./lib/textOps";
import { generateLorem, loremToHtml, loremToText, randomSeed, type LoremLang, type LoremUnit } from "./lib/lorem";
import { countLabel, OptionsBar, TX } from "./shared";

const T = {
  ru: {
    lang: "Текст",
    latin: "Lorem ipsum (латынь)",
    russian: "Рыба на русском",
    cyrillic: "Лорем ипсум (кириллица)",
    english: "На английском",
    unit: "Единица",
    paragraphs: "Абзацы",
    sentences: "Предложения",
    words: "Слова",
    list: "Список",
    count: "Количество",
    html: "HTML-теги",
    classic: "Начать с «Lorem ipsum dolor sit amet…»",
    numbered: "Нумерованный список",
    again: "Сгенерировать заново",
    result: "Сгенерированный текст",
  },
  en: {
    lang: "Text",
    latin: "Lorem ipsum (Latin)",
    russian: "Russian placeholder",
    cyrillic: "Cyrillic lorem ipsum",
    english: "English",
    unit: "Unit",
    paragraphs: "Paragraphs",
    sentences: "Sentences",
    words: "Words",
    list: "List",
    count: "Count",
    html: "HTML tags",
    classic: "Start with “Lorem ipsum dolor sit amet…”",
    numbered: "Numbered list",
    again: "Generate again",
    result: "Generated text",
  },
} as const;

/** Fixed seed: the server renders real text and the client hydrates the same text. */
const SSR_SEED = 20250101;
const MAX: Record<LoremUnit, number> = { paragraphs: 100, sentences: 500, words: 10000, list: 200 };

export interface LoremGeneratorProps {
  locale: Locale;
  lang?: LoremLang;
  unit?: LoremUnit;
  count?: number;
  html?: boolean;
}

export default function LoremGenerator({ locale, lang: lang0 = "latin", unit: unit0 = "paragraphs", count: count0 = 3, html: html0 = false }: LoremGeneratorProps) {
  const t = T[locale];
  const id = useId();
  const [lang, setLang] = useState<LoremLang>(lang0);
  const [unit, setUnit] = useState<LoremUnit>(unit0);
  const [countText, setCountText] = useState(String(count0));
  const [html, setHtml] = useState(html0);
  const [classic, setClassic] = useState(true);
  const [numbered, setNumbered] = useState(false);
  const [seed, setSeed] = useState(SSR_SEED);

  const parsed = Math.floor(Number(countText.replace(/\s/g, "")));
  const count = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX[unit]) : 1;
  const blocks = useMemo(() => generateLorem({ lang, unit, count, seed, classicStart: classic }), [lang, unit, count, seed, classic]);
  const listStyle = numbered ? "numbers" : "bullets";
  const text = html ? loremToHtml(blocks, unit, listStyle) : loremToText(blocks, unit, listStyle);
  const stats = useMemo(() => textStats(loremToText(blocks, unit, listStyle), lang === "english" || lang === "latin" ? "en" : "ru"), [blocks, unit, listStyle, lang]);

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        label={t.lang}
        value={lang}
        onChange={setLang}
        wrap
        options={(["latin", "russian", "cyrillic", "english"] as const).map((v) => ({ value: v, label: t[v] }))}
      />
      <OptionsBar>
        <Segmented
          label={t.unit}
          value={unit}
          onChange={(u) => {
            setUnit(u);
            setCountText(String(u === "words" ? 100 : u === "sentences" ? 5 : u === "list" ? 7 : 3));
          }}
          size="sm"
          options={(["paragraphs", "sentences", "words", "list"] as const).map((v) => ({ value: v, label: t[v] }))}
        />
        <label className="flex items-center gap-2">
          <span className="text-fg-2">{t.count}</span>
          <Input id={`${id}-n`} inputMode="numeric" value={countText} onChange={(e) => setCountText(e.target.value)} size="sm" autoComplete="off" className="w-20" />
        </label>
        <Checkbox label={t.html} checked={html} onChange={(e) => setHtml(e.target.checked)} />
        {(lang === "latin" || lang === "cyrillic") && unit !== "list" && <Checkbox label={t.classic} checked={classic} onChange={(e) => setClassic(e.target.checked)} />}
        {unit === "list" && <Checkbox label={t.numbered} checked={numbered} onChange={(e) => setNumbered(e.target.checked)} />}
        <Button variant="ghost" size="sm" onClick={() => setSeed(randomSeed())}>
          <RefreshCw aria-hidden />
          {t.again}
        </Button>
      </OptionsBar>
      <Panel>
        <PanelHeader
          title={`${t.result} · ${countLabel(locale, stats.words, TX[locale].words)}, ${countLabel(locale, stats.chars, TX[locale].chars)}`}
          actions={
            <>
              <button type="button" className={buttonClass("ghost", "sm")} onClick={() => downloadText(text, html ? "lorem.html" : "lorem.txt")}>
                <Download aria-hidden />
                <span className="hidden sm:inline">{TX[locale].download}</span>
              </button>
              <CopyButton value={text} label={TX[locale].copy} copiedLabel={TX[locale].copied} variant="primary" />
            </>
          }
        />
        {html ? (
          <pre className="max-h-[32rem] overflow-auto px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-fg">{text}</pre>
        ) : (
          <div className="max-h-[32rem] overflow-auto px-4 py-3 text-[15px] leading-relaxed text-fg" lang={lang === "english" || lang === "latin" ? (lang === "latin" ? "la" : "en") : "ru"}>
            {unit === "list" ? (
              numbered ? (
                <ol className="list-decimal pl-6">{blocks.map((b, i) => <li key={i}>{b}</li>)}</ol>
              ) : (
                <ul className="list-disc pl-6">{blocks.map((b, i) => <li key={i}>{b}</li>)}</ul>
              )
            ) : (
              blocks.map((b, i) => (
                <p key={i} className="mb-3 last:mb-0">
                  {b}
                </p>
              ))
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
