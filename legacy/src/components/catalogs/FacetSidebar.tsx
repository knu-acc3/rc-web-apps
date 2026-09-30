'use client';

import React from 'react';

export interface FacetSidebarProps {
  readonly categories: readonly string[];
  readonly selectedCategory: string | null;
  readonly onSelectCategory: (category: string | null) => void;
}

export function FacetSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: FacetSidebarProps) {
  if (categories.length <= 1) return null;

  return (
    <aside className="w-full md:w-64 flex flex-col gap-2 p-4 border rounded-2xl bg-card">
      <h3 className="font-bold text-sm text-foreground mb-2">Категории</h3>
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3 py-2 text-left rounded-xl text-xs font-semibold transition-all ${
          selectedCategory === null
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-secondary text-muted-foreground'
        }`}
      >
        Все категории
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelectCategory(cat)}
          className={`px-3 py-2 text-left rounded-xl text-xs font-semibold capitalize transition-all ${
            selectedCategory === cat
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-secondary text-muted-foreground'
          }`}
        >
          {cat}
        </button>
      ))}
    </aside>
  );
}
