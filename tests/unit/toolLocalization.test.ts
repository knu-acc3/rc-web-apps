import { describe, expect, it } from 'vitest';
import { tools, type Tool } from '@/src/data/tools';
import {
  getToolSeoDescription,
  getToolSeoTitle,
} from '@/src/data/toolLocalization';

const tool: Tool = {
  id: 'temperature-converter',
  slug: 'temperature-converter',
  name: 'Конвертер температуры',
  nameEn: 'Temperature Converter',
  description: 'Перевод температуры',
  descriptionEn: 'Convert between Celsius, Fahrenheit and Kelvin.',
  keywords: ['температура', 'celsius', 'fahrenheit', 'kelvin'],
  icon: 'Thermostat',
  groupId: 'converters',
  implemented: true,
};

describe('English tool metadata fallbacks', () => {
  it('builds a distinct title around the localized tool name', () => {
    expect(getToolSeoTitle(tool, 'en')).toBe(
      'Temperature Converter — Free Online Tool',
    );
  });

  it('normalizes punctuation and keeps the description within snippet length', () => {
    const description = getToolSeoDescription(tool, 'en');

    expect(description).toContain('Temperature Converter');
    expect(description).not.toContain('..');
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('preserves bespoke metadata verbatim', () => {
    expect(
      getToolSeoDescription(
        { ...tool, seoDescriptionEn: 'A deliberately authored description.' },
        'en',
      ),
    ).toBe('A deliberately authored description.');
  });

  it('keeps every generated English description useful and snippet-sized', () => {
    for (const catalogTool of tools.filter(item => !item.seoDescriptionEn)) {
      const description = getToolSeoDescription(catalogTool, 'en');

      expect(description, catalogTool.slug).not.toContain('..');
      expect(description, catalogTool.slug).not.toMatch(/[А-Яа-яЁё]/);
      expect(description.length, catalogTool.slug).toBeGreaterThanOrEqual(100);
      expect(description.length, catalogTool.slug).toBeLessThanOrEqual(160);
    }
  });
});
