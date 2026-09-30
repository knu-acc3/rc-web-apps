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

type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type Justify = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
type Align = 'stretch' | 'flex-start' | 'center' | 'flex-end' | 'baseline';
type Wrap = 'nowrap' | 'wrap' | 'wrap-reverse';

interface ItemOptions {
  grow: number;
  shrink: number;
  basis: string;
  alignSelf: string;
}

const DEFAULT_ITEM: ItemOptions = { grow: 0, shrink: 1, basis: 'auto', alignSelf: 'auto' };

export default function FlexboxPlayground() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [direction, setDirection] = useState<Direction>('row');
  const [justify, setJustify] = useState<Justify>('flex-start');
  const [align, setAlign] = useState<Align>('stretch');
  const [wrap, setWrap] = useState<Wrap>('wrap');
  const [gap, setGap] = useState(12);
  const [itemCount, setItemCount] = useState(5);
  const [selectedItem, setSelectedItem] = useState(0);
  const [itemOptions, setItemOptions] = useState<Record<number, ItemOptions>>({});
  const [copied, setCopied] = useState(false);

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap,
    gap: `${gap}px`,
  };

  const selectedOptions = itemOptions[selectedItem] ?? DEFAULT_ITEM;
  const generatedCss = useMemo(() => {
    const lines = [
      '.container {',
      '  display: flex;',
      `  flex-direction: ${direction};`,
      `  justify-content: ${justify};`,
      `  align-items: ${align};`,
      `  flex-wrap: ${wrap};`,
      `  gap: ${gap}px;`,
      '}',
    ];
    Object.entries(itemOptions).forEach(([index, options]) => {
      if (options.grow === 0 && options.shrink === 1 && options.basis === 'auto' && options.alignSelf === 'auto') return;
      lines.push('', `.item-${Number(index) + 1} {`, `  flex: ${options.grow} ${options.shrink} ${options.basis};`, `  align-self: ${options.alignSelf};`, '}');
    });
    return lines.join('\n');
  }, [align, direction, gap, itemOptions, justify, wrap]);

  const updateSelected = useCallback((patch: Partial<ItemOptions>) => {
    setItemOptions((current) => ({
      ...current,
      [selectedItem]: { ...(current[selectedItem] ?? DEFAULT_ITEM), ...patch },
    }));
  }, [selectedItem]);

  const copyCss = useCallback(async () => {
    if (await writeClipboardText(generatedCss)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }, [generatedCss]);

  const reset = useCallback(() => {
    setDirection('row');
    setJustify('flex-start');
    setAlign('stretch');
    setWrap('wrap');
    setGap(12);
    setItemCount(5);
    setSelectedItem(0);
    setItemOptions({});
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="flex-direction">flex-direction</Label>
            <select id="flex-direction" className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={direction} onChange={(event) => setDirection(event.target.value as Direction)}>
              <option value="row">row</option><option value="row-reverse">row-reverse</option><option value="column">column</option><option value="column-reverse">column-reverse</option>
            </select>
          </div>
          <div>
            <Label htmlFor="flex-justify">justify-content</Label>
            <select id="flex-justify" className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={justify} onChange={(event) => setJustify(event.target.value as Justify)}>
              <option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="space-between">space-between</option><option value="space-around">space-around</option><option value="space-evenly">space-evenly</option>
            </select>
          </div>
          <div>
            <Label htmlFor="flex-align">align-items</Label>
            <select id="flex-align" className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={align} onChange={(event) => setAlign(event.target.value as Align)}>
              <option value="stretch">stretch</option><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="baseline">baseline</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div id="flex-preview" className="min-h-72 overflow-auto rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-4" style={containerStyle}>
          {Array.from({ length: itemCount }, (_, index) => {
            const options = itemOptions[index] ?? DEFAULT_ITEM;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedItem(index)}
                className={cn('min-h-11 min-w-14 rounded-[var(--radius-md)] border-2 bg-[var(--color-surface)] p-3 font-mono font-semibold shadow-sm', selectedItem === index ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border)]')}
                style={{ flexGrow: options.grow, flexShrink: options.shrink, flexBasis: options.basis, alignSelf: options.alignSelf }}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">{isEn ? 'Tap an item for item-specific settings.' : 'Нажмите на элемент для его индивидуальных настроек.'}</p>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="lg" className="h-11 w-full sm:w-auto min-w-[200px] px-6 shadow-sm" onClick={copyCss}>
          {copied ? <CheckCircle size={20} weight="fill" /> : <ClipboardText size={20} />}
          {copied ? (isEn ? 'CSS copied' : 'CSS скопирован') : (isEn ? 'Copy CSS' : 'Копировать CSS')}
        </Button>
      </div>

      <AdvancedSettings title={isEn ? 'Wrap, gap and flex item' : 'Перенос, отступ и flex-элемент'} description={isEn ? 'Container details and selected item properties' : 'Детали контейнера и свойства выбранного элемента'}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="flex-wrap">flex-wrap</Label>
              <select id="flex-wrap" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={wrap} onChange={(event) => setWrap(event.target.value as Wrap)}>
                <option value="nowrap">nowrap</option><option value="wrap">wrap</option><option value="wrap-reverse">wrap-reverse</option>
              </select>
            </div>
            <div>
              <Label htmlFor="flex-gap">gap (px)</Label>
              <Input id="flex-gap" className="mt-1.5 h-11" type="number" min={0} max={96} value={gap} onChange={(event) => setGap(Math.max(0, Math.min(96, Number(event.target.value) || 0)))} />
            </div>
            <div>
              <Label htmlFor="flex-count">{isEn ? 'Items' : 'Элементов'}</Label>
              <Input id="flex-count" className="mt-1.5 h-11" type="number" min={1} max={12} value={itemCount} onChange={(event) => {
                const count = Math.max(1, Math.min(12, Number(event.target.value) || 1));
                setItemCount(count);
                setSelectedItem((current) => Math.min(current, count - 1));
              }} />
            </div>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-4">
            <div className="mb-3 text-sm font-semibold">{isEn ? `Item ${selectedItem + 1}` : `Элемент ${selectedItem + 1}`}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="flex-grow">flex-grow</Label><Input id="flex-grow" className="mt-1.5 h-11" type="number" min={0} max={10} value={selectedOptions.grow} onChange={(event) => updateSelected({ grow: Number(event.target.value) || 0 })} /></div>
              <div><Label htmlFor="flex-shrink">flex-shrink</Label><Input id="flex-shrink" className="mt-1.5 h-11" type="number" min={0} max={10} value={selectedOptions.shrink} onChange={(event) => updateSelected({ shrink: Number(event.target.value) || 0 })} /></div>
              <div><Label htmlFor="flex-basis">flex-basis</Label><Input id="flex-basis" className="mt-1.5 h-11 font-mono" value={selectedOptions.basis} onChange={(event) => updateSelected({ basis: event.target.value })} /></div>
              <div><Label htmlFor="flex-self">align-self</Label><select id="flex-self" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={selectedOptions.alignSelf} onChange={(event) => updateSelected({ alignSelf: event.target.value })}><option value="auto">auto</option><option value="stretch">stretch</option><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option></select></div>
            </div>
          </div>

          <Button variant="outline" className="min-h-11" onClick={reset}><ArrowCounterClockwise size={18} /> {isEn ? 'Reset playground' : 'Сбросить площадку'}</Button>
        </div>
      </AdvancedSettings>
    </div>
  );
}
