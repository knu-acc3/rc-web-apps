'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { CheckCircle, ClipboardText, Trash, Columns, Rows } from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { cn } from '@/src/lib/cn';
import { writeClipboardText } from '@/src/utils/clipboard';
import { generateDiffOutput, type DiffLineResult, type DiffOutput } from '@/src/lib/diff/myersDiff';
import { useUrlState } from '@/src/hooks/useUrlState';
import { useToolState } from '@/src/hooks/useToolState';
import { DraftControls } from '@/src/components/tool/DraftControls';
import { ToolPipeDropdown } from '@/src/components/tool/ToolPipeDropdown';

type ViewMode = 'unified' | 'split';

export default function DiffChecker() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const { state: urlState, setState: setUrlState } = useUrlState({
    defaultValues: {
      original: '',
      modified: '',
    },
    hashKeys: ['original', 'modified'],
  });

  const {
    state: draftState,
    setState: setDraftState,
    hasDraft,
    isDirty,
    restoreDraft,
    clearDraft,
  } = useToolState('diff-checker', { original: '', modified: '' });

  const [original, setOriginalLocal] = useState(urlState.original || draftState.original);
  const [modified, setModifiedLocal] = useState(urlState.modified || draftState.modified);

  const setOriginal = (val: string) => {
    setOriginalLocal(val);
    setUrlState({ original: val });
    setDraftState((prev) => ({ ...prev, original: val }));
  };

  const setModified = (val: string) => {
    setModifiedLocal(val);
    setUrlState({ modified: val });
    setDraftState((prev) => ({ ...prev, modified: val }));
  };

  // Sync if urlState loaded from deep link
  React.useEffect(() => {
    if (urlState.original && !original) setOriginalLocal(urlState.original);
    if (urlState.modified && !modified) setModifiedLocal(urlState.modified);
  }, [urlState.original, urlState.modified, original, modified]);

  const [viewMode, setViewMode] = useState<ViewMode>('unified');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreBlank, setIgnoreBlank] = useState(false);
  const [showUnchanged, setShowUnchanged] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  const [result, setResult] = useState<DiffOutput>(() =>
    generateDiffOutput(original, modified, {
      ignoreWhitespace,
      ignoreCase,
      ignoreBlank,
    }),
  );

  const workerRef = React.useRef<Worker | null>(null);
  const taskCounterRef = React.useRef(0);

  React.useEffect(() => {
    let worker: Worker | null = null;
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        worker = new Worker(new URL('../../workers/diff.worker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;
      } catch {
        workerRef.current = null;
      }
    }
    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const opts = { ignoreWhitespace, ignoreCase, ignoreBlank };
    const totalLen = (original?.length || 0) + (modified?.length || 0);

    // Fast synchronous diff for small to moderate inputs
    if (totalLen < 6000) {
      setResult(generateDiffOutput(original, modified, opts));
      setIsComputing(false);
      return;
    }

    // Heavy inputs: offload to background worker
    setIsComputing(true);
    const worker = workerRef.current;
    const taskId = String(++taskCounterRef.current);

    if (worker) {
      const onMessage = (e: MessageEvent<{ taskId: string; success: boolean; result?: DiffOutput }>) => {
        if (e.data.taskId === taskId && e.data.success && e.data.result) {
          setResult(e.data.result);
          setIsComputing(false);
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage({ taskId, oldText: original, newText: modified, options: opts });
      return () => {
        worker.removeEventListener('message', onMessage);
      };
    } else {
      const timer = setTimeout(() => {
        setResult(generateDiffOutput(original, modified, opts));
        setIsComputing(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [original, modified, ignoreWhitespace, ignoreCase, ignoreBlank]);

  const visibleLines = showUnchanged ? result.lines : result.lines.filter((line) => line.type !== 'same');

  const copyPatch = useCallback(async () => {
    if (await writeClipboardText(result.unifiedPatch)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [result.unifiedPatch]);

  // Split view pairing
  const splitRows = useMemo(() => {
    const rows: Array<{ left?: DiffLineResult; right?: DiffLineResult }> = [];
    let i = 0;
    while (i < result.lines.length) {
      const line = result.lines[i];
      if (line.type === 'same') {
        rows.push({ left: line, right: line });
        i++;
      } else if (line.type === 'remove' && result.lines[i + 1]?.type === 'add') {
        rows.push({ left: line, right: result.lines[i + 1] });
        i += 2;
      } else if (line.type === 'remove') {
        rows.push({ left: line, right: undefined });
        i++;
      } else {
        rows.push({ left: undefined, right: line });
        i++;
      }
    }
    return rows;
  }, [result.lines]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DraftControls
          hasDraft={hasDraft}
          isDirty={isDirty}
          onRestore={() => {
            restoreDraft();
            if (draftState.original) setOriginal(draftState.original);
            if (draftState.modified) setModified(draftState.modified);
          }}
          onClear={() => {
            clearDraft();
            setOriginal('');
            setModified('');
          }}
          locale={locale}
        />
        {isComputing && (
          <span className="text-xs font-semibold text-[var(--color-primary)] animate-pulse">
            {isEn ? 'Calculating diff in worker…' : 'Вычисление различий в воркере…'}
          </span>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <Label htmlFor="diff-original">{isEn ? 'Original' : 'Исходный текст'}</Label>
          <Textarea
            id="diff-original"
            className="mt-1.5 min-h-56 font-mono text-sm lg:min-h-72"
            value={original}
            onChange={(event) => setOriginal(event.target.value)}
            placeholder={isEn ? 'Paste original text or code' : 'Вставьте исходный текст или код'}
            autoFocus
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <Label htmlFor="diff-modified">{isEn ? 'Modified' : 'Изменённый текст'}</Label>
          <Textarea
            id="diff-modified"
            className="mt-1.5 min-h-56 font-mono text-sm lg:min-h-72"
            value={modified}
            onChange={(event) => setModified(event.target.value)}
            placeholder={isEn ? 'Paste modified text or code' : 'Вставьте изменённый текст или код'}
          />
        </Card>
      </div>

      <Card className="overflow-hidden border-[var(--color-primary)]/25">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="font-semibold">{isEn ? 'Difference (Myers algorithm)' : 'Различия (алгоритм Майерса)'}</div>
            <div className="flex gap-2">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-[var(--color-success)]">
                +{result.additions}
              </span>
              <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-[var(--color-danger)]">
                −{result.removals}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--color-border)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('unified')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === 'unified' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                <Rows size={13} />
                Unified
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  viewMode === 'split' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                <Columns size={13} />
                Split
              </button>
            </div>

            <ToolPipeDropdown
              currentSlug="diff-checker"
              produces={['text']}
              getData={() => ({ type: 'text', payload: result.unifiedPatch, name: 'patch.diff' })}
              locale={locale}
            />
          </div>
        </div>

        {original || modified ? (
          viewMode === 'unified' ? (
            <div id="diff-result" className="max-h-[560px] overflow-auto font-mono text-xs sm:text-sm" aria-live="polite">
              {visibleLines.map((line, index) => (
                <div
                  key={`unified-${line.type}-${index}`}
                  className={cn(
                    'grid min-h-7 grid-cols-[38px_38px_24px_minmax(0,1fr)] border-b border-[var(--color-border-subtle)]',
                    line.type === 'add' && 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/25 dark:text-emerald-100',
                    line.type === 'remove' && 'bg-red-50 text-red-950 dark:bg-red-950/25 dark:text-red-100',
                  )}
                >
                  <span className="px-1 py-1 text-right text-xs text-[var(--color-text-muted)] opacity-60">
                    {line.oldLineNumber ?? ''}
                  </span>
                  <span className="px-1 py-1 text-right text-xs text-[var(--color-text-muted)] opacity-60">
                    {line.newLineNumber ?? ''}
                  </span>
                  <span className="py-1 text-center font-bold">
                    {line.type === 'add' ? '+' : line.type === 'remove' ? '−' : ' '}
                  </span>
                  <span className="whitespace-pre-wrap break-all px-2 py-1">
                    {line.wordParts && line.wordParts.length > 0 ? (
                      line.wordParts.map((wp, wpIdx) => (
                        <span
                          key={wpIdx}
                          className={cn(
                            wp.type === 'add' && 'bg-emerald-300 dark:bg-emerald-800/80 rounded px-0.5',
                            wp.type === 'remove' && 'bg-red-300 dark:bg-red-800/80 rounded px-0.5',
                          )}
                        >
                          {wp.text}
                        </span>
                      ))
                    ) : (
                      line.text || ' '
                    )}
                  </span>
                </div>
              ))}
              {visibleLines.length === 0 && (
                <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">
                  {isEn ? 'No differences under selected options.' : 'С выбранными настройками различий нет.'}
                </div>
              )}
            </div>
          ) : (
            <div id="diff-result-split" className="max-h-[560px] overflow-auto font-mono text-xs sm:text-sm">
              <div className="grid grid-cols-2 divide-x divide-[var(--color-border)]">
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {splitRows.map((row, idx) => (
                    <div
                      key={`left-${idx}`}
                      className={cn(
                        'flex min-h-7 items-start px-2 py-1',
                        row.left?.type === 'remove' && 'bg-red-50 dark:bg-red-950/25 text-red-900 dark:text-red-100',
                      )}
                    >
                      <span className="w-8 shrink-0 text-right pr-2 text-xs text-[var(--color-text-muted)] opacity-60">
                        {row.left?.oldLineNumber ?? ''}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1">
                        {row.left?.wordParts ? (
                          row.left.wordParts.map((wp, wpIdx) => (
                            <span key={wpIdx} className={cn(wp.type === 'remove' && 'bg-red-300 dark:bg-red-800 rounded px-0.5')}>
                              {wp.text}
                            </span>
                          ))
                        ) : (
                          row.left?.text || ' '
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {splitRows.map((row, idx) => (
                    <div
                      key={`right-${idx}`}
                      className={cn(
                        'flex min-h-7 items-start px-2 py-1',
                        row.right?.type === 'add' && 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-100',
                      )}
                    >
                      <span className="w-8 shrink-0 text-right pr-2 text-xs text-[var(--color-text-muted)] opacity-60">
                        {row.right?.newLineNumber ?? ''}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1">
                        {row.right?.wordParts ? (
                          row.right.wordParts.map((wp, wpIdx) => (
                            <span key={wpIdx} className={cn(wp.type === 'add' && 'bg-emerald-300 dark:bg-emerald-800 rounded px-0.5')}>
                              {wp.text}
                            </span>
                          ))
                        ) : (
                          row.right?.text || ' '
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
            {isEn ? 'Enter both versions to see a live line-by-line diff.' : 'Введите две версии, чтобы увидеть построчное сравнение.'}
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="lg" className="h-11 w-full sm:w-auto min-w-[200px] px-6 shadow-sm" onClick={copyPatch} disabled={!original && !modified}>
          {copied ? <CheckCircle size={20} weight="fill" /> : <ClipboardText size={20} />}
          {copied ? (isEn ? 'Patch copied' : 'Patch скопирован') : (isEn ? 'Copy unified diff' : 'Копировать unified diff')}
        </Button>
      </div>

      <AdvancedSettings
        title={isEn ? 'Comparison options' : 'Параметры сравнения'}
        description={isEn ? 'Whitespace, letter case, blank and unchanged lines' : 'Пробелы, регистр, пустые и неизменённые строки'}
      >
        <div className="space-y-3">
          {([
            [ignoreWhitespace, setIgnoreWhitespace, isEn ? 'Ignore whitespace differences' : 'Игнорировать различия в пробелах'],
            [ignoreCase, setIgnoreCase, isEn ? 'Ignore letter case' : 'Игнорировать регистр'],
            [ignoreBlank, setIgnoreBlank, isEn ? 'Ignore blank lines' : 'Игнорировать пустые строки'],
            [showUnchanged, setShowUnchanged, isEn ? 'Show unchanged lines' : 'Показывать неизменённые строки'],
          ] as const).map(([checked, setter, label]) => (
            <label key={label} className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm cursor-pointer">
              <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={checked} onChange={(event) => setter(event.target.checked)} /> {label}
            </label>
          ))}
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => {
              setOriginal('');
              setModified('');
            }}
            disabled={!original && !modified}
          >
            <Trash size={18} /> {isEn ? 'Clear both' : 'Очистить оба поля'}
          </Button>
        </div>
      </AdvancedSettings>
    </div>
  );
}
