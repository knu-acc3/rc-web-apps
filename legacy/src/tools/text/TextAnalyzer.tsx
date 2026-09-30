'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Copy, DownloadSimple, X } from '@phosphor-icons/react';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { ToolPrimaryAction } from '@/src/components/tool/workspace';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { downloadBlob } from '@/src/utils/exportHelpers';

const STOP_WORDS_EN = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'it', 'its', 'this', 'that', 'these', 'those', 'you', 'your', 'we',
  'our', 'they', 'their', 'he', 'she', 'his', 'her', 'not', 'as', 'if', 'than', 'then', 'what',
]);

const STOP_WORDS_RU = new Set([
  'и', 'в', 'во', 'на', 'с', 'со', 'к', 'по', 'за', 'из', 'до', 'от', 'не', 'но', 'а', 'то', 'что',
  'это', 'как', 'он', 'она', 'они', 'мы', 'вы', 'я', 'его', 'её', 'их', 'был', 'была', 'было', 'были',
  'есть', 'быть', 'же', 'уже', 'ещё', 'для', 'при', 'без', 'под', 'над', 'о', 'об', 'бы', 'ли', 'ни',
]);

type Analysis = {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  uniqueWords: number;
  readingSeconds: number;
  speakingSeconds: number;
  estimatedTokens: number;
  averageWordLength: number;
  averageSentenceLength: number;
  readability: number | null;
  isCyrillic: boolean;
  frequency: Array<[string, number]>;
};

function countSyllables(word: string, cyrillic: boolean) {
  const normalized = word.toLocaleLowerCase();
  if (cyrillic) return normalized.match(/[аеёиоуыэюя]/g)?.length ?? 1;
  const latin = normalized.replace(/[^a-z]/g, '').replace(/e$/, '');
  return latin.match(/[aeiouy]+/g)?.length ?? 1;
}

function analyzeText(text: string, isEn: boolean): Analysis {
  const trimmed = text.trim();
  const words = trimmed.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? [];
  const normalizedWords = words.map((word) => word.toLocaleLowerCase(isEn ? 'en' : 'ru'));
  const sentences = trimmed ? Math.max(1, trimmed.match(/[.!?…]+(?=\s|$)/g)?.length ?? 0) : 0;
  const paragraphs = trimmed ? text.split(/\n\s*\n/).filter((part) => part.trim()).length : 0;
  const cyrillicCount = (text.match(/[а-яё]/gi) ?? []).length;
  const latinCount = (text.match(/[a-z]/gi) ?? []).length;
  const isCyrillic = cyrillicCount > latinCount;
  const stopWords = isCyrillic ? STOP_WORDS_RU : STOP_WORDS_EN;
  const frequencyMap = new Map<string, number>();

  for (const word of normalizedWords) {
    if (word.length < 2 || stopWords.has(word)) continue;
    frequencyMap.set(word, (frequencyMap.get(word) ?? 0) + 1);
  }

  const totalWordCharacters = words.reduce((sum, word) => sum + word.length, 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word, isCyrillic), 0);
  let readability: number | null = null;
  if (words.length >= 5 && sentences > 0) {
    const wordsPerSentence = words.length / sentences;
    const syllablesPerWord = syllables / words.length;
    readability = isCyrillic
      ? 206.835 - (1.3 * wordsPerSentence) - (60.1 * syllablesPerWord)
      : 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
    readability = Math.max(0, Math.min(100, readability));
  }

  const asciiCount = (text.match(/[\x00-\x7F]/g) ?? []).length;
  const nonAsciiCount = text.length - asciiCount;

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words: words.length,
    sentences,
    paragraphs,
    uniqueWords: new Set(normalizedWords).size,
    readingSeconds: words.length ? (words.length / (isEn ? 250 : 200)) * 60 : 0,
    speakingSeconds: words.length ? (words.length / 130) * 60 : 0,
    estimatedTokens: text ? Math.ceil((asciiCount / 4) + (nonAsciiCount / 2)) : 0,
    averageWordLength: words.length ? totalWordCharacters / words.length : 0,
    averageSentenceLength: sentences ? words.length / sentences : 0,
    readability,
    isCyrillic,
    frequency: [...frequencyMap.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 50),
  };
}

function formatDuration(seconds: number, isEn: boolean) {
  if (!seconds) return isEn ? '0 sec' : '0 сек';
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} ${isEn ? 'sec' : 'сек'}`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return remainder ? `${minutes} ${isEn ? 'min' : 'мин'} ${remainder} ${isEn ? 'sec' : 'сек'}` : `${minutes} ${isEn ? 'min' : 'мин'}`;
}

function readabilityLabel(score: number, isEn: boolean) {
  if (score >= 80) return isEn ? 'Easy' : 'Легко';
  if (score >= 60) return isEn ? 'Standard' : 'Обычно';
  if (score >= 40) return isEn ? 'Complex' : 'Сложно';
  return isEn ? 'Very complex' : 'Очень сложно';
}

export default function TextAnalyzer() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const deferredText = useDeferredValue(text);
  const analysis = useMemo(() => analyzeText(deferredText, isEn), [deferredText, isEn]);
  const localeName = isEn ? 'en-US' : 'ru-RU';

  const report = useMemo(() => {
    const lines = [
      `${isEn ? 'Words' : 'Слова'}: ${analysis.words}`,
      `${isEn ? 'Characters' : 'Символы'}: ${analysis.characters}`,
      `${isEn ? 'Characters without spaces' : 'Символы без пробелов'}: ${analysis.charactersNoSpaces}`,
      `${isEn ? 'Sentences' : 'Предложения'}: ${analysis.sentences}`,
      `${isEn ? 'Paragraphs' : 'Абзацы'}: ${analysis.paragraphs}`,
      `${isEn ? 'Unique words' : 'Уникальные слова'}: ${analysis.uniqueWords}`,
      `${isEn ? 'Reading time' : 'Время чтения'}: ${formatDuration(analysis.readingSeconds, isEn)}`,
      `${isEn ? 'Speaking time' : 'Время речи'}: ${formatDuration(analysis.speakingSeconds, isEn)}`,
      `${isEn ? 'Estimated AI tokens' : 'Оценка AI-токенов'}: ${analysis.estimatedTokens}`,
    ];
    if (analysis.readability !== null) {
      lines.push(`${isEn ? 'Approximate readability' : 'Оценочная читаемость'}: ${analysis.readability.toFixed(0)}/100`);
    }
    if (analysis.frequency.length) {
      lines.push('', isEn ? 'Frequent words:' : 'Частые слова:');
      for (const [word, count] of analysis.frequency.slice(0, 20)) lines.push(`${word}: ${count}`);
    }
    return lines.join('\n');
  }, [analysis, isEn]);

  const copyReport = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadReport = () => {
    if (!text) return;
    downloadBlob(new Blob([report], { type: 'text/plain;charset=utf-8' }), 'text-analysis.txt');
  };

  const mainStats = [
    { label: isEn ? 'Words' : 'Слова', value: analysis.words },
    { label: isEn ? 'Characters' : 'Символы', value: analysis.characters },
    { label: isEn ? 'Sentences' : 'Предложения', value: analysis.sentences },
    { label: isEn ? 'Reading time' : 'Время чтения', value: formatDuration(analysis.readingSeconds, isEn) },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="text-analyzer-source" className="text-sm font-semibold">
            {isEn ? 'Text to analyze' : 'Текст для анализа'}
          </Label>
          {text ? (
            <Button type="button" variant="ghost" className="min-h-11 px-3 text-[var(--color-text-muted)]" onClick={() => setText('')}>
              <X size={18} /> {isEn ? 'Clear' : 'Очистить'}
            </Button>
          ) : null}
        </div>
        <Textarea
          id="text-analyzer-source"
          rows={9}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setCopied(false);
          }}
          placeholder={isEn ? 'Paste or type text — the result appears immediately…' : 'Вставьте или введите текст — результат появится сразу…'}
          className="mt-2 min-h-52 resize-y text-base leading-relaxed"
        />
      </section>

      <section aria-live="polite" className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {mainStats.map((stat) => (
            <div key={stat.label} className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
              <div className="truncate text-xl font-bold text-[var(--color-text)]">
                {typeof stat.value === 'number' ? stat.value.toLocaleString(localeName) : stat.value}
              </div>
              <div className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">{stat.label}</div>
            </div>
          ))}
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!text}
          onClick={copyReport}
          leadingIcon={copied ? <Check size={20} weight="bold" /> : <Copy size={20} />}
        >
          {copied ? (isEn ? 'Report copied' : 'Отчёт скопирован') : (isEn ? 'Copy report' : 'Скопировать отчёт')}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          defaultOpen={true}
          title={isEn ? 'Detailed analysis' : 'Подробный анализ'}
          description={isEn ? 'More metrics, readability and frequent words' : 'Дополнительные метрики, читаемость и частые слова'}
        >
          <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {[
              [isEn ? 'Without spaces' : 'Без пробелов', analysis.charactersNoSpaces.toLocaleString(localeName)],
              [isEn ? 'Paragraphs' : 'Абзацы', analysis.paragraphs.toLocaleString(localeName)],
              [isEn ? 'Unique words' : 'Уникальные слова', analysis.uniqueWords.toLocaleString(localeName)],
              [isEn ? 'Average word length' : 'Средняя длина слова', analysis.averageWordLength.toFixed(1)],
              [isEn ? 'Average sentence' : 'Средняя длина предложения', `${analysis.averageSentenceLength.toFixed(1)} ${isEn ? 'words' : 'слов'}`],
              [isEn ? 'Speaking time' : 'Время речи', formatDuration(analysis.speakingSeconds, isEn)],
              [isEn ? 'Estimated AI tokens' : 'Оценка AI-токенов', analysis.estimatedTokens.toLocaleString(localeName)],
              [isEn ? 'Detected script' : 'Письменность', analysis.isCyrillic ? (isEn ? 'Cyrillic' : 'Кириллица') : (isEn ? 'Latin' : 'Латиница')],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-2 text-sm">
                <dt className="text-[var(--color-text-muted)]">{label}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          {analysis.readability !== null ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">{isEn ? 'Approximate readability' : 'Оценочная читаемость'}</span>
                <span className="font-bold text-[var(--color-primary)]">
                  {analysis.readability.toFixed(0)}/100 · {readabilityLabel(analysis.readability, isEn)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div className="h-full bg-[var(--color-primary)]" style={{ width: `${analysis.readability}%` }} />
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {isEn ? 'An estimate based on sentence length and syllables; use it as a guide.' : 'Оценка по длине предложений и числу слогов — используйте её как ориентир.'}
              </p>
            </div>
          ) : null}

          {analysis.frequency.length ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">{isEn ? 'Frequent words' : 'Частые слова'}</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {analysis.frequency.slice(0, 12).map(([word, count]) => (
                  <div key={word} className="flex min-h-10 items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 text-sm">
                    <span className="truncate">{word}</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Button type="button" variant="outline" className="mt-5 min-h-11" disabled={!text} onClick={downloadReport}>
            <DownloadSimple size={18} /> {isEn ? 'Download TXT report' : 'Скачать отчёт TXT'}
          </Button>
        </AdvancedSettings>
      </section>
    </div>
  );
}
