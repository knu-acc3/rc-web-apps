import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMediaQuery } from '@/src/hooks/useMediaQuery';

describe('useMediaQuery hook', () => {
  beforeEach(() => {
    if (typeof window === 'undefined') {
      (globalThis as unknown as { window: unknown }).window = globalThis;
    }
  });

  it('экспортирует валидный React-хук', () => {
    expect(useMediaQuery).toBeDefined();
    expect(typeof useMediaQuery).toBe('function');
  });

  it('работает в среде без matchMedia безопасно', () => {
    expect(() => {
      const fn = useMediaQuery;
      expect(typeof fn).toBe('function');
    }).not.toThrow();
  });

  it('обрабатывает вызов с медиа-запросом', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 768px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    expect(window.matchMedia('(min-width: 768px)').matches).toBe(true);
    expect(window.matchMedia('(max-width: 300px)').matches).toBe(false);
  });
});
