'use client';

import { useCallback, useMemo, useState } from 'react';
import { CheckCircle, ClipboardText, Download, Sparkle, WarningCircle } from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { cn } from '@/src/lib/cn';
import { downloadBlob, escapeCsvCellForSpreadsheet } from '@/src/utils/exportHelpers';
import { writeClipboardText } from '@/src/utils/clipboard';

type Mode = 'json-to-csv' | 'csv-to-json';
type DelimiterChoice = 'auto' | ',' | ';' | '\t' | '|';

interface ConversionResult {
  output: string;
  error: string;
  warning: string;
  rows: number;
  columns: number;
  delimiter: string;
}

function csvEscape(value: unknown, delimiter: string): string {
  const text = value === null || value === undefined
    ? ''
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
  return escapeCsvCellForSpreadsheet(text, delimiter);
}

function jsonToCsv(input: string, delimiter: string, includeHeaders: boolean): ConversionResult {
  const parsed = JSON.parse(input);
  const values = Array.isArray(parsed) ? parsed : [parsed];
  if (values.length === 0) throw new Error('EMPTY_JSON');

  let nested = false;
  const rows: Record<string, unknown>[] = values.map((value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
    return { value } as Record<string, unknown>;
  });
  const headers: string[] = [];
  const seen = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => {
    if (!seen.has(key)) {
      seen.add(key);
      headers.push(key);
    }
    const value = row[key];
    if (value && typeof value === 'object') nested = true;
  }));

  const outputRows: string[] = [];
  if (includeHeaders) outputRows.push(headers.map((header) => csvEscape(header, delimiter)).join(delimiter));
  rows.forEach((row) => outputRows.push(headers.map((header) => csvEscape(row[header], delimiter)).join(delimiter)));
  return {
    output: outputRows.join('\r\n'),
    error: '',
    warning: nested ? 'NESTED_STRINGIFIED' : '',
    rows: rows.length,
    columns: headers.length,
    delimiter,
  };
}

function detectDelimiter(input: string): ',' | ';' | '\t' | '|' {
  const candidates: Array<',' | ';' | '\t' | '|'> = [',', ';', '\t', '|'];
  const counts = new Map(candidates.map((delimiter) => [delimiter, 0]));
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') index += 1;
      else quoted = !quoted;
      continue;
    }
    if (!quoted && (character === '\r' || character === '\n')) break;
    if (!quoted && counts.has(character as ',' | ';' | '\t' | '|')) counts.set(character as ',' | ';' | '\t' | '|', (counts.get(character as ',' | ';' | '\t' | '|') ?? 0) + 1);
  }
  return candidates.reduce((best, candidate) => (counts.get(candidate) ?? 0) > (counts.get(best) ?? 0) ? candidate : best, ',');
}

function parseCsv(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === delimiter) {
      row.push(field);
      field = '';
    } else if (character === '\r' || character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      if (character === '\r' && input[index + 1] === '\n') index += 1;
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('UNCLOSED_QUOTE');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  while (rows.length > 0 && rows[rows.length - 1].every((cell) => cell === '')) rows.pop();
  return rows;
}

function uniqueHeaders(values: string[], columnCount: number): string[] {
  const used = new Map<string, number>();
  return Array.from({ length: columnCount }, (_, index) => {
    const base = values[index]?.trim() || `column_${index + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

function coerceValue(value: string, enabled: boolean): unknown {
  if (!enabled) return value;
  const trimmed = value.trim();
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(trimmed)) return Number(trimmed);
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  return value;
}

function csvToJson(input: string, delimiterChoice: DelimiterChoice, includeHeaders: boolean, coerce: boolean): ConversionResult {
  const delimiter = delimiterChoice === 'auto' ? detectDelimiter(input) : delimiterChoice;
  const rows = parseCsv(input, delimiter);
  if (rows.length === 0) throw new Error('EMPTY_CSV');
  const columnCount = Math.max(...rows.map((row) => row.length));
  const headers = uniqueHeaders(includeHeaders ? rows[0] : [], columnCount);
  const dataRows = includeHeaders ? rows.slice(1) : rows;
  const output = dataRows.map((row) => Object.fromEntries(headers.map((header, index) => [header, coerceValue(row[index] ?? '', coerce)])));
  return {
    output: JSON.stringify(output, null, 2),
    error: '',
    warning: 'FLAT_OBJECTS',
    rows: output.length,
    columns: columnCount,
    delimiter,
  };
}

const SAMPLES = {
  usersJson: JSON.stringify(
    [
      { id: 1, name: "Alice", role: "Developer", city: "London" },
      { id: 2, name: "Bob", role: "Designer", city: "Berlin" },
      { id: 3, name: "Charlie", role: "Manager", city: "Paris" },
    ],
    null,
    2,
  ),
  productsJson: JSON.stringify(
    [
      { sku: "A101", title: "Wireless Mouse", price: 29.99, inStock: true },
      { sku: "B202", title: "Mechanical Keyboard", price: 89.5, inStock: true },
      { sku: "C303", title: "USB-C Hub", price: 45.0, inStock: false },
    ],
    null,
    2,
  ),
  usersCsv: "id,name,role,city\r\n1,Alice,Developer,London\r\n2,Bob,Designer,Berlin\r\n3,Charlie,Manager,Paris",
  productsCsv: "sku,title,price,inStock\r\nA101,Wireless Mouse,29.99,true\r\nB202,Mechanical Keyboard,89.5,true\r\nC303,USB-C Hub,45.0,false",
};

export default function JsonCsvConverter() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [mode, setMode] = useState<Mode>('json-to-csv');
  const [input, setInput] = useState(SAMPLES.usersJson);
  const [delimiterChoice, setDelimiterChoice] = useState<DelimiterChoice>('auto');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [coerce, setCoerce] = useState(true);
  const [filename, setFilename] = useState('converted');
  const [copied, setCopied] = useState(false);

  const result = useMemo<ConversionResult>(() => {
    if (!input.trim()) return { output: '', error: '', warning: '', rows: 0, columns: 0, delimiter: ',' };
    const activeDelimiter = delimiterChoice === 'auto' ? ',' : delimiterChoice;
    try {
      return mode === 'json-to-csv'
        ? jsonToCsv(input, activeDelimiter, includeHeaders)
        : csvToJson(input, delimiterChoice, includeHeaders, coerce);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN';
      const message = code === 'UNCLOSED_QUOTE'
        ? isEn ? 'CSV contains an unclosed quoted field.' : 'В CSV есть незакрытое поле в кавычках.'
        : code === 'EMPTY_JSON' || code === 'EMPTY_CSV'
          ? isEn ? 'The input contains no data rows.' : 'Во входных данных нет строк.'
          : mode === 'json-to-csv'
            ? isEn ? 'Invalid JSON.' : 'Некорректный JSON.'
            : isEn ? 'Invalid CSV.' : 'Некорректный CSV.';
      return { output: '', error: message, warning: '', rows: 0, columns: 0, delimiter: activeDelimiter };
    }
  }, [coerce, delimiterChoice, includeHeaders, input, isEn, mode]);

  const copyResult = useCallback(async () => {
    if (!result.output) return;
    if (await writeClipboardText(result.output)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [result.output]);

  const downloadResult = useCallback(() => {
    if (!result.output) return;
    const csv = mode === 'json-to-csv';
    downloadBlob(new Blob([csv ? '\uFEFF' : '', result.output], { type: csv ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8' }), `${filename.trim() || 'converted'}.${csv ? 'csv' : 'json'}`);
  }, [filename, mode, result.output]);

  const warningText = result.warning === 'NESTED_STRINGIFIED'
    ? isEn ? 'Nested objects and arrays are stored as JSON strings inside CSV cells. CSV cannot preserve nested structure without an external schema.' : 'Вложенные объекты и массивы записываются JSON-строками внутри ячеек CSV. Без внешней схемы CSV не сохраняет вложенную структуру.'
    : result.warning === 'FLAT_OBJECTS'
      ? isEn ? 'CSV rows become flat JSON objects. Quoted commas, quotes and embedded newlines are preserved, but CSV has no native nested-object model.' : 'Строки CSV становятся плоскими JSON-объектами. Запятые, кавычки и переносы внутри quoted-полей сохраняются, но у CSV нет модели вложенных объектов.'
      : '';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      {/* 1-Click Quick Preset Samples */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-[var(--color-primary)]" />
          {isEn ? "Presets:" : "Наборы данных:"}
        </span>
        <button
          type="button"
          onClick={() => {
            setInput(mode === 'json-to-csv' ? SAMPLES.usersJson : SAMPLES.usersCsv);
            setCopied(false);
          }}
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]"
        >
          {isEn ? "👥 Users list" : "👥 Список пользователей"}
        </button>
        <button
          type="button"
          onClick={() => {
            setInput(mode === 'json-to-csv' ? SAMPLES.productsJson : SAMPLES.productsCsv);
            setCopied(false);
          }}
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]"
        >
          {isEn ? "📦 Products catalog" : "📦 Каталог товаров"}
        </button>
      </div>

      <div role="radiogroup" aria-label={isEn ? 'Conversion direction' : 'Направление конвертации'} className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-1">
        {([
          ['json-to-csv', 'JSON → CSV'],
          ['csv-to-json', 'CSV → JSON'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => {
              setMode(value);
              setCopied(false);
              if (value === 'csv-to-json' && input === SAMPLES.usersJson) setInput(SAMPLES.usersCsv);
              else if (value === 'json-to-csv' && input === SAMPLES.usersCsv) setInput(SAMPLES.usersJson);
            }}
            className={cn('min-h-12 rounded-[var(--radius-sm)] px-3 font-semibold transition-colors', mode === value ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-muted)]')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor="json-csv-input" className="font-semibold">{mode === 'json-to-csv' ? 'JSON' : 'CSV'}</Label>
          </div>
          <Textarea id="json-csv-input" className="tool-short-landscape-editor min-h-[320px] font-mono text-sm lg:min-h-[460px]" value={input} onChange={(event) => { setInput(event.target.value); setCopied(false); }} placeholder={mode === 'json-to-csv' ? (isEn ? 'Paste a JSON object or array' : 'Вставьте JSON-объект или массив') : (isEn ? 'Paste CSV, including quoted multiline fields' : 'Вставьте CSV, включая многострочные поля в кавычках')} spellCheck={false} autoFocus />
        </Card>

        <Card className="border-[var(--color-primary)]/25 p-4 sm:p-5">
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor="json-csv-output" className="font-semibold">{mode === 'json-to-csv' ? 'CSV' : 'JSON'}</Label>
            {result.output ? <span className="text-xs text-[var(--color-text-muted)] font-mono">{result.rows} × {result.columns}</span> : null}
          </div>
          <Textarea id="json-csv-output" className="tool-short-landscape-editor min-h-[320px] bg-[var(--color-surface-muted)] font-mono text-sm lg:min-h-[460px]" value={result.output} readOnly aria-live="polite" />
          {result.error ? <div role="alert" className="mt-2 text-sm text-[var(--color-danger)]">{result.error}</div> : null}
        </Card>
      </div>

      {warningText && result.output ? (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <WarningCircle size={21} weight="fill" className="shrink-0" /> {warningText}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          size="lg"
          className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
          onClick={copyResult}
          disabled={!result.output}
        >
          {copied ? <CheckCircle size={20} weight="fill" /> : <ClipboardText size={20} />}
          {copied ? (isEn ? 'Result copied' : 'Результат скопирован') : (isEn ? 'Copy result' : 'Копировать результат')}
        </Button>
        {result.output ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-auto px-5"
            onClick={downloadResult}
          >
            <Download size={18} />
            {isEn ? 'Download file' : 'Скачать файл'}
          </Button>
        ) : null}
      </div>

      <AdvancedSettings title={isEn ? 'CSV options and download' : 'Параметры CSV и скачивание'} description={isEn ? 'Delimiter, header row, type coercion and filename' : 'Разделитель, заголовки, типы и имя файла'}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-delimiter">{isEn ? 'Delimiter' : 'Разделитель'}</Label>
            <select id="csv-delimiter" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={delimiterChoice} onChange={(event) => setDelimiterChoice(event.target.value as DelimiterChoice)}>
              {mode === 'csv-to-json' ? <option value="auto">{isEn ? 'Detect automatically' : 'Определить автоматически'}</option> : null}
              <option value=",">{isEn ? 'Comma' : 'Запятая'} (,)</option>
              <option value=";">{isEn ? 'Semicolon' : 'Точка с запятой'} (;)</option>
              <option value={'\t'}>Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
            {mode === 'csv-to-json' && result.output ? <div className="mt-1 text-xs text-[var(--color-text-muted)]">{isEn ? 'Used' : 'Использован'}: {result.delimiter === '\t' ? 'Tab' : result.delimiter}</div> : null}
          </div>
          <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={includeHeaders} onChange={(event) => setIncludeHeaders(event.target.checked)} />
            {mode === 'json-to-csv' ? (isEn ? 'Include header row' : 'Добавить строку заголовков') : (isEn ? 'First row contains headers' : 'Первая строка содержит заголовки')}
          </label>
          {mode === 'csv-to-json' ? (
            <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={coerce} onChange={(event) => setCoerce(event.target.checked)} />
              {isEn ? 'Convert numbers, booleans and null' : 'Преобразовывать числа, boolean и null'}
            </label>
          ) : null}
          <div><Label htmlFor="json-csv-name">{isEn ? 'Filename' : 'Имя файла'}</Label><Input id="json-csv-name" className="mt-1.5 h-11" value={filename} onChange={(event) => setFilename(event.target.value)} /></div>
          <Button variant="outline" className="min-h-11" onClick={downloadResult} disabled={!result.output}><Download size={18} /> {isEn ? 'Download result' : 'Скачать результат'}</Button>
        </div>
      </AdvancedSettings>
    </div>
  );
}
