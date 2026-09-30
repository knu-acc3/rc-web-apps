'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { FacetSidebar } from './FacetSidebar';

export interface CatalogCardItem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly heading?: string;
  readonly description: string;
  readonly category?: string;
}

export interface CatalogCardGridProps {
  readonly catalogId: string;
  readonly locale: string;
  readonly items: readonly CatalogCardItem[];
}

export function CatalogCardGrid({
  catalogId,
  locale,
  items,
}: CatalogCardGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat =
        selectedCategory === null || item.category === selectedCategory;
      const matchSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, search]);

  const isEn = locale === 'en';

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto">
      <FacetSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <div className="flex-1 flex flex-col gap-4">
        <input
          type="text"
          placeholder={isEn ? "Search catalog..." : "Поиск по каталогу..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-[44px] px-4 rounded-xl border bg-card text-foreground"
        />

        <div className="text-xs text-muted-foreground">
          {isEn ? `Showing: ${filteredItems.length} entries` : `Показано: ${filteredItems.length} записей`}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.slice(0, 60).map((item) => (
            <Link
              key={item.id}
              href={`/${locale}/catalog/${catalogId}/${item.slug}`}
              className="p-4 border rounded-2xl bg-card hover:border-primary transition-all flex flex-col justify-between gap-2 group"
            >
              <div>
                <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>
              {item.category && (
                <span className="text-[10px] uppercase font-semibold text-muted-foreground/80 px-2 py-0.5 bg-secondary rounded-lg self-start">
                  {item.category}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
