'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowsClockwise,
  CheckCircle,
  ClipboardText,
  MagnifyingGlass,
  Sparkle,
  Trash,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { cn } from '@/src/lib/cn';
import { writeClipboardText } from '@/src/utils/clipboard';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface ReplacementResult {
  output: string;
  matches: number;
  error: string;
}

function replaceText(
  input: string,
  search: string,
  replacement: string,
  options: { caseSensitive: boolean; wholeWord: boolean; regex: boolean },
): ReplacementResult {
  if (!search) return { output: input, matches: 0, error: '' };
  try {
    let pattern = options.regex ? search : escapeRegex(search);
    if (options.wholeWord && !options.regex) pattern = `\\b${pattern}\\b`;
    const expression = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    let matches = 0;
    const counter = new RegExp(expression.source, expression.flags);
    let match: RegExpExecArray | null;
    while ((match = counter.exec(input)) !== null) {
      matches += 1;
      if (match[0].length === 0) counter.lastIndex += 1;
      if (matches >= 100000) break;
    }
    const output = options.regex
      ? input.replace(expression, replacement)
      : input.replace(expression, () => replacement);
    return { output, matches, error: '' };
  } catch (error) {
    return {
      output: input,
      matches: 0,
      error: error instanceof Error ? error.message : 'Invalid regular expression',
    };
  }
}

interface Preset {
  labelRu: string;
  labelEn: string;
  sampleInputRu?: string;
  sampleInputEn?: string;
  search: string;
  replacement: string;
  regex: boolean;
  caseSensitive?: boolean;
}

const PRESETS: Preset[] = [
  {
    labelRu: 'Лишние пробелы',
    labelEn: 'Multiple spaces',
    sampleInputRu: 'Это    текст   с   множеством   лишних     пробелов между    словами.',
    sampleInputEn: 'This    text   has   multiple   redundant     spaces between    words.',
    search: '[ \\t]+',
    replacement: ' ',
    regex: true,
  },
  {
    labelRu: 'Дефис на тире ( — )',
    labelEn: 'Hyphen to Em-dash',
    sampleInputRu: 'Скидка - 50%. Время работы - с 9 до 18.',
    sampleInputEn: 'Discount - 50%. Opening hours - 9 to 6.',
    search: ' - ',
    replacement: ' — ',
    regex: false,
  },
  {
    labelRu: 'Удалить пустые строки',
    labelEn: 'Remove empty lines',
    sampleInputRu: "Первая строка\n\n\nВторая строка\n\n\n\nТретья строка",
    sampleInputEn: "Line one\n\n\nLine two\n\n\n\nLine three",
    search: '^\\s*\\n',
    replacement: '',
    regex: true,
  },
  {
    labelRu: 'Запятая на точку',
    labelEn: 'Comma to dot (decimals)',
    sampleInputRu: '12,5 кг; 45,99 руб; 3,14159',
    sampleInputEn: '12,5 kg; 45,99 USD; 3,14159',
    search: '(\\d+),(\\d+)',
    replacement: '$1.$2',
    regex: true,
  },
];

export default function TextReplace() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [input, setInput] = useState(PRESETS[0][isEn ? 'sampleInputEn' : 'sampleInputRu'] || '');
  const [search, setSearch] = useState(PRESETS[0].search);
  const [replacement, setReplacement] = useState(PRESETS[0].replacement);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(PRESETS[0].regex);
  const [copyStatus, setCopyStatus] = useState('');

  const result = useMemo(() => replaceText(input, search, replacement, {
    caseSensitive,
    wholeWord,
    regex,
  }), [caseSensitive, input, regex, replacement, search, wholeWord]);

  const copyResult = useCallback(async () => {
    const copied = await writeClipboardText(result.output);
    setCopyStatus(copied
      ? isEn ? 'Copied' : 'Скопировано'
      : isEn ? 'Could not copy' : 'Не удалось скопировать');
    setTimeout(() => setCopyStatus(''), 2500);
  }, [isEn, result.output]);

  const clear = useCallback(() => {
    setInput('');
    setSearch('');
    setReplacement('');
    setCopyStatus('');
  }, []);

  const applyPreset = (preset: Preset) => {
    if (!input.trim() && (preset.sampleInputRu || preset.sampleInputEn)) {
      setInput(preset[isEn ? 'sampleInputEn' : 'sampleInputRu'] || '');
    }
    setSearch(preset.search);
    setReplacement(preset.replacement);
    setRegex(preset.regex);
    if (preset.caseSensitive !== undefined) {
      setCaseSensitive(preset.caseSensitive);
    }
    setCopyStatus('');
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* 1-Click Common Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? 'Quick presets:' : 'Быстрые сценарии:'}
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p)}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
          >
            {isEn ? p.labelEn : p.labelRu}
          </button>
        ))}
        {(input || search || replacement) && (
          <button
            type="button"
            onClick={clear}
            className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-red-500"
          >
            <Trash size={14} />
            {isEn ? 'Clear all' : 'Очистить всё'}
          </button>
        )}
      </div>

      {/* Input Text Box */}
      <Card className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="replace-input" className="font-semibold text-sm">
            {isEn ? 'Source text' : 'Исходный текст'}
          </Label>
          <span className="text-xs text-[var(--color-text-muted)]">
            {input.length} {isEn ? 'chars' : 'симв.'}
          </span>
        </div>
        <Textarea
          id="replace-input"
          className="min-h-36 resize-y font-mono text-sm leading-relaxed"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setCopyStatus('');
          }}
          placeholder={isEn ? 'Paste or type your text here…' : 'Вставьте или введите текст…'}
        />

        {/* Find & Replace Controls */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
              <MagnifyingGlass size={15} className="text-[var(--color-primary)]" />
              <Label htmlFor="replace-find">{isEn ? 'Find' : 'Что найти'}</Label>
            </div>
            <Input
              id="replace-find"
              className="h-11 font-mono text-sm"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCopyStatus('');
              }}
              placeholder={regex ? (isEn ? 'Regex pattern, such as [0-9]+' : 'Регулярное выражение') : (isEn ? 'Text to find' : 'Текст для поиска')}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text)]">
              <ArrowRight size={15} className="text-emerald-500" />
              <Label htmlFor="replace-with">{isEn ? 'Replace with' : 'Заменить на'}</Label>
            </div>
            <Input
              id="replace-with"
              className="h-11 font-mono text-sm"
              value={replacement}
              onChange={(event) => {
                setReplacement(event.target.value);
                setCopyStatus('');
              }}
              placeholder={isEn ? 'Leave empty to delete matches' : 'Оставьте пустым для удаления'}
            />
          </div>
        </div>

        {/* Search Options Toolbar (Directly visible, no spoiler!) */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
          <label className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors select-none',
            caseSensitive
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          )}>
            <input
              type="checkbox"
              className="sr-only"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            <span className="font-mono font-bold">Aa</span>
            {isEn ? 'Case sensitive' : 'Учитывать регистр'}
          </label>

          <label className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors select-none',
            wholeWord && !regex
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            regex && 'opacity-40 cursor-not-allowed'
          )}>
            <input
              type="checkbox"
              className="sr-only"
              checked={wholeWord}
              disabled={regex}
              onChange={(e) => setWholeWord(e.target.checked)}
            />
            <span className="font-mono font-bold">\b</span>
            {isEn ? 'Whole words' : 'Слова целиком'}
          </label>

          <label className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors select-none',
            regex
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          )}>
            <input
              type="checkbox"
              className="sr-only"
              checked={regex}
              onChange={(e) => {
                setRegex(e.target.checked);
                if (e.target.checked) setWholeWord(false);
              }}
            />
            <span className="font-mono font-bold">.*</span>
            {isEn ? 'Regular expression (Regex)' : 'Регулярные выражения (RegEx)'}
          </label>
        </div>
      </Card>

      {/* Result Card */}
      <Card className="border-[var(--color-primary)]/20 p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Label htmlFor="replace-result" className="font-semibold text-sm">
            {isEn ? 'Result' : 'Результат'}
          </Label>
          <div className="flex items-center gap-2">
            {result.error ? (
              <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                {isEn ? `Regex error: ${result.error}` : `Ошибка regex: ${result.error}`}
              </span>
            ) : (
              <span className={cn(
                'rounded px-2 py-0.5 text-xs font-semibold',
                result.matches > 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
              )}>
                {isEn ? `${result.matches} match${result.matches === 1 ? '' : 'es'} replaced` : `Замен: ${result.matches}`}
              </span>
            )}
            <span className="text-xs text-[var(--color-text-muted)]">
              {result.output.length} {isEn ? 'chars' : 'симв.'}
            </span>
          </div>
        </div>

        <Textarea
          id="replace-result"
          className="min-h-36 resize-y bg-[var(--color-surface-muted)] font-mono text-sm leading-relaxed"
          value={result.output}
          readOnly
          aria-live="polite"
        />

        {/* Action button: compact w-auto, not stretched across whole screen */}
        <div className="mt-3.5 flex items-center justify-between gap-3">
          <Button
            data-tool-primary-action=""
            size="md"
            className="w-auto min-w-[170px]"
            onClick={copyResult}
            disabled={!result.output || Boolean(result.error)}
          >
            {copyStatus === (isEn ? 'Copied' : 'Скопировано')
              ? <CheckCircle size={18} weight="fill" />
              : <ClipboardText size={18} />}
            {copyStatus || (isEn ? 'Copy result' : 'Копировать результат')}
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-auto"
            onClick={() => {
              setInput(result.output);
              setCopyStatus('');
            }}
            disabled={!result.output || result.output === input}
            title={isEn ? 'Use result as new input' : 'Использовать результат как входные данные'}
          >
            <ArrowsClockwise size={18} />
            {isEn ? 'Use as input' : 'Вставить как исходный'}
          </Button>
        </div>
      </Card>

      <AdvancedSettings
        className="mt-4"
        defaultOpen={true}
        title={isEn ? "Pattern reference" : "Справка по шаблонам"}
        description={isEn ? "Syntax for regular expression matching" : "Синтаксис регулярных выражений и подстановок"}
      >
        <div className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
          <p>{isEn ? "Use \\d for digits, \\s for whitespace, \\w for letters, [A-Z] for character classes." : "Используйте \\d для цифр, \\s для пробелов, \\w для букв, [A-Z] для диапазонов."}</p>
          <p>{isEn ? "In replacement, use $1, $2 to reference captured groups." : "При замене используйте $1, $2 для подстановки найденных групп."}</p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
