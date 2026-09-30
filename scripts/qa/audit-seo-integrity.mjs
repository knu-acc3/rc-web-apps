#!/usr/bin/env node

/**
 * Gate 2 QA Audit: SEO Architecture and Metadata Integrity.
 */

import { execSync } from 'node:child_process';

console.log('=== ЗАПУСК АУДИТА СЕО-АРХИТЕКТУРЫ (GATE 2) ===');

try {
  console.log('1. Проверка уникальности метаданных (Левенштейн)...');
  execSync('node scripts/qa/test-meta-uniqueness.mjs', { stdio: 'inherit' });

  console.log('2. Проверка Schema.org генератора...');
  execSync('npx vitest run tests/unit/schema-generator.test.ts', { stdio: 'inherit' });

  console.log('3. Проверка Sitemap Builder и Hreflang...');
  execSync('npx vitest run tests/unit/sitemap-builder.test.ts tests/unit/sitemap-index.test.ts tests/unit/hreflang.test.ts', { stdio: 'inherit' });

  console.log('4. Проверка типов TypeScript...');
  execSync('npx tsc --noEmit --incremental false', { stdio: 'inherit' });

  console.log('=== [GATE 2 PASS] ВСЕ ПРОВЕРКИ SEO УСПЕШНО ПРОЙДЕНЫ ===');
  process.exit(0);
} catch (err) {
  console.error('=== [GATE 2 FAIL] Обнаружены ошибки в SEO архитектуре ===', err);
  process.exit(1);
}
