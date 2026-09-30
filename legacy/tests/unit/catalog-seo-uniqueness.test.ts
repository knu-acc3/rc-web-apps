import { describe, expect, it } from 'vitest';
import { tools } from '@/src/data/tools';

describe('Production Tool SEO Uniqueness & Quality Audit', () => {
  it('ensures all tools have explicit, non-empty SEO fields', () => {
    expect(tools.length).toBeGreaterThanOrEqual(200);

    for (const tool of tools) {
      expect(tool.seoTitle, `Missing seoTitle for ${tool.slug}`).toBeTruthy();
      expect(tool.seoTitleEn, `Missing seoTitleEn for ${tool.slug}`).toBeTruthy();
      expect(tool.seoDescription, `Missing seoDescription for ${tool.slug}`).toBeTruthy();
      expect(tool.seoDescriptionEn, `Missing seoDescriptionEn for ${tool.slug}`).toBeTruthy();
    }
  });

  it('guarantees 100% uniqueness across all Russian titles', () => {
    const titles = new Set<string>();
    for (const tool of tools) {
      expect(titles.has(tool.seoTitle!), `Duplicate seoTitle found: "${tool.seoTitle}" (slug: ${tool.slug})`).toBe(false);
      titles.add(tool.seoTitle!);
    }
  });

  it('guarantees 100% uniqueness across all English titles', () => {
    const titlesEn = new Set<string>();
    for (const tool of tools) {
      expect(titlesEn.has(tool.seoTitleEn!), `Duplicate seoTitleEn found: "${tool.seoTitleEn}" (slug: ${tool.slug})`).toBe(false);
      titlesEn.add(tool.seoTitleEn!);
    }
  });

  it('guarantees 100% uniqueness across all Russian descriptions', () => {
    const descs = new Set<string>();
    for (const tool of tools) {
      expect(descs.has(tool.seoDescription!), `Duplicate seoDescription found: "${tool.seoDescription}" (slug: ${tool.slug})`).toBe(false);
      descs.add(tool.seoDescription!);
    }
  });

  it('guarantees 100% uniqueness across all English descriptions', () => {
    const descsEn = new Set<string>();
    for (const tool of tools) {
      expect(descsEn.has(tool.seoDescriptionEn!), `Duplicate seoDescriptionEn found: "${tool.seoDescriptionEn}" (slug: ${tool.slug})`).toBe(false);
      descsEn.add(tool.seoDescriptionEn!);
    }
  });

  it('verifies that English SEO fields do not leak Cyrillic characters', () => {
    const cyrillicRegex = /[А-Яа-яЁё]/;
    for (const tool of tools) {
      expect(cyrillicRegex.test(tool.seoTitleEn!), `Cyrillic in seoTitleEn for ${tool.slug}: "${tool.seoTitleEn}"`).toBe(false);
      expect(cyrillicRegex.test(tool.seoDescriptionEn!), `Cyrillic in seoDescriptionEn for ${tool.slug}: "${tool.seoDescriptionEn}"`).toBe(false);
    }
  });

  it('verifies optimal snippet length ranges for production SEO', () => {
    for (const tool of tools) {
      expect(tool.seoTitle!.length, `seoTitle length for ${tool.slug}`).toBeGreaterThanOrEqual(15);
      expect(tool.seoTitle!.length, `seoTitle length for ${tool.slug}`).toBeLessThanOrEqual(85);

      expect(tool.seoTitleEn!.length, `seoTitleEn length for ${tool.slug}`).toBeGreaterThanOrEqual(15);
      expect(tool.seoTitleEn!.length, `seoTitleEn length for ${tool.slug}`).toBeLessThanOrEqual(85);

      expect(tool.seoDescription!.length, `seoDescription length for ${tool.slug}`).toBeGreaterThanOrEqual(110);
      expect(tool.seoDescription!.length, `seoDescription length for ${tool.slug}`).toBeLessThanOrEqual(175);

      expect(tool.seoDescriptionEn!.length, `seoDescriptionEn length for ${tool.slug}`).toBeGreaterThanOrEqual(110);
      expect(tool.seoDescriptionEn!.length, `seoDescriptionEn length for ${tool.slug}`).toBeLessThanOrEqual(175);
    }
  });

  it('ensures no tool contains banned boilerplate patterns', () => {
    for (const tool of tools) {
      expect(tool.seoTitleEn!).not.toContain('— Free Online Tool');
      expect(tool.seoDescriptionEn!).not.toContain('No installation or account is required.');
      expect(tool.seoTitle!).not.toContain('— точные данные онлайн | RC Web App');
    }
  });
});
