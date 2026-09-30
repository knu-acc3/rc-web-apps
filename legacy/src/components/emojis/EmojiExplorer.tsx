'use client';

import React, { useState, useMemo } from 'react';
import type { EmojiItem } from '@/src/types/emojis';
import { VirtualGrid } from '@/src/components/ui/virtual-grid';
import { Copy, Trash, Backspace, Check } from '@phosphor-icons/react';
import { Button } from '@/src/components/ui/button';
import { writeClipboardText } from '@/src/utils/clipboard';

export interface EmojiExplorerProps {
  readonly initialEmojis: readonly EmojiItem[];
  readonly categoryName?: string;
}

const SKIN_TONES = [
  { tone: '', label: '🟡', title: 'Default' },
  { tone: '\u{1F3FB}', label: '🏻', title: 'Light' },
  { tone: '\u{1F3FC}', label: '🏼', title: 'Medium-Light' },
  { tone: '\u{1F3FD}', label: '🏽', title: 'Medium' },
  { tone: '\u{1F3FE}', label: '🏾', title: 'Medium-Dark' },
  { tone: '\u{1F3FF}', label: '🏿', title: 'Dark' },
];

function applySkinTone(char: string, tone: string): string {
  if (!tone) return char.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
  if (/[\u{1F3FB}-\u{1F3FF}]/u.test(char)) {
    return char.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, tone);
  }
  return char + tone;
}

export function EmojiExplorer({ initialEmojis, categoryName }: EmojiExplorerProps) {
  const [search, setSearch] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [composedSentence, setComposedSentence] = useState('');
  const [copiedSentence, setCopiedSentence] = useState(false);
  const [copiedChar, setCopiedChar] = useState<string | null>(null);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return initialEmojis;
    const q = search.toLowerCase();
    return initialEmojis.filter(
      (e) =>
        e.nameRu.toLowerCase().includes(q) ||
        e.nameEn.toLowerCase().includes(q) ||
        e.keywordsRu.some((k) => k.toLowerCase().includes(q)) ||
        e.keywordsEn.some((k) => k.toLowerCase().includes(q)),
    );
  }, [search, initialEmojis]);

  const handleEmojiClick = (char: string) => {
    const finalChar = applySkinTone(char, selectedTone);
    // Append to sentence composer
    setComposedSentence((prev) => prev + finalChar);

    // Also flash copy notice
    try {
      navigator.clipboard.writeText(finalChar);
    } catch {
      // ignore
    }
    setCopiedChar(finalChar);
    setTimeout(() => setCopiedChar(null), 1200);
  };

  const handleCopySentence = async () => {
    if (!composedSentence) return;
    if (await writeClipboardText(composedSentence)) {
      setCopiedSentence(true);
      setTimeout(() => setCopiedSentence(false), 1500);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full p-2 sm:p-4">
      {categoryName && <h2 className="text-xl font-bold">{categoryName}</h2>}

      {/* Emoji Sentence Composer Bar */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 flex items-center justify-between">
          <span>Emoji Sentence Composer (Строка составления эмодзи)</span>
          <span className="font-mono text-[10px] text-[var(--color-text-subtle)]">
            {composedSentence ? `${Array.from(composedSentence).length} символов` : 'Кликните на эмодзи'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-xl overflow-x-auto tracking-wider font-emoji select-all">
            {composedSentence || (
              <span className="text-xs text-[var(--color-text-subtle)] font-sans">
                Нажимайте на эмодзи ниже для составления фразы…
              </span>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleCopySentence}
            disabled={!composedSentence}
            className="h-11 px-3 gap-1.5 font-semibold text-xs"
            title="Скопировать всю фразу"
          >
            {copiedSentence ? <Check size={16} /> : <Copy size={16} />}
            {copiedSentence ? 'Скопировано!' : 'Копировать'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setComposedSentence((prev) => Array.from(prev).slice(0, -1).join(''))}
            disabled={!composedSentence}
            className="h-11 px-2.5 text-muted-foreground"
            title="Удалить последний символ"
          >
            <Backspace size={18} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setComposedSentence('')}
            disabled={!composedSentence}
            className="h-11 px-2.5 text-[var(--color-danger)]"
            title="Очистить всё"
          >
            <Trash size={17} />
          </Button>
        </div>
      </div>

      {/* Search and Fitzpatrick Skin Tone Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          placeholder="Поиск по эмодзи (улыбка, кот, огонь, рука, сердце)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-h-[44px] px-4 rounded-xl border bg-card text-foreground text-sm"
        />

        {/* Skin Tone Selector (Fitzpatrick Scale) */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 self-start sm:self-auto">
          <span className="px-2 text-[11px] font-semibold text-muted-foreground">Тон кожи:</span>
          {SKIN_TONES.map((st) => (
            <button
              key={st.title}
              type="button"
              onClick={() => setSelectedTone(st.tone)}
              title={st.title}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-base transition-all ${
                selectedTone === st.tone
                  ? 'bg-[var(--color-primary-soft)] ring-1 ring-[var(--color-primary)]'
                  : 'hover:bg-secondary'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {copiedChar && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-2xl animate-fade-in flex items-center gap-1.5">
          <Check size={18} />
          <span>Скопировано: {copiedChar}</span>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Найдено: {filteredEmojis.length} эмодзи
      </div>

      <VirtualGrid
        items={filteredEmojis}
        itemHeight={56}
        minColumnWidth={56}
        renderItem={(e) => {
          const charWithTone = applySkinTone(e.char, selectedTone);
          return (
            <button
              key={e.id}
              onClick={() => handleEmojiClick(e.char)}
              title={`${e.nameRu} / ${e.nameEn}`}
              className="flex items-center justify-center w-full h-full text-2xl rounded-xl border bg-card hover:bg-secondary active:scale-95 transition-all select-none"
            >
              {charWithTone}
            </button>
          );
        }}
      />
    </div>
  );
}
