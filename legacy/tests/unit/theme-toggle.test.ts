import { describe, it, expect } from 'vitest';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';

describe('ThemeToggle component', () => {
  it('экспортирует валидный функциональный компонент React', () => {
    expect(ThemeToggle).toBeDefined();
    expect(typeof ThemeToggle).toBe('function');
  });
});
