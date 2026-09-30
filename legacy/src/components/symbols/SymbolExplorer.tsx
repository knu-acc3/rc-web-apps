'use client';

import React, { useState, useMemo } from 'react';
import type { SymbolItem, KaomojiItem } from '@/src/types/symbols';
import { VirtualGrid } from '@/src/components/ui/virtual-grid';

export interface SymbolExplorerProps {
  readonly symbols: readonly SymbolItem[];
  readonly kaomoji?: readonly KaomojiItem[];
  readonly categoryName?: string;
}

export function SymbolExplorer({ symbols, kaomoji = [], categoryName }: SymbolExplorerProps) {
  const [search, setSearch] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const filteredSymbols = useMemo(() => {
    if (!search.trim()) return symbols;
    const q = search.toLowerCase();
    return symbols.filter(
      (s) =>
        s.char.includes(q) ||
        s.nameRu.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [search, symbols]);

  const filteredKaomoji = useMemo(() => {
    if (!search.trim()) return kaomoji;
    const q = search.toLowerCase();
    return kaomoji.filter(
      (k) =>
        k.text.includes(q) ||
        (k.tags && k.tags.some((t) => t.toLowerCase().includes(q))) ||
        k.category.toLowerCase().includes(q)
    );
  }, [search, kaomoji]);

  const handleCopy = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // fallback
    }
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  return (
    <div className="flex flex-col gap-6 w-full p-2 sm:p-4">
      {categoryName && <h2 className="text-xl font-bold">{categoryName}</h2>}

      <input
        type="text"
        placeholder="Поиск символов и каомодзи (стрелка, валюта, сердечко, радость)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full min-h-[48px] px-4 rounded-xl border bg-card text-foreground"
      />

      {copiedText && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-2xl animate-fade-in">
          Скопировано: {copiedText}
        </div>
      )}

      {/* Symbols Virtual Grid */}
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-muted-foreground">
          Символы ({filteredSymbols.length})
        </h3>
        <VirtualGrid
          items={filteredSymbols}
          itemHeight={56}
          minColumnWidth={56}
          renderItem={(s) => (
            <button
              onClick={() => handleCopy(s.char)}
              title={`${s.nameRu} / ${s.nameEn}`}
              className="flex items-center justify-center w-full h-full text-2xl rounded-xl border bg-card hover:bg-secondary active:scale-95 transition-all select-none"
            >
              {s.char}
            </button>
          )}
        />
      </div>

      {/* Kaomoji list */}
      {filteredKaomoji.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-muted-foreground">
            Каомодзи ({filteredKaomoji.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredKaomoji.map((k) => (
              <button
                key={k.id}
                onClick={() => handleCopy(k.text)}
                title={k.category}
                className="min-h-[48px] px-3 py-2 border rounded-xl bg-card hover:bg-secondary font-mono text-sm active:scale-95 transition-all flex items-center justify-center text-center truncate"
              >
                {k.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
