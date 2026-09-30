import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function findCssFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      findCssFiles(fullPath, fileList);
    } else if (file.endsWith('.css')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Аудит CSS на отсутствие неадаптивных жестких ширин', () => {
  it('файлы стилей не должны содержать жестко заданных ширин без max-width', () => {
    const cssFiles = findCssFiles('src/styles');
    const dangerousWidthRegex = /width:\s*(?:[3-9]\d{2}|\d{4,})px/g;

    for (const file of cssFiles) {
      const content = readFileSync(file, 'utf8');
      const matches = content.match(dangerousWidthRegex) || [];
      expect(
        matches.length,
        `Обнаружена жесткая ширина без ограничения в ${file}: ${matches.join(', ')}`
      ).toBe(0);
    }
  });
});
