'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import {
  TrashSimple,
  BracketsCurly,
  ArrowsInLineHorizontal,
  CheckCircle,
  FileText,
  Code,
  CaretRight,
  CaretDown,
  MagnifyingGlass,
  TreeStructure,
  ClipboardText,
  DownloadSimple,
} from '@phosphor-icons/react';
import { CopyButton } from '@/src/components/CopyButton';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { sanitizeHtml } from '@/src/utils/htmlSanitization';
import { Card } from '@/src/components/ui/card';
import { Textarea } from '@/src/components/ui/textarea';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/cn';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { ToolPrimaryAction } from '@/src/components/tool/workspace';
import { toast } from 'sonner';
import { useClipboardPaste } from '@/src/hooks/useClipboardPaste';
import { useUrlState } from '@/src/hooks/useUrlState';
import { downloadBlob } from '@/src/utils/exportHelpers';
import { writeClipboardText } from '@/src/utils/clipboard';

interface JsonError {
  message: string;
  position?: number;
  line?: number;
  column?: number;
}

function parseErrorPosition(errMsg: string): { line?: number; column?: number; position?: number } {
  const posMatch = errMsg.match(/position\s+(\d+)/i);
  const lineMatch = errMsg.match(/line\s+(\d+)/i);
  const colMatch = errMsg.match(/column\s+(\d+)/i);
  return {
    position: posMatch ? parseInt(posMatch[1]) : undefined,
    line: lineMatch ? parseInt(lineMatch[1]) : undefined,
    column: colMatch ? parseInt(colMatch[1]) : undefined,
  };
}

function positionToLineCol(text: string, position: number): { line: number; column: number } {
  const lines = text.substring(0, position).split('\n');
  return { line: lines.length, column: (lines[lines.length - 1]?.length ?? 0) + 1 };
}

function countKeys(obj: unknown): number {
  if (obj === null || typeof obj !== 'object') return 0;
  if (Array.isArray(obj)) return obj.reduce((sum: number, item) => sum + countKeys(item), 0);
  const keys = Object.keys(obj as Record<string, unknown>);
  return keys.length + keys.reduce((sum: number, k) => sum + countKeys((obj as Record<string, unknown>)[k]), 0);
}

function getDepth(obj: unknown): number {
  if (obj === null || typeof obj !== 'object') return 0;
  if (Array.isArray(obj)) return 1 + obj.reduce<number>((m, v) => Math.max(m, getDepth(v)), 0);
  return 1 + Object.values(obj as Record<string, unknown>).reduce<number>((m, v) => Math.max(m, getDepth(v)), 0);
}

function getTypeCounts(obj: unknown, counts: Record<string, number> = {}): Record<string, number> {
  const t = obj === null ? 'null' : Array.isArray(obj) ? 'array' : typeof obj;
  counts[t] = (counts[t] || 0) + 1;
  if (obj !== null && typeof obj === 'object') {
    if (Array.isArray(obj)) obj.forEach(v => getTypeCounts(v, counts));
    else Object.values(obj as Record<string, unknown>).forEach(v => getTypeCounts(v, counts));
  }
  return counts;
}

function syntaxHighlight(json: string, isDark: boolean): string {
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const colors = isDark
    ? { key: '#79B8FF', string: '#85E89D', number: '#B392F0', boolean: '#F97583', nil: '#6A737D' }
    : { key: '#005cc5', string: '#22863a', number: '#6f42c1', boolean: '#d73a49', nil: '#999' };

  return escaped.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    match => {
      let color = colors.number;
      if (/^"/.test(match)) color = /:$/.test(match) ? colors.key : colors.string;
      else if (/true|false/.test(match)) color = colors.boolean;
      else if (/null/.test(match)) color = colors.nil;
      return `<span style="color: ${color}">${match}</span>`;
    }
  );
}

function sortJsonObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortJsonObjectKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.keys(obj as Record<string, unknown>)
        .sort()
        .map((key) => [key, sortJsonObjectKeys((obj as Record<string, unknown>)[key])])
    );
  }
  return obj;
}

function isValidIdentifier(key: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(key);
}

function buildPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`;
  if (isValidIdentifier(key)) return `${parent}.${key}`;
  return `${parent}['${key.replace(/'/g, "\\'")}']`;
}

function collectAllPaths(value: unknown, path: string, acc: string[]): void {
  if (value === null || typeof value !== 'object') return;
  acc.push(path);
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectAllPaths(v, buildPath(path, i), acc));
  } else {
    Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
      collectAllPaths(v, buildPath(path, k), acc);
    });
  }
}

function subtreeContainsKey(value: unknown, term: string): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some(v => subtreeContainsKey(v, term));
  }
  const entries = Object.entries(value as Record<string, unknown>);
  for (const [k, v] of entries) {
    if (k.toLowerCase().includes(term)) return true;
    if (subtreeContainsKey(v, term)) return true;
  }
  return false;
}

interface TreeNodeProps {
  nodeKey: string | number | null;
  value: unknown;
  path: string;
  depth: number;
  isLast: boolean;
  expanded: Set<string>;
  toggle: (p: string) => void;
  setHovered: (p: string) => void;
  copyPath: (p: string) => void;
  searchTerm: string;
  isDark: boolean;
  isEn: boolean;
}

function valueColor(value: unknown, isDark: boolean): string {
  const colors = isDark
    ? { string: '#85E89D', number: '#B392F0', boolean: '#F97583', nil: '#6A737D' }
    : { string: '#22863a', number: '#6f42c1', boolean: '#d73a49', nil: '#999' };
  if (value === null) return colors.nil;
  if (typeof value === 'string') return colors.string;
  if (typeof value === 'number') return colors.number;
  if (typeof value === 'boolean') return colors.boolean;
  return colors.nil;
}

function formatPrimitive(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function TreeNode(props: TreeNodeProps) {
  const { nodeKey, value, path, depth, isLast, expanded, toggle, setHovered, copyPath, searchTerm, isDark, isEn } = props;
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const isExpanded = expanded.has(path);
  const keyColor = isDark ? '#79B8FF' : '#005cc5';
  const punctColor = isDark ? '#8B949E' : '#6e7781';
  const term = searchTerm.trim().toLowerCase();
  const matchesKey =
    term && typeof nodeKey === 'string' && nodeKey.toLowerCase().includes(term);

  if (term && isObject) {
    const keepInTree = matchesKey || subtreeContainsKey(value, term);
    if (!keepInTree) return null;
  } else if (term && !isObject) {
    if (!matchesKey) return null;
  }

  const indentPx = depth * 16;
  const keyLabel: ReactNode =
    nodeKey === null ? null : typeof nodeKey === 'number' ? (
      <span style={{ color: punctColor }}>{nodeKey}: </span>
    ) : (
      <button
        type="button"
        style={{ color: keyColor, backgroundColor: matchesKey ? (isDark ? 'rgba(255, 220, 0, 0.18)' : 'rgba(255, 220, 0, 0.4)') : undefined }}
        className="inline-flex min-h-6 items-center rounded px-0.5 font-[inherit] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
        onMouseEnter={() => setHovered(path)}
        onClick={(e) => { e.stopPropagation(); copyPath(path); }}
        title={path}
        aria-label={`${isEn ? 'Copy path' : 'Копировать путь'} ${path}`}
      >
        &quot;{nodeKey}&quot;
      </button>
    );

  if (!isObject) {
    return (
      <div
        className="group flex items-start font-mono text-xs leading-relaxed"
        style={{ paddingLeft: indentPx }}
        onMouseEnter={() => setHovered(path)}
      >
        <span className="inline-block" style={{ width: 14 }} />
        {keyLabel}
        {nodeKey !== null && <span style={{ color: punctColor }}>: </span>}
        <button
          type="button"
          className="inline-flex min-h-6 items-center rounded px-0.5 font-[inherit] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
          style={{ color: valueColor(value, isDark) }}
          onClick={(e) => { e.stopPropagation(); copyPath(path); }}
          title={path}
          aria-label={`${isEn ? 'Copy path' : 'Копировать путь'} ${path}`}
        >
          {formatPrimitive(value)}
        </button>
        {!isLast && <span style={{ color: punctColor }}>,</span>}
      </div>
    );
  }

  const entries: Array<[string | number, unknown]> = isArray
    ? (value as unknown[]).map((v, i) => [i, v])
    : Object.entries(value as Record<string, unknown>);
  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';
  const isEmpty = entries.length === 0;

  return (
    <div onMouseEnter={() => setHovered(path)}>
      <div
        className="group flex items-start font-mono text-xs leading-relaxed"
        style={{ paddingLeft: indentPx }}
      >
        {!isEmpty ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(path); }}
            className="mr-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-text-subtle)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
            aria-label={`${isExpanded ? (isEn ? 'Collapse' : 'Свернуть') : (isEn ? 'Expand' : 'Развернуть')} ${path}`}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
          </button>
        ) : (
          <span className="inline-block" style={{ width: 14 }} />
        )}
        {keyLabel}
        {nodeKey !== null && <span style={{ color: punctColor }}>: </span>}
        <button
          type="button"
          className="inline-flex min-h-6 items-center rounded px-0.5 font-[inherit] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
          style={{ color: punctColor }}
          onClick={(e) => { e.stopPropagation(); copyPath(path); }}
          title={path}
          aria-label={`${isEn ? 'Copy path' : 'Копировать путь'} ${path}`}
        >
          {open}
        </button>
        {(!isExpanded || isEmpty) && (
          <>
            <span style={{ color: punctColor }}>
              {isEmpty ? '' : '…'}
            </span>
            <span style={{ color: punctColor }}>{close}</span>
            {!isEmpty && (
              <Badge variant="outline" className="ml-2 h-4 px-1 py-0 text-[9px]">
                {entries.length}
              </Badge>
            )}
            {!isLast && <span style={{ color: punctColor }}>,</span>}
          </>
        )}
      </div>
      {isExpanded && !isEmpty && (
        <>
          {entries.map(([k, v], idx) => (
            <TreeNode
              key={String(k)}
              nodeKey={isArray ? (k as number) : (k as string)}
              value={v}
              path={buildPath(path, k)}
              depth={depth + 1}
              isLast={idx === entries.length - 1}
              expanded={expanded}
              toggle={toggle}
              setHovered={setHovered}
              copyPath={copyPath}
              searchTerm={searchTerm}
              isDark={isDark}
              isEn={isEn}
            />
          ))}
          <div
            className="font-mono text-xs leading-relaxed"
            style={{ paddingLeft: indentPx, color: punctColor }}
          >
            <span className="inline-block" style={{ width: 14 }} />
            {close}
            {!isLast && ','}
          </div>
        </>
      )}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-9 items-center rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-soft)]'
          : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
      )}
    >
      {children}
    </button>
  );
}

export default function JsonFormatter() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const { state: urlState, setState: setUrlState } = useUrlState({
    defaultValues: {
      input: '',
    },
    hashKeys: ['input'],
  });

  const input = urlState.input;

  const setInput = useCallback(
    (val: string) => {
      setUrlState({ input: val });
    },
    [setUrlState],
  );

  const [output, setOutput] = useState('');
  const [error, setError] = useState<JsonError | null>(null);
  const [lastAction, setLastAction] = useState<string>('');
  const [indent, setIndent] = useState<2 | 4 | '\t'>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('raw');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['$']));
  const [hoveredPath, setHoveredPath] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { pasteText, pasting } = useClipboardPaste();

  const handleError = useCallback((e: unknown) => {
    const msg = (e as Error).message;
    const pos = parseErrorPosition(msg);
    let line = pos.line;
    let column = pos.column;
    if (!line && pos.position !== undefined) {
      const lc = positionToLineCol(input, pos.position);
      line = lc.line;
      column = lc.column;
    }
    setError({ message: msg, position: pos.position, line, column });
    setOutput('');
  }, [input]);

  const formatJson = useCallback(() => {
    try {
      let parsed = JSON.parse(input);
      if (sortKeys) parsed = sortJsonObjectKeys(parsed);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutput(formatted);
      setError(null);
      setLastAction('format');
    } catch (e) {
      handleError(e);
    }
  }, [input, handleError, indent, sortKeys]);

  const minifyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
      setLastAction('minify');
    } catch (e) {
      handleError(e);
    }
  }, [input, handleError]);

  const validateJson = useCallback(() => {
    try {
      const parsed = JSON.parse(input);
      void parsed;
      setError(null);
      setOutput('');
      setLastAction('validate');
    } catch (e) {
      handleError(e);
      setLastAction('validate');
    }
  }, [input, handleError]);

  const escapeString = useCallback(async () => {
    if (!output) return;
    const escaped = JSON.stringify(output);
    const ok = await writeClipboardText(escaped);
    if (!ok) return;
    toast.success(isEn ? 'Escaped string copied' : 'Скопировано как escaped-строка');
  }, [output, isEn]);

  const toPythonDict = useCallback(async () => {
    if (!output) return;
    const py = output
      .replace(/\btrue\b/g, 'True')
      .replace(/\bfalse\b/g, 'False')
      .replace(/\bnull\b/g, 'None');
    const ok = await writeClipboardText(py);
    if (!ok) return;
    toast.success(isEn ? 'Copied as Python dict' : 'Скопировано как Python dict');
  }, [output, isEn]);

  const downloadJson = useCallback(() => {
    if (!output) return;
    downloadBlob(new Blob([output], { type: 'application/json;charset=utf-8' }), 'formatted.json');
  }, [output]);

  const clear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    setLastAction('');
    setSearchTerm('');
    setHoveredPath('');
  }, [setInput]);

  const parsedTree = useMemo(() => {
    if (!output || lastAction === 'validate') return null;
    try {
      return JSON.parse(output);
    } catch {
      return null;
    }
  }, [output, lastAction]);

  useEffect(() => {
    if (parsedTree === null || typeof parsedTree !== 'object') return;
    const id = window.setTimeout(() => {
      setExpanded(prev => {
        if (prev.has('$')) return prev;
        const next = new Set(prev);
        next.add('$');
        return next;
      });
    }, 0);

    return () => window.clearTimeout(id);
  }, [parsedTree]);

  const togglePath = useCallback((p: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (parsedTree === null || typeof parsedTree !== 'object') return;
    const all: string[] = [];
    collectAllPaths(parsedTree, '$', all);
    setExpanded(new Set(all));
  }, [parsedTree]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set(['$']));
  }, []);

  const copyPath = useCallback(async (p: string) => {
    const ok = await writeClipboardText(p);
    if (!ok) return;
    toast.success((isEn ? 'Copied: ' : 'Скопировано: ') + p);
  }, [isEn]);

  const stats = useMemo(() => {
    if (!output) return null;
    const lines = output.split('\n').length;
    const bytes = new TextEncoder().encode(output).length;
    let keys = 0;
    let depth = 0;
    let typeCounts: Record<string, number> = {};
    try {
      const parsed = JSON.parse(output);
      keys = countKeys(parsed);
      depth = getDepth(parsed);
      typeCounts = getTypeCounts(parsed);
    } catch {}
    return { lines, bytes, keys, depth, typeCounts };
  }, [output]);

  const highlightedHtml = useMemo(() => {
    if (!output || lastAction === 'validate' || viewMode !== 'raw') return '';
    return syntaxHighlight(output, isDark);
  }, [output, lastAction, isDark, viewMode]);

  const outputLineCount = output ? output.split('\n').length : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-4 sm:p-6">
        <Textarea
          rows={10}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setOutput('');
            setError(null);
            setLastAction('');
          }}
          placeholder={isEn ? 'Paste strict JSON here' : 'Вставьте JSON сюда'}
          className="mb-3 font-mono text-sm"
          spellCheck={false}
        />

        <ToolPrimaryAction
          type="button"
          onClick={formatJson}
          disabled={!input.trim()}
          leadingIcon={<BracketsCurly size={20} />}
        >
          {isEn ? 'Format JSON' : 'Форматировать JSON'}
        </ToolPrimaryAction>

        {error && (
          <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
            <div className="font-bold">{isEn ? 'JSON parsing error' : 'Ошибка парсинга JSON'}</div>
            <div className="mt-1 font-mono text-xs">{error.message}</div>
            {(error.line || error.position !== undefined) && (
              <div className="mt-1 text-xs opacity-80">
                {error.line && (isEn ? `Line ${error.line}` : `Строка ${error.line}`)}
                {error.column && (isEn ? `, col ${error.column}` : `, столбец ${error.column}`)}
                {error.position !== undefined && (isEn ? ` (pos ${error.position})` : ` (поз. ${error.position})`)}
              </div>
            )}
          </div>
        )}

        {lastAction === 'validate' && !error && !output && (
          <div className="mb-3 rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[color-mix(in_oklab,var(--color-success)_8%,transparent)] p-3 text-sm text-[var(--color-success)]">
            <CheckCircle size={14} weight="fill" className="mr-1 inline" />
            {isEn ? 'JSON is valid!' : 'JSON валиден!'}
          </div>
        )}

        {output && lastAction !== 'validate' && (
          <div>
            <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
              <div className="text-sm font-semibold">{isEn ? 'Result' : 'Результат'}</div>
              <CopyButton text={output} size="medium" />
            </div>
            <div className="hidden">
              <div className="inline-flex overflow-hidden rounded-[var(--radius-pill)] border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setViewMode('tree')}
                  aria-pressed={viewMode === 'tree'}
                  className={cn(
                    'inline-flex min-h-7 items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                    viewMode === 'tree'
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
                  )}
                >
                  <TreeStructure size={12} />
                  {isEn ? 'Tree' : 'Дерево'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  aria-pressed={viewMode === 'raw'}
                  className={cn(
                    'inline-flex min-h-7 items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
                    viewMode === 'raw'
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
                  )}
                >
                  <Code size={12} />
                  {isEn ? 'Raw' : 'Текст'}
                </button>
              </div>
              {viewMode === 'tree' && parsedTree !== null && typeof parsedTree === 'object' && (
                <>
                  <button
                    type="button"
                    onClick={expandAll}
                    className="inline-flex min-h-7 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  >
                    {isEn ? 'Expand all' : 'Развернуть всё'}
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="inline-flex min-h-7 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  >
                    {isEn ? 'Collapse all' : 'Свернуть всё'}
                  </button>
                  <div className="relative ml-auto w-full sm:w-56">
                    <MagnifyingGlass size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" />
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder={isEn ? 'Filter keys…' : 'Фильтр ключей…'}
                      className="h-7 pl-7 text-[11px]"
                    />
                  </div>
                </>
              )}
            </div>

            {viewMode === 'tree' && parsedTree !== null && typeof parsedTree === 'object' && (
              <div
                className="overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]"
                style={{ maxHeight: 450 }}
                onMouseLeave={() => setHoveredPath('')}
              >
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                    {isEn ? 'Click to copy' : 'Клик скопирует'}
                  </span>
                  <span className="truncate" style={{ color: 'var(--color-text)' }}>
                    {hoveredPath || '$'}
                  </span>
                </div>
                <div className="p-3">
                  <TreeNode
                    nodeKey={null}
                    value={parsedTree}
                    path="$"
                    depth={0}
                    isLast
                    expanded={expanded}
                    toggle={togglePath}
                    setHovered={setHoveredPath}
                    copyPath={copyPath}
                    searchTerm={searchTerm}
                    isDark={isDark}
                    isEn={isEn}
                  />
                </div>
              </div>
            )}

            {viewMode === 'tree' && (parsedTree === null || typeof parsedTree !== 'object') && (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 font-mono text-xs text-[var(--color-text-muted)]">
                {isEn ? 'Root value is a primitive — switch to Raw view.' : 'Корневое значение — примитив, переключитесь на «Текст».'}
              </div>
            )}

            {viewMode === 'raw' && (
              <div className="overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" style={{ maxHeight: 450 }}>
                <div className="flex">
                  {outputLineCount > 1 && (
                    <div className="shrink-0 select-none border-r border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-text)_3%,transparent)] p-3 pr-2 text-right" style={{ minWidth: 44 }}>
                      {Array.from({ length: outputLineCount }, (_, i) => (
                        <div key={i} className="font-mono text-xs leading-relaxed text-[var(--color-text-subtle)]">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex-1 overflow-auto p-3">
                    <pre
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedHtml) }}
                      className="m-0 whitespace-pre font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        <AdvancedSettings
          className="mt-4 [&_button]:min-h-11 [&_label]:min-h-11 [&_input]:min-h-11 [&_select]:min-h-11"
          title={isEn ? 'More JSON tools' : 'Дополнительные настройки'}
          description={isEn ? 'Indentation, validation, tree view and export' : 'Отступы, проверка, дерево и экспорт'}
        >
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-sm font-medium">{isEn ? 'Indent' : 'Отступ'}</div>
              <div className="flex flex-wrap gap-2">
                {([2, 4, '\t'] as const).map((value) => (
                  <Pill
                    key={String(value)}
                    active={indent === value}
                    onClick={() => {
                      setIndent(value);
                      setOutput('');
                      setLastAction('');
                    }}
                  >
                    {value === '\t' ? 'Tab' : `${value} spaces`}
                  </Pill>
                ))}
                <Pill
                  active={sortKeys}
                  onClick={() => {
                    setSortKeys(!sortKeys);
                    setOutput('');
                    setLastAction('');
                  }}
                >
                  {isEn ? 'Sort keys A–Z' : 'Сортировать ключи'}
                </Pill>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const pasted = await pasteText();
                  if (pasted !== null) {
                    setInput(pasted);
                    setOutput('');
                    setError(null);
                    setLastAction('');
                  }
                }}
                disabled={pasting}
              >
                <ClipboardText size={18} /> {isEn ? 'Paste' : 'Вставить'}
              </Button>
              <Button type="button" variant="outline" onClick={minifyJson} disabled={!input.trim()}>
                <ArrowsInLineHorizontal size={18} /> {isEn ? 'Minify' : 'Минифицировать'}
              </Button>
              <Button type="button" variant="outline" onClick={validateJson} disabled={!input.trim()}>
                <CheckCircle size={18} /> {isEn ? 'Validate' : 'Проверить'}
              </Button>
              <Button type="button" variant="outline" onClick={clear}>
                <TrashSimple size={18} /> {isEn ? 'Clear' : 'Очистить'}
              </Button>
              <Button type="button" variant="outline" onClick={downloadJson} disabled={!output}>
                <DownloadSimple size={18} /> JSON
              </Button>
              <Button type="button" variant="outline" onClick={escapeString} disabled={!output}>
                <Code size={18} /> {isEn ? 'Copy escaped' : 'Копировать escaped'}
              </Button>
              <Button type="button" variant="outline" onClick={toPythonDict} disabled={!output}>
                <FileText size={18} /> Python dict
              </Button>
            </div>

            {output && lastAction !== 'validate' && (
              <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
                <label className="grid gap-1.5 text-sm font-medium">
                  {isEn ? 'Result view' : 'Вид результата'}
                  <select
                    value={viewMode}
                    onChange={(event) => setViewMode(event.target.value as 'tree' | 'raw')}
                    className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                  >
                    <option value="raw">{isEn ? 'Formatted text' : 'Форматированный текст'}</option>
                    <option value="tree">{isEn ? 'Tree' : 'Дерево'}</option>
                  </select>
                </label>
                {viewMode === 'tree' && parsedTree !== null && typeof parsedTree === 'object' && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button type="button" variant="outline" onClick={expandAll}>
                      {isEn ? 'Expand all' : 'Развернуть всё'}
                    </Button>
                    <Button type="button" variant="outline" onClick={collapseAll}>
                      {isEn ? 'Collapse all' : 'Свернуть всё'}
                    </Button>
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={isEn ? 'Filter keys' : 'Фильтр ключей'}
                    />
                  </div>
                )}
                {stats && (
                  <div className="flex flex-wrap gap-2 text-sm text-[var(--color-text-muted)]">
                    <span>{stats.lines} {isEn ? 'lines' : 'строк'}</span>
                    <span>· {stats.bytes.toLocaleString()} {isEn ? 'bytes' : 'байт'}</span>
                    <span>· {stats.keys} {isEn ? 'keys' : 'ключей'}</span>
                    <span>· {isEn ? 'depth' : 'глубина'} {stats.depth}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </AdvancedSettings>
      </Card>
    </div>
  );
}
