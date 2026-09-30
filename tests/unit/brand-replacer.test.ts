import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

describe('CLI утилита brand-and-domain-replacer.mjs', () => {
  it('должна успешно выполнять сухой прогон (--dry-run) без изменения файлов', () => {
    const beforeConfig = readFileSync('src/config/site.config.ts', 'utf8');
    const output = execSync('node scripts/brand-and-domain-replacer.mjs --dry-run --name "DryRunBrand" --domain "dryrun.com"').toString();
    const afterConfig = readFileSync('src/config/site.config.ts', 'utf8');

    expect(output).toContain('Режим сухой прокрутки (Dry Run): true');
    expect(output).toContain('[DRY-RUN] Файл будет обновлен');
    expect(beforeConfig).toBe(afterConfig);
  });

  it('должна корректно парсить аргументы и очищать домен от протокола', () => {
    const output = execSync('node scripts/brand-and-domain-replacer.mjs --dry-run --domain "https://my-clean-domain.org/"').toString();
    expect(output).toContain('my-clean-domain.org');
    expect(output).not.toContain('https://my-clean-domain.org/');
  });
});
