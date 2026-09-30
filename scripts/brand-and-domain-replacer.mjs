#!/usr/bin/env node
/**
 * CLI-утилита моментального ребрендинга и смены домена монолита RC Web App.
 * Использование:
 *   node scripts/brand-and-domain-replacer.mjs --name "SuperTools" --domain "supertools.io" [--self-destruct]
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(process.cwd());

const optionsConfig = {
  name: { type: 'string', short: 'n' },
  domain: { type: 'string', short: 'd' },
  email: { type: 'string', short: 'e' },
  'dry-run': { type: 'boolean', default: false },
  'self-destruct': { type: 'boolean', default: false },
};

const { values } = parseArgs({ options: optionsConfig, strict: false });

const newName = values.name ? values.name.trim() : null;
const rawDomain = values.domain ? values.domain.trim() : null;
const isDryRun = Boolean(values['dry-run']);
const shouldSelfDestruct = Boolean(values['self-destruct']);

if (!newName && !rawDomain) {
  console.log('RC Rebranding CLI: не заданы параметры --name или --domain. Работа завершена без изменений.');
  process.exit(0);
}

// Нормализация домена
const cleanDomain = rawDomain ? rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
const cleanBaseUrl = cleanDomain ? `https://${cleanDomain}` : null;

console.log('=== ЗАПУСК ПРОГРАММЫ РЕБРЕНДИНГА ===');
console.log('Новый бренд:', newName || '(без изменений)');
console.log('Новый домен:', cleanDomain || '(без изменений)');
console.log('Режим сухой прокрутки (Dry Run):', isDryRun);

const siteConfigPath = join(ROOT, 'src', 'config', 'site.config.ts');
if (existsSync(siteConfigPath)) {
  let content = readFileSync(siteConfigPath, 'utf8');
  if (newName) {
    content = content.replace(/brandName:\s*['"][^'"]+['"]/g, `brandName: '${newName}'`);
    content = content.replace(/brandShort:\s*['"][^'"]+['"]/g, `brandShort: '${newName.slice(0, 4)}'`);
  }
  if (cleanDomain) {
    content = content.replace(/domain:\s*['"][^'"]+['"]/g, `domain: '${cleanDomain}'`);
    content = content.replace(/baseUrl:\s*['"][^'"]+['"]/g, `baseUrl: '${cleanBaseUrl}'`);
  }
  if (!isDryRun) {
    writeFileSync(siteConfigPath, content, 'utf8');
    console.log('[OK] Обновлен конфигурационный файл:', siteConfigPath);
  } else {
    console.log('[DRY-RUN] Файл будет обновлен:', siteConfigPath);
  }
}

// Обновление манифеста PWA
const manifestPath = join(ROOT, 'public', 'manifest.json');
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (newName) {
      manifest.name = newName;
      manifest.short_name = newName.slice(0, 12);
    }
    if (!isDryRun) {
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      console.log('[OK] Обновлен веб-манифест:', manifestPath);
    }
  } catch (err) {
    console.warn('[WARN] Ошибка обновления манифеста:', err.message);
  }
}

// Самоликвидация при флаге --self-destruct
if (shouldSelfDestruct && !isDryRun) {
  console.log('[!] Внимание: активирован протокол самоликвидации --self-destruct.');
  try {
    unlinkSync(import.meta.filename);
    console.log('[DESTROYED] Скрипт ребрендинга успешно удален из репозитория.');
  } catch (err) {
    console.error('[ERROR] Не удалось удалить файл скрипта:', err.message);
  }
}

console.log('=== РЕБРЕНДИНГ УСПЕШНО ЗАВЕРШЕН ===');
