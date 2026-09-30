'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface VirtualGridProps<T> {
  readonly items: readonly T[];
  readonly itemHeight: number;
  readonly minColumnWidth: number;
  readonly renderItem: (item: T, index: number) => React.ReactNode;
  readonly className?: string;
}

export function VirtualGrid<T>({
  items,
  itemHeight = 56,
  minColumnWidth = 56,
  renderItem,
  className = '',
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || 800);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const columns = Math.max(1, Math.floor(containerWidth / minColumnWidth));
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const visibleRowCount = 15;
  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endRow = Math.min(totalRows, startRow + visibleRowCount + 4);

  const visibleItems = useMemo(() => {
    const startIndex = startRow * columns;
    const endIndex = Math.min(items.length, endRow * columns);
    const slice = [];
    for (let i = startIndex; i < endIndex; i++) {
      slice.push({ item: items[i], index: i });
    }
    return { slice, startIndex };
  }, [items, startRow, endRow, columns]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: '560px', overflowY: 'auto' }}
      className={`relative w-full border rounded-2xl p-2 bg-card ${className}`}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: `${startRow * itemHeight}px`,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: '8px',
          }}
        >
          {visibleItems.slice.map(({ item, index }) => (
            <div key={index} style={{ height: `${itemHeight - 8}px` }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
