#!/usr/bin/env node

/**
 * Gate 3 QA Audit: Data Integrity and Schema Validation.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

console.log('=== ЗАПУСК СЕРТИФИКАЦИИ ЦЕЛОСТНОСТИ ДАННЫХ (GATE 3) ===');

const requiredFiles = [
  'src/data/time-now/locations.json',
  'src/data/time-now/timezones.json',
  'src/data/actual-size/devices.json',
  'src/data/actual-size/calibration-standards.json',
  'src/data/emojis/emojis.json',
  'src/data/emojis/categories.json',
  'src/data/symbols/symbols.json',
  'src/data/symbols/kaomoji.json',
  'src/data/timers/events.json',
  'src/data/timers/presets.json',
];

let totalEntities = 0;

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`[FAIL] Отсутствует обязательный файл данных: ${file}`);
    process.exit(1);
  }
  try {
    const content = JSON.parse(readFileSync(file, 'utf8'));
    const count = Array.isArray(content) ? content.length : Object.keys(content).length;
    console.log(`[OK] ${file}: ${count} записей`);
    totalEntities += count;
  } catch (err) {
    console.error(`[FAIL] Синтаксическая ошибка в файле: ${file}`, err);
    process.exit(1);
  }
}

console.log(`Суммарно валидировано сущностей данных: ${totalEntities}`);

try {
  console.log('Запуск модульных тестов целостности данных...');
  execSync('npx vitest run tests/unit/time-data.test.ts tests/unit/device-specs.test.ts tests/unit/emoji-data.test.ts tests/unit/symbols-data.test.ts tests/unit/holiday-math.test.ts', { stdio: 'inherit' });

  console.log('Проверка типов TypeScript...');
  execSync('npx tsc --noEmit --incremental false', { stdio: 'inherit' });

  console.log('=== [GATE 3 PASS] ВСЕ ДАННЫЕ УСПЕШНО СЕРТИФИЦИРОВАНЫ ===');
  process.exit(0);
} catch (err) {
  console.error('=== [GATE 3 FAIL] Ошибка проверки данных ===', err);
  process.exit(1);
}
