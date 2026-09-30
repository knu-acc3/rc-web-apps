'use client';

import type { CSSProperties } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ArrowCounterClockwise, CheckCircle, ClipboardText } from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/cn';
import { writeClipboardText } from '@/src/utils/clipboard';

interface GridItemOptions {
  column: string;
  row: string;
  justifySelf: string;
  alignSelf: string;
}

const DEFAULT_ITEM: GridItemOptions = { column: 'auto', row: 'auto', justifySelf: 'auto', alignSelf: 'auto' };

export default function GridPlayground() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [columns, setColumns] = useState('repeat(3, 1fr)');
  const [gap, setGap] = useState(12);
  const [rows, setRows] = useState('auto');
  const [justifyItems, setJustifyItems] = useState('stretch');
  const [alignItems, setAlignItems] = useState('stretch');
  const [autoFlow, setAutoFlow] = useState('row');
  const [itemCount, setItemCount] = useState(6);
  const [selectedItem, setSelectedItem] = useState(0);
  const [itemOptions, setItemOptions] = useState<Record<number, GridItemOptions>>({});
  const [copied, setCopied] = useState(false);

  const selectedOptions = itemOptions[selectedItem] ?? DEFAULT_ITEM;
  const containerStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: columns,
    gridTemplateRows: rows,
    gap: `${gap}px`,
    justifyItems,
    alignItems,
    gridAutoFlow: autoFlow as CSSProperties['gridAutoFlow'],
  };

  const generatedCss = useMemo(() => {
    const lines = [
      '.container {',
      '  display: grid;',
      `  grid-template-columns: ${columns};`,
      `  grid-template-rows: ${rows};`,
      `  gap: ${gap}px;`,
      `  justify-items: ${justifyItems};`,
      `  align-items: ${alignItems};`,
      `  grid-auto-flow: ${autoFlow};`,
      '}',
    ];
    Object.entries(itemOptions).forEach(([index, options]) => {
      if (options.column === 'auto' && options.row === 'auto' && options.justifySelf === 'auto' && options.alignSelf === 'auto') return;
      lines.push('', `.item-${Number(index) + 1} {`, `  grid-column: ${options.column};`, `  grid-row: ${options.row};`, `  justify-self: ${options.justifySelf};`, `  align-self: ${options.alignSelf};`, '}');
    });
    return lines.join('\n');
  }, [alignItems, autoFlow, columns, gap, itemOptions, justifyItems, rows]);

  const updateSelected = useCallback((patch: Partial<GridItemOptions>) => {
    setItemOptions((current) => ({ ...current, [selectedItem]: { ...(current[selectedItem] ?? DEFAULT_ITEM), ...patch } }));
  }, [selectedItem]);

  const copyCss = useCallback(async () => {
    if (await writeClipboardText(generatedCss)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [generatedCss]);

  const reset = useCallback(() => {
    setColumns('repeat(3, 1fr)');
    setGap(12);
    setRows('auto');
    setJustifyItems('stretch');
    setAlignItems('stretch');
    setAutoFlow('row');
    setItemCount(6);
    setSelectedItem(0);
    setItemOptions({});
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div>
            <Label htmlFor="grid-columns">grid-template-columns</Label>
            <Input id="grid-columns" className="mt-1.5 h-12 font-mono text-base" value={columns} onChange={(event) => setColumns(event.target.value)} autoFocus />
          </div>
          <label className="block text-sm">
            <span className="font-medium">gap: {gap}px</span>
            <input id="grid-gap" className="mt-2 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0} max={64} value={gap} onChange={(event) => setGap(Number(event.target.value))} />
          </label>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div id="grid-preview" className="min-h-72 overflow-auto rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-4" style={containerStyle}>
          {Array.from({ length: itemCount }, (_, index) => {
            const options = itemOptions[index] ?? DEFAULT_ITEM;
            return (
              <button key={index} type="button" onClick={() => setSelectedItem(index)} className={cn('min-h-12 rounded-[var(--radius-md)] border-2 bg-[var(--color-surface)] p-3 font-mono font-semibold shadow-sm', selectedItem === index ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border)]')} style={{ gridColumn: options.column, gridRow: options.row, justifySelf: options.justifySelf, alignSelf: options.alignSelf }}>
                {index + 1}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">{isEn ? 'Tap an item for placement settings.' : 'Нажмите на элемент для настройки размещения.'}</p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="lg" className="h-11 w-full sm:w-auto min-w-[200px] px-6 shadow-sm" onClick={copyCss}>
          {copied ? <CheckCircle size={20} weight="fill" /> : <ClipboardText size={20} />}
          {copied ? (isEn ? 'CSS copied' : 'CSS скопирован') : (isEn ? 'Copy CSS' : 'Копировать CSS')}
        </Button>
      </div>

      <AdvancedSettings title={isEn ? 'Rows, alignment and grid item' : 'Строки, выравнивание и grid-элемент'} description={isEn ? 'Container details and selected item placement' : 'Детали контейнера и положение выбранного элемента'}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="grid-rows">grid-template-rows</Label><Input id="grid-rows" className="mt-1.5 h-11 font-mono" value={rows} onChange={(event) => setRows(event.target.value)} /></div>
            <div><Label htmlFor="grid-flow">grid-auto-flow</Label><select id="grid-flow" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={autoFlow} onChange={(event) => setAutoFlow(event.target.value)}><option value="row">row</option><option value="column">column</option><option value="row dense">row dense</option><option value="column dense">column dense</option></select></div>
            <div><Label htmlFor="grid-justify-items">justify-items</Label><select id="grid-justify-items" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={justifyItems} onChange={(event) => setJustifyItems(event.target.value)}><option value="stretch">stretch</option><option value="start">start</option><option value="center">center</option><option value="end">end</option></select></div>
            <div><Label htmlFor="grid-align-items">align-items</Label><select id="grid-align-items" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={alignItems} onChange={(event) => setAlignItems(event.target.value)}><option value="stretch">stretch</option><option value="start">start</option><option value="center">center</option><option value="end">end</option></select></div>
            <div><Label htmlFor="grid-count">{isEn ? 'Items' : 'Элементов'}</Label><Input id="grid-count" className="mt-1.5 h-11" type="number" min={1} max={16} value={itemCount} onChange={(event) => { const count = Math.max(1, Math.min(16, Number(event.target.value) || 1)); setItemCount(count); setSelectedItem((current) => Math.min(current, count - 1)); }} /></div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-4">
            <div className="mb-3 text-sm font-semibold">{isEn ? `Item ${selectedItem + 1}` : `Элемент ${selectedItem + 1}`}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="grid-item-column">grid-column</Label><Input id="grid-item-column" className="mt-1.5 h-11 font-mono" value={selectedOptions.column} onChange={(event) => updateSelected({ column: event.target.value })} /></div>
              <div><Label htmlFor="grid-item-row">grid-row</Label><Input id="grid-item-row" className="mt-1.5 h-11 font-mono" value={selectedOptions.row} onChange={(event) => updateSelected({ row: event.target.value })} /></div>
              <div><Label htmlFor="grid-item-justify">justify-self</Label><select id="grid-item-justify" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={selectedOptions.justifySelf} onChange={(event) => updateSelected({ justifySelf: event.target.value })}><option value="auto">auto</option><option value="stretch">stretch</option><option value="start">start</option><option value="center">center</option><option value="end">end</option></select></div>
              <div><Label htmlFor="grid-item-align">align-self</Label><select id="grid-item-align" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={selectedOptions.alignSelf} onChange={(event) => updateSelected({ alignSelf: event.target.value })}><option value="auto">auto</option><option value="stretch">stretch</option><option value="start">start</option><option value="center">center</option><option value="end">end</option></select></div>
            </div>
          </div>

          <Button variant="outline" className="min-h-11" onClick={reset}><ArrowCounterClockwise size={18} /> {isEn ? 'Reset playground' : 'Сбросить площадку'}</Button>
        </div>
      </AdvancedSettings>
    </div>
  );
}
