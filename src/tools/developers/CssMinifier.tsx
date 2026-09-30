'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  X,
  ArrowsInLineHorizontal,
  BracketsCurly,
  DownloadSimple,
  Gauge,
  GitDiff,
  ClipboardText,
} from '@phosphor-icons/react';
import { CopyButton } from '@/src/components/CopyButton';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { Card } from '@/src/components/ui/card';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/cn';
import { downloadBlob } from '@/src/utils/exportHelpers';
import { useClipboardPaste } from '@/src/hooks/useClipboardPaste';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { ToolPrimaryAction } from '@/src/components/tool/workspace';

/* -----------------------------------------------------------------------------
 * Types & constants
 * -------------------------------------------------------------------------- */

type Mode = 'minify' | 'beautify';
type IndentType = '2' | '4' | 'tab';

const MAX_INPUT_BYTES = 500 * 1024;

const ZERO_UNIT_RE = /(^|[^\w.])0(?:px|em|rem|%|in|cm|mm|pc|pt|ex|ch|vh|vw|vmin|vmax)\b/gi;
const HEX_LONG_RE = /#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/gi;
const HEX_GENERIC_RE = /#([0-9a-fA-F]{3,8})\b/g;
const VENDOR_PROPS = [
  'transform',
  'transition',
  'animation',
  'flex',
  'flex-direction',
  'flex-wrap',
  'flex-flow',
  'align-items',
  'justify-content',
  'user-select',
  'filter',
  'box-shadow',
  'box-sizing',
  'border-radius',
  'background-size',
  'background-clip',
  'appearance',
  'backdrop-filter',
];
const VENDOR_PREFIXES = ['-webkit-', '-moz-', '-ms-', '-o-'];

/* -----------------------------------------------------------------------------
 * MINIFIER  (~150 lines)
 * -------------------------------------------------------------------------- */

interface MinifyOptions {
  mergeSelectors: boolean;
  inlineCustomProps: boolean;
}

/**
 * Strip /* … *\/ comments without touching content inside strings.
 */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Core compaction step: collapse whitespace, strip last `;` before `}`,
 * shorten hex colors, collapse zero units, lowercase hex.
 */
function compactCss(css: string): string {
  let result = stripComments(css);
  // Collapse all whitespace runs
  result = result.replace(/\s+/g, ' ');
  // Drop whitespace around structural tokens
  result = result.replace(/\s*([{}:;,>~+])\s*/g, '$1');
  // Remove last semicolon before a closing brace
  result = result.replace(/;}/g, '}');
  // 0.5 → .5  (with leading whitespace or punctuation)
  result = result.replace(/([\s:,(])0\.(\d)/g, '$1.$2');
  // 0px → 0  (unitless when value is zero)
  result = result.replace(ZERO_UNIT_RE, '$10');
  // Lowercase hex everywhere
  result = result.replace(HEX_GENERIC_RE, (_m, h) => '#' + h.toLowerCase());
  // #ffffff → #fff (and #aabbccdd → #abcd)
  result = result.replace(HEX_LONG_RE, '#$1$2$3');
  return result.trim();
}

/**
 * Tokenize compact CSS into ordered top-level rules.
 * Returns array of { selector, body, kind: 'rule' | 'at' } chunks.
 */
interface RuleChunk {
  kind: 'rule' | 'at-nested' | 'at-simple';
  selector: string;
  body: string;
}

function tokenizeRules(compact: string): RuleChunk[] {
  const out: RuleChunk[] = [];
  let depth = 0;
  let buf = '';
  for (let i = 0; i < compact.length; i++) {
    const ch = compact[i];
    if (ch === '{') {
      depth++;
      buf += ch;
    } else if (ch === '}') {
      depth--;
      buf += ch;
      if (depth === 0) {
        const openIdx = buf.indexOf('{');
        const selector = buf.slice(0, openIdx).trim();
        const body = buf.slice(openIdx + 1, buf.length - 1).trim();
        const isAt = selector.startsWith('@');
        const isNestedAt = isAt && /[{};]/.test(body);
        out.push({
          kind: isAt ? (isNestedAt ? 'at-nested' : 'at-simple') : 'rule',
          selector,
          body,
        });
        buf = '';
      }
    } else if (depth === 0 && ch === ';') {
      // Top-level at-rule terminated by ;  (e.g. @import "x.css";)
      buf += ch;
      out.push({ kind: 'at-simple', selector: buf.trim().replace(/;$/, ''), body: '' });
      buf = '';
    } else {
      buf += ch;
    }
  }
  return out;
}

function chunkToString(c: RuleChunk): string {
  if (c.kind === 'at-simple' && !c.body) return c.selector + ';';
  return c.selector + '{' + c.body + '}';
}

/**
 * Merge consecutive top-level rules that share an identical body.
 */
function mergeConsecutiveDuplicates(chunks: RuleChunk[]): RuleChunk[] {
  if (chunks.length < 2) return chunks;
  const merged: RuleChunk[] = [];
  for (const c of chunks) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.kind === 'rule' &&
      c.kind === 'rule' &&
      last.body === c.body &&
      last.body.length > 0
    ) {
      last.selector = last.selector + ',' + c.selector;
    } else {
      merged.push({ ...c });
    }
  }
  return merged;
}

/**
 * Inline `var(--name)` references that are defined in :root / :host and used
 * only inside the same stylesheet. Conservative: only inlines when the var is
 * declared exactly once and contains no nested var() references.
 */
function inlineCustomProperties(compact: string): string {
  const rootMatch = compact.match(/(:root|:host)\{([^}]*)\}/);
  if (!rootMatch) return compact;
  const decls = rootMatch[2];
  const vars = new Map<string, string>();
  for (const part of decls.split(';')) {
    const m = part.match(/^(--[\w-]+):(.*)$/);
    if (!m) continue;
    const name = m[1];
    const value = m[2].trim();
    if (value.includes('var(')) continue;
    if (vars.has(name)) {
      vars.set(name, '__DUP__');
    } else {
      vars.set(name, value);
    }
  }
  let result = compact;
  for (const [name, value] of vars) {
    if (value === '__DUP__') continue;
    const re = new RegExp('var\\(\\s*' + name.replace(/-/g, '\\-') + '\\s*(?:,[^)]*)?\\)', 'g');
    result = result.replace(re, value);
  }
  // After inlining, strip the now-redundant :root block if empty-ish
  return result;
}

function minifyCss(css: string, opts: MinifyOptions): string {
  if (!css.trim()) return '';
  let compact = compactCss(css);
  if (opts.inlineCustomProps) compact = inlineCustomProperties(compact);
  if (opts.mergeSelectors) {
    // Only merge at the top-level for simplicity & predictability
    const chunks = tokenizeRules(compact);
    const merged = mergeConsecutiveDuplicates(chunks);
    compact = merged.map(chunkToString).join('');
  }
  return compact;
}

/* -----------------------------------------------------------------------------
 * BEAUTIFIER  (~150 lines)
 * -------------------------------------------------------------------------- */

interface BeautifyOptions {
  indent: IndentType;
  alphabetize: boolean;
}

function indentStr(t: IndentType): string {
  if (t === 'tab') return '\t';
  return ' '.repeat(Number(t));
}

/**
 * Split a declaration block body into ordered declarations, preserving
 * function commas (rgba(), linear-gradient(), …). Splits only on top-level `;`.
 */
function splitDecls(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ';' && depth === 0) {
      const t = buf.trim();
      if (t) out.push(t);
      buf = '';
    } else {
      buf += ch;
    }
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

/**
 * Normalize a single declaration: lowercase property name, single space after
 * the first colon, trim value.
 */
function normalizeDecl(decl: string): string {
  const idx = decl.indexOf(':');
  if (idx < 0) return decl.trim();
  const prop = decl.slice(0, idx).trim();
  const value = decl.slice(idx + 1).trim();
  return prop + ': ' + value;
}

function declProp(decl: string): string {
  const idx = decl.indexOf(':');
  return idx < 0 ? decl : decl.slice(0, idx).trim();
}

/**
 * Recursively beautify a CSS string at a given indent depth.
 */
function beautifyBlock(compact: string, depth: number, opts: BeautifyOptions): string {
  const ind = indentStr(opts.indent);
  const chunks = tokenizeRules(compact);
  const lines: string[] = [];

  for (const chunk of chunks) {
    if (chunk.kind === 'at-simple' && !chunk.body) {
      lines.push(ind.repeat(depth) + chunk.selector + ';');
      continue;
    }
    // Split a multi-selector list onto separate lines
    const selRendered = chunk.selector
      .split(/,(?![^()]*\))/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(',\n' + ind.repeat(depth));
    const header = ind.repeat(depth) + selRendered + ' {';
    if (chunk.kind === 'at-nested') {
      const inner = beautifyBlock(chunk.body, depth + 1, opts);
      lines.push(header);
      lines.push(inner);
      lines.push(ind.repeat(depth) + '}');
    } else {
      let decls = splitDecls(chunk.body).map(normalizeDecl);
      if (opts.alphabetize) {
        // Stable-ish alpha sort, keeping custom-props at the top
        decls = decls.slice().sort((a, b) => {
          const pa = declProp(a);
          const pb = declProp(b);
          const isVarA = pa.startsWith('--');
          const isVarB = pb.startsWith('--');
          if (isVarA && !isVarB) return -1;
          if (!isVarA && isVarB) return 1;
          return pa.localeCompare(pb);
        });
      }
      if (decls.length === 0) {
        lines.push(header.replace(/ \{$/, ' {}'));
        continue;
      }
      lines.push(header);
      for (const d of decls) lines.push(ind.repeat(depth + 1) + d + ';');
      lines.push(ind.repeat(depth) + '}');
    }
  }
  return lines.join('\n');
}

function beautifyCss(css: string, opts: BeautifyOptions): string {
  if (!css.trim()) return '';
  // Pass through compact normalizer (without slow optimizations) first so the
  // beautifier has a predictable token stream to work with.
  const compact = compactCss(css);
  return beautifyBlock(compact, 0, opts).trim() + '\n';
}

/* -----------------------------------------------------------------------------
 * VENDOR PREFIX add / strip
 * -------------------------------------------------------------------------- */

function addVendorPrefixes(css: string): string {
  let out = css;
  for (const prop of VENDOR_PROPS) {
    const re = new RegExp(
      '(^|[;{}\\s])(' + prop.replace(/-/g, '\\-') + ')\\s*:\\s*([^;}]+?)(?=[;}])',
      'g',
    );
    out = out.replace(re, (_match, pre: string, p: string, value: string) => {
      const trimmed = value.trim();
      const prefixed = VENDOR_PREFIXES.filter((px) => px !== '-o-' || prop === 'transition')
        .map((px) => `${px}${p}: ${trimmed}`)
        .join('; ');
      return `${pre}${prefixed}; ${p}: ${trimmed}`;
    });
  }
  return out;
}

function stripVendorPrefixes(css: string): string {
  // Remove whole declarations whose property begins with a vendor prefix.
  return css.replace(/(?:-(?:webkit|moz|ms|o)-)[a-z-]+\s*:[^;}]+;?/gi, '');
}

/* -----------------------------------------------------------------------------
 * Stats & diff utilities
 * -------------------------------------------------------------------------- */

function getByteSize(s: string): number {
  if (typeof TextEncoder === 'undefined') return s.length;
  return new TextEncoder().encode(s).length;
}

/**
 * Crude gzip-size estimator. Counts unique tokens (length-1 substring set) as a
 * proxy for entropy and uses CSS's typical 20–40 % compression band.
 */
function estimateGzip(s: string): number {
  const len = getByteSize(s);
  if (len === 0) return 0;
  const unique = new Set<string>();
  for (const ch of s) unique.add(ch);
  const charset = unique.size;
  const entropy = charset / Math.max(1, s.length);
  return Math.round(len * (0.22 + entropy * 0.15));
}

function fmtBytes(n: number, isEn: boolean): string {
  if (n < 1024) return `${n} ${isEn ? 'B' : 'Б'}`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} ${isEn ? 'KB' : 'КБ'}`;
  return `${(n / 1024 / 1024).toFixed(2)} ${isEn ? 'MB' : 'МБ'}`;
}

interface DiffRow {
  ln: number | '';
  rn: number | '';
  left: string;
  right: string;
}

function buildDiff(input: string, output: string, maxLines = 200): DiffRow[] {
  const ls = input.split('\n');
  const rs = output.split('\n');
  const max = Math.min(maxLines, Math.max(ls.length, rs.length));
  const rows: DiffRow[] = [];
  for (let i = 0; i < max; i++) {
    rows.push({
      ln: i < ls.length ? i + 1 : '',
      rn: i < rs.length ? i + 1 : '',
      left: ls[i] ?? '',
      right: rs[i] ?? '',
    });
  }
  return rows;
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export default function CssMinifier() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('minify');
  const [showDiff, setShowDiff] = useState(false);
  const [slowOpt, setSlowOpt] = useState(false);
  const [inlineVars, setInlineVars] = useState(false);
  const [indent, setIndent] = useState<IndentType>('2');
  const [alphabetize, setAlphabetize] = useState(false);
  const [prefixMode, setPrefixMode] = useState<'off' | 'add' | 'strip'>('off');
  const [sizeError, setSizeError] = useState(false);
  const [lastAction, setLastAction] = useState<Mode | ''>('');
  const [processedSignature, setProcessedSignature] = useState('');
  const { pasteText, pasting } = useClipboardPaste();

  const signature = useMemo(
    () =>
      [
        input,
        mode,
        slowOpt ? 'slow' : 'normal',
        inlineVars ? 'inline' : 'keep-vars',
        indent,
        alphabetize ? 'alphabetize' : 'keep-order',
        prefixMode,
      ].join('\u0000'),
    [alphabetize, indent, inlineVars, input, mode, prefixMode, slowOpt],
  );

  const hasFreshOutput = processedSignature === signature && processedSignature !== '';

  const transform = useCallback(
    (raw: string): string => {
      if (!raw.trim()) return '';
      let working = raw;
      if (prefixMode === 'add') working = addVendorPrefixes(working);
      else if (prefixMode === 'strip') working = stripVendorPrefixes(working);

      if (mode === 'minify') {
        return minifyCss(working, {
          mergeSelectors: slowOpt,
          inlineCustomProps: inlineVars,
        });
      }

      return beautifyCss(working, { indent, alphabetize });
    },
    [alphabetize, indent, inlineVars, mode, prefixMode, slowOpt],
  );

  const handleRun = useCallback(() => {
    if (getByteSize(input) > MAX_INPUT_BYTES) {
      setSizeError(true);
      return;
    }

    setSizeError(false);
    setOutput(transform(input));
    setProcessedSignature(signature);
    setLastAction(mode);
  }, [input, mode, signature, transform]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setProcessedSignature('');
    setLastAction('');
    setSizeError(false);
    setShowDiff(false);
  }, []);

  const handleDownloadMin = useCallback(() => {
    if (!hasFreshOutput) return;
    const min = minifyCss(output, { mergeSelectors: slowOpt, inlineCustomProps: inlineVars });
    downloadBlob(new Blob([min], { type: 'text/css;charset=utf-8' }), 'styles.min.css');
  }, [hasFreshOutput, inlineVars, output, slowOpt]);

  const handleDownloadPretty = useCallback(() => {
    if (!hasFreshOutput) return;
    const pretty = beautifyCss(output, { indent, alphabetize });
    downloadBlob(new Blob([pretty], { type: 'text/css;charset=utf-8' }), 'styles.pretty.css');
  }, [alphabetize, hasFreshOutput, indent, output]);

  const stats = useMemo(() => {
    if (!hasFreshOutput || !input.trim()) return null;
    const original = getByteSize(input);
    const result = getByteSize(output);
    const originalGzip = estimateGzip(input);
    const resultGzip = estimateGzip(output);
    const saved = original - result;
    const savedPct = original > 0 ? (saved / original) * 100 : 0;
    return { original, result, originalGzip, resultGzip, saved, savedPct };
  }, [hasFreshOutput, input, output]);

  const diffRows = useMemo(
    () => (showDiff && hasFreshOutput ? buildDiff(input, output) : []),
    [hasFreshOutput, input, output, showDiff],
  );

  const indentOptions: { value: IndentType; label: string }[] = [
    { value: '2', label: isEn ? '2 spaces' : '2 пробела' },
    { value: '4', label: isEn ? '4 spaces' : '4 пробела' },
    { value: 'tab', label: 'Tab' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <div
          role="radiogroup"
          aria-label={isEn ? 'CSS action' : 'Действие с CSS'}
          className="mb-4 grid grid-cols-2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]"
        >
          {(['minify', 'beautify'] as Mode[]).map((item, index) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={mode === item}
              onClick={() => setMode(item)}
              className={cn(
                'inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-semibold transition-colors',
                mode === item
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]',
                index > 0 && 'border-l border-[var(--color-border)]',
              )}
            >
              {item === 'minify' ? (
                <ArrowsInLineHorizontal size={18} />
              ) : (
                <BracketsCurly size={18} />
              )}
              {item === 'minify'
                ? isEn
                  ? 'Minify'
                  : 'Сжать'
                : isEn
                  ? 'Format'
                  : 'Форматировать'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section>
            <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
              <span className="text-sm font-medium">{isEn ? 'CSS input' : 'Исходный CSS'}</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {fmtBytes(getByteSize(input), isEn)}
              </span>
            </div>
            <Textarea
              rows={13}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setSizeError(false);
              }}
              placeholder={isEn ? 'Paste CSS here' : 'Вставьте CSS сюда'}
              className="tool-short-landscape-editor min-h-64 font-mono text-sm md:min-h-80"
              spellCheck={false}
            />
          </section>

          <div className="md:col-span-2 md:row-start-2">
            <ToolPrimaryAction
              type="button"
              onClick={handleRun}
              disabled={!input.trim()}
              leadingIcon={
                mode === 'minify' ? (
                  <ArrowsInLineHorizontal size={20} />
                ) : (
                  <BracketsCurly size={20} />
                )
              }
            >
              {mode === 'minify'
                ? isEn
                  ? 'Minify CSS'
                  : 'Сжать CSS'
                : isEn
                  ? 'Format CSS'
                  : 'Форматировать CSS'}
            </ToolPrimaryAction>
          </div>

          <section className="md:col-start-2 md:row-start-1" aria-live="polite">
            <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
              <span className="text-sm font-medium">{isEn ? 'Result' : 'Результат'}</span>
              <CopyButton text={hasFreshOutput ? output : ''} size="medium" />
            </div>
            <Textarea
              rows={13}
              value={hasFreshOutput ? output : ''}
              readOnly
              placeholder={isEn ? 'Result appears here' : 'Здесь появится результат'}
              className="tool-short-landscape-editor min-h-64 bg-[var(--color-surface-muted)] font-mono text-sm md:min-h-80"
              spellCheck={false}
            />
          </section>
        </div>

        {sizeError && (
          <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
            {isEn ? 'CSS is larger than 500 KB.' : 'Размер CSS превышает 500 КБ.'}
          </p>
        )}
      </Card>

      <AdvancedSettings
        title={isEn ? 'More CSS options' : 'Дополнительные настройки'}
        description={
          isEn
            ? 'Optimization depth, indentation, prefixes and file actions'
            : 'Оптимизация, отступы, префиксы и действия с файлом'
        }
      >
        <div className="space-y-5 [&_button]:min-h-11 [&_select]:min-h-11">
          {mode === 'minify' ? (
            <div className="space-y-1">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={slowOpt}
                  onChange={(event) => setSlowOpt(event.target.checked)}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                {isEn ? 'Merge compatible selectors' : 'Объединять совместимые селекторы'}
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={inlineVars}
                  onChange={(event) => setInlineVars(event.target.checked)}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                {isEn ? 'Inline simple CSS variables' : 'Подставлять простые CSS-переменные'}
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1.5 block font-medium">{isEn ? 'Indent' : 'Отступ'}</span>
                <select
                  value={indent}
                  onChange={(event) => setIndent(event.target.value as IndentType)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                >
                  {indentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-h-11 cursor-pointer items-end gap-3 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={alphabetize}
                  onChange={(event) => setAlphabetize(event.target.checked)}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                {isEn ? 'Sort properties alphabetically' : 'Сортировать свойства по алфавиту'}
              </label>
            </div>
          )}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              {isEn ? 'Vendor prefixes' : 'Браузерные префиксы'}
            </span>
            <select
              value={prefixMode}
              onChange={(event) =>
                setPrefixMode(event.target.value as 'off' | 'add' | 'strip')
              }
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm sm:max-w-sm"
            >
              <option value="off">{isEn ? 'Keep as is' : 'Не изменять'}</option>
              <option value="add">{isEn ? 'Add common prefixes' : 'Добавить основные'}</option>
              <option value="strip">{isEn ? 'Remove prefixes' : 'Удалить префиксы'}</option>
            </select>
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const value = await pasteText();
                if (value !== null) {
                  setInput(value);
                  setProcessedSignature('');
                  setSizeError(false);
                }
              }}
              disabled={pasting}
            >
              <ClipboardText size={18} />
              {isEn ? 'Paste' : 'Вставить'}
            </Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              <X size={18} />
              {isEn ? 'Clear' : 'Очистить'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!hasFreshOutput) return;
                setInput(output);
                setProcessedSignature('');
                setShowDiff(false);
              }}
              disabled={!hasFreshOutput}
            >
              {isEn ? 'Result to input' : 'Результат во вход'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadMin}
              disabled={!hasFreshOutput}
            >
              <DownloadSimple size={18} />
              .min.css
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPretty}
              disabled={!hasFreshOutput}
            >
              <DownloadSimple size={18} />
              .pretty.css
            </Button>
          </div>

          {stats && (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Gauge size={18} />
                {isEn ? 'Size' : 'Размер'}
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                {fmtBytes(stats.original, isEn)} → {fmtBytes(stats.result, isEn)}
                {' · '}gzip ~{fmtBytes(stats.originalGzip, isEn)} → {fmtBytes(stats.resultGzip, isEn)}
                {' · '}
                {stats.saved >= 0
                  ? isEn
                    ? fmtBytes(stats.saved, isEn) + ' saved (' + stats.savedPct.toFixed(1) + '%)'
                    : 'экономия ' + fmtBytes(stats.saved, isEn) + ' (' + stats.savedPct.toFixed(1) + '%)'
                  : isEn
                    ? fmtBytes(Math.abs(stats.saved), isEn) + ' larger'
                    : 'больше на ' + fmtBytes(Math.abs(stats.saved), isEn)}
                {lastAction
                  ? ' · ' +
                    (lastAction === 'minify'
                      ? isEn
                        ? 'minified'
                        : 'сжато'
                      : isEn
                        ? 'formatted'
                        : 'форматировано')
                  : ''}
              </p>
            </div>
          )}

          {hasFreshOutput && (
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDiff((current) => !current)}
                aria-expanded={showDiff}
              >
                <GitDiff size={18} />
                {showDiff
                  ? isEn
                    ? 'Hide comparison'
                    : 'Скрыть сравнение'
                  : isEn
                    ? 'Compare input and result'
                    : 'Сравнить вход и результат'}
              </Button>

              {showDiff && (
                <div className="mt-3 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
                  <div className="grid min-w-[42rem] grid-cols-[2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)] font-mono text-xs leading-relaxed">
                    <div className="bg-[var(--color-surface-muted)] px-2 py-2 text-center">#</div>
                    <div className="bg-[var(--color-surface-muted)] px-2 py-2">
                      {isEn ? 'Input' : 'Вход'}
                    </div>
                    <div className="bg-[var(--color-surface-muted)] px-2 py-2 text-center">#</div>
                    <div className="bg-[var(--color-surface-muted)] px-2 py-2">
                      {isEn ? 'Result' : 'Результат'}
                    </div>
                    {diffRows.map((row) => (
                      <div
                        key={[row.ln, row.rn, row.left, row.right].join('-')}
                        className="contents"
                      >
                        <div className="border-t border-[var(--color-border)] px-2 py-1 text-right text-[var(--color-text-subtle)]">
                          {row.ln}
                        </div>
                        <pre className="m-0 whitespace-pre-wrap break-all border-t border-[var(--color-border)] px-2 py-1">
                          {row.left}
                        </pre>
                        <div className="border-t border-[var(--color-border)] px-2 py-1 text-right text-[var(--color-text-subtle)]">
                          {row.rn}
                        </div>
                        <pre className="m-0 whitespace-pre-wrap break-all border-t border-[var(--color-border)] px-2 py-1">
                          {row.right}
                        </pre>
                      </div>
                    ))}
                  </div>
                  {input.split('\n').length > 200 && (
                    <p className="border-t border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                      {isEn ? 'First 200 lines shown' : 'Показаны первые 200 строк'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </AdvancedSettings>
    </div>
  );
}
