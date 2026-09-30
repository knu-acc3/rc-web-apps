"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { Panel, PanelHeader, Stat } from "@/ui/panel";
import { Switch } from "@/ui/field";
import { extractHashtags } from "./lib/extract";
import { smsInfo, xWeightedLength } from "./lib/limits";
import { PLATFORM_BY_ID, type PlatformLimit } from "./lib/platforms";
import { graphemeCount, textStats, wordFrequency } from "./lib/textOps";
import { countLabel, InputPanel, TX } from "./shared";

const T = {
  ru: {
    chars: "Символы",
    noSpaces: "Без пробелов",
    words: "Слова",
    sentences: "Предложения",
    paragraphs: "Абзацы",
    lines: "Строки",
    reading: "Время чтения",
    speaking: "Время на речь",
    readingSub: "200 слов в минуту",
    speakingSub: "130 слов в минуту",
    details: "Подробно",
    letters: "Буквы",
    digits: "Цифры",
    spaces: "Пробелы и переносы",
    punct: "Знаки и символы",
    emoji: "Эмодзи",
    unique: "Уникальные слова",
    units: "Кодовые единицы UTF-16",
    bytes: "Размер в UTF-8",
    avg: "Средняя длина слова",
    top: "Частые слова",
    noStop: "Без служебных слов",
    empty: "Введите текст — статистика появится сразу.",
    of: "из",
    left: "осталось",
    over: "превышение",
    limits: "Лимиты",
    guideline: "рекомендация",
    sms: "СМС",
    encoding: "Кодировка",
    segments: "Частей СМС",
    perSegment: "Символов в части",
    nonGsm: "Символы вне GSM-7",
    gsmNote: "Латиница без эмодзи и «ёлочек» — 160 символов в одном СМС, кириллица — 70.",
    weighted: "Взвешенная длина",
    urls: "Ссылок (каждая = 23)",
    bytesUnit: "байт",
    less: "меньше секунды",
    sec: "с",
    min: "мин",
    hr: "ч",
    hashtags: ["хештег", "хештега", "хештегов"],
  },
  en: {
    chars: "Characters",
    noSpaces: "No spaces",
    words: "Words",
    sentences: "Sentences",
    paragraphs: "Paragraphs",
    lines: "Lines",
    reading: "Reading time",
    speaking: "Speaking time",
    readingSub: "200 words per minute",
    speakingSub: "130 words per minute",
    details: "Details",
    letters: "Letters",
    digits: "Digits",
    spaces: "Spaces and line breaks",
    punct: "Punctuation and symbols",
    emoji: "Emoji",
    unique: "Unique words",
    units: "UTF-16 code units",
    bytes: "UTF-8 size",
    avg: "Average word length",
    top: "Top words",
    noStop: "Hide stop words",
    empty: "Type or paste text — the statistics update instantly.",
    of: "of",
    left: "left",
    over: "over",
    limits: "Limits",
    guideline: "guideline",
    sms: "SMS",
    encoding: "Encoding",
    segments: "SMS parts",
    perSegment: "Characters per part",
    nonGsm: "Characters outside GSM-7",
    gsmNote: "Plain Latin text fits 160 characters in one SMS; Cyrillic or emoji switch to UCS-2 with 70.",
    weighted: "Weighted length",
    urls: "Links (23 each)",
    bytesUnit: "bytes",
    less: "under a second",
    sec: "s",
    min: "min",
    hr: "h",
    hashtags: ["hashtag", "hashtags"],
  },
} as const;

function duration(locale: Locale, seconds: number): string {
  const t = T[locale];
  if (seconds <= 0) return "0";
  if (seconds < 1) return t.less;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const parts: string[] = [];
  if (h) parts.push(`${h} ${t.hr}`);
  if (m) parts.push(`${m} ${t.min}`);
  if (s && !h) parts.push(`${s} ${t.sec}`);
  return parts.join(" ") || `0 ${t.sec}`;
}

export interface WordCounterProps {
  locale: Locale;
  /** Platform id from lib/platforms (x-twitter, sms, instagram-caption…). */
  platform?: string;
  initialText?: string;
}

export default function WordCounter({ locale, platform, initialText = "" }: WordCounterProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(initialText);
  const [noStop, setNoStop] = useState(true);
  const deferred = useDeferredValue(text);
  const lang = locale === "ru" ? "ru" : "en";
  const stats = useMemo(() => textStats(deferred, lang), [deferred, lang]);
  const top = useMemo(() => wordFrequency(deferred, { locale: lang, excludeStopWords: noStop, minLength: 2 }).rows.slice(0, 10), [deferred, noStop, lang]);
  const p = platform ? PLATFORM_BY_ID.get(platform) : undefined;

  const main: [string, string, string?][] = [
    [t.chars, formatNumber(locale, stats.chars)],
    [t.noSpaces, formatNumber(locale, stats.charsNoSpaces)],
    [t.words, formatNumber(locale, stats.words)],
    [t.sentences, formatNumber(locale, stats.sentences)],
    [t.paragraphs, formatNumber(locale, stats.paragraphs)],
    [t.lines, formatNumber(locale, stats.lines)],
    [t.reading, duration(locale, stats.readingSeconds), t.readingSub],
    [t.speaking, duration(locale, stats.speakingSeconds), t.speakingSub],
  ];

  return (
    <div className="flex flex-col gap-4">
      <InputPanel id={`${id}-text`} locale={locale} value={text} onChange={setText} rows={9} />

      {p && platform === "sms" && <SmsPanel locale={locale} text={deferred} />}
      {p && platform === "x-twitter" && <XPanel locale={locale} text={deferred} />}
      {p && platform !== "sms" && platform !== "x-twitter" && (
        <Panel>
          <PanelHeader title={`${t.limits}: ${p.name[locale]}`} />
          <ul className="flex flex-col divide-y divide-line">
            {p.limits.map((l) => (
              <LimitRow key={l.key} locale={locale} limit={l} text={deferred} />
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {main.map(([label, value, sub]) => (
          <Stat key={label} label={label} value={value} sub={sub} size="md" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel>
          <PanelHeader title={t.details} />
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 px-4 py-3 text-sm">
            {(
              [
                [t.letters, stats.letters],
                [t.digits, stats.digits],
                [t.spaces, stats.spaces],
                [t.punct, stats.punctuation],
                [t.emoji, stats.emoji],
                [t.unique, stats.uniqueWords],
                [t.units, stats.codeUnits],
              ] as [string, number][]
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-fg-2">{k}</dt>
                <dd className="tabular text-right font-medium text-fg">{formatNumber(locale, v)}</dd>
              </div>
            ))}
            <dt className="text-fg-2">{t.bytes}</dt>
            <dd className="tabular text-right font-medium text-fg">
              {formatNumber(locale, stats.bytesUtf8)} {t.bytesUnit}
            </dd>
            <dt className="text-fg-2">{t.avg}</dt>
            <dd className="tabular text-right font-medium text-fg">{formatNumber(locale, stats.avgWordLength, { maximumFractionDigits: 1 })}</dd>
          </dl>
        </Panel>
        <Panel>
          <PanelHeader title={t.top} actions={<Switch label={t.noStop} checked={noStop} onChange={(e) => setNoStop(e.target.checked)} className="text-sm" />} />
          {top.length === 0 ? (
            <p className="px-4 py-3 text-sm text-fg-3">{t.empty}</p>
          ) : (
            <ol className="flex flex-col gap-1.5 px-4 py-3 text-sm">
              {top.map((r) => (
                <li key={r.word} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-fg">{r.word}</span>
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(4, (r.count / top[0].count) * 100)}%` }} />
                  </span>
                  <span className="tabular w-10 text-right text-fg-2">{formatNumber(locale, r.count)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Meter({ value, max, soft, min }: { value: number; max: number; soft?: boolean; min?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const over = value > max;
  const tone = over ? (soft ? "bg-warn" : "bg-err") : min !== undefined && value > 0 && value < min ? "bg-warn" : pct > 90 ? "bg-warn" : "bg-ok";
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
      <span className={cn("block h-full rounded-full transition-[width] duration-150", tone)} style={{ width: `${pct}%` }} />
    </span>
  );
}

function LimitRow({ locale, limit, text }: { locale: Locale; limit: PlatformLimit; text: string }) {
  const t = T[locale];
  const value = limit.method === "hashtags" ? extractHashtags(text).length : limit.method === "codeUnits" ? text.length : graphemeCount(text);
  const left = limit.max - value;
  const unit = limit.method === "hashtags" ? T[locale].hashtags : TX[locale].chars;
  return (
    <li className="flex flex-col gap-1.5 px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-fg">
          {limit.label[locale]}
          {limit.soft && <span className="ml-1.5 text-fg-3">({t.guideline})</span>}
        </span>
        <span className={cn("tabular", left < 0 ? (limit.soft ? "text-warn" : "text-err") : "text-fg-2")}>
          {formatNumber(locale, value)} {t.of} {formatNumber(locale, limit.max)}
          {" · "}
          {left >= 0 ? `${t.left} ${countLabel(locale, left, unit)}` : `${t.over} ${countLabel(locale, -left, unit)}`}
        </span>
      </div>
      <Meter value={value} max={limit.max} soft={limit.soft} min={limit.min} />
    </li>
  );
}

function SmsPanel({ locale, text }: { locale: Locale; text: string }) {
  const t = T[locale];
  const info = smsInfo(text);
  const unitForms = TX[locale].chars;
  return (
    <Panel>
      <PanelHeader title={t.sms} />
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        <Stat label={t.encoding} value={info.encoding} size="md" />
        <Stat label={t.segments} value={formatNumber(locale, info.segments)} size="md" />
        <Stat label={t.perSegment} value={formatNumber(locale, info.perSegment)} size="md" sub={`${info.encoding === "GSM-7" ? "160 / 153" : "70 / 67"}`} />
        <Stat label={t.left} value={formatNumber(locale, info.remaining)} size="md" sub={plural(locale, info.remaining, unitForms)} />
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4 text-sm text-fg-2">
        <p>{t.gsmNote}</p>
        {info.nonGsm.length > 0 && (
          <p>
            {t.nonGsm}:{" "}
            {info.nonGsm.map((c) => (
              <code key={c} className="mx-0.5 rounded bg-surface-2 px-1.5 py-0.5 text-fg">
                {c === " " ? "␣" : c}
              </code>
            ))}
          </p>
        )}
      </div>
    </Panel>
  );
}

function XPanel({ locale, text }: { locale: Locale; text: string }) {
  const t = T[locale];
  const x = xWeightedLength(text);
  return (
    <Panel>
      <PanelHeader title="X (Twitter)" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="font-medium text-fg">{t.weighted}</span>
          <span className={cn("tabular", x.remaining < 0 ? "text-err" : "text-fg-2")}>
            {formatNumber(locale, x.weighted)} {t.of} 280 · {x.remaining >= 0 ? `${t.left} ${formatNumber(locale, x.remaining)}` : `${t.over} ${formatNumber(locale, -x.remaining)}`}
          </span>
        </div>
        <Meter value={x.weighted} max={280} />
        <p className="text-sm text-fg-2">
          {t.urls}: {formatNumber(locale, x.urls)}
        </p>
      </div>
    </Panel>
  );
}
