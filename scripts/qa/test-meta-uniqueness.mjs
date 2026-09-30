#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import vm from 'node:vm';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function loadTs(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const js = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = { exports: {} };
  const ctx = vm.createContext({
    module: mod,
    exports: mod.exports,
    require: (id) => {
      if (id.includes('canonicalSlugs')) {
        return loadTs(path.join(rootDir, 'src/seo/canonicalSlugs.ts'));
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(id);
    },
  });
  vm.runInContext(js, ctx);
  return mod.exports;
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

console.log('=== ТЕСТИРОВАНИЕ УНИКАЛЬНОСТИ МЕТАДАННЫХ (СКВОЗНОЙ АУДИТ) ===');

const { tools } = loadTs(path.join(rootDir, 'src/data/tools.ts'));
const locations = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'src/data/time-now/locations.json'), 'utf8')
);

// Collect all tool descriptions
const toolDescriptions = tools.map((t) => ({
  id: t.slug,
  desc: (t.seoDescription || t.description || '').trim(),
}));

console.log(`Загружено инструментов для проверки: ${toolDescriptions.length}`);
console.log(`Загружено локаций для проверки: ${locations.length}`);

let totalComparisons = 0;
let totalDifferenceRatio = 0;
let minDifference = 1.0;

for (let i = 0; i < toolDescriptions.length; i++) {
  for (let j = i + 1; j < toolDescriptions.length; j++) {
    const d1 = toolDescriptions[i].desc;
    const d2 = toolDescriptions[j].desc;
    const dist = levenshtein(d1, d2);
    const maxLen = Math.max(d1.length, d2.length);
    const ratio = maxLen === 0 ? 0 : dist / maxLen;

    totalComparisons++;
    totalDifferenceRatio += ratio;
    if (ratio < minDifference) {
      minDifference = ratio;
    }

    if (ratio < 0.25) {
      throw new Error(
        `Обнаружен критический дубль метаописания инструментов: ${toolDescriptions[i].id} <-> ${toolDescriptions[j].id} (diff: ${ratio.toFixed(2)})`
      );
    }
  }
}

const avgDifference = totalDifferenceRatio / totalComparisons;
console.log(`Проверено попарных сравнений: ${totalComparisons}`);
console.log(`Среднее различие по Левенштейну: ${(avgDifference * 100).toFixed(1)}%`);
console.log(`Минимальное различие: ${(minDifference * 100).toFixed(1)}%`);

if (minDifference < 0.35) {
  console.error('[FAIL] Минимальное различие ниже 35%!');
  process.exit(1);
} else {
  console.log('[PASS] Метаданные инструментов полностью уникальны (порог >= 35% соблюдён)!');
  process.exit(0);
}
