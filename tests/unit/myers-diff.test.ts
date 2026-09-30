import { describe, it, expect } from 'vitest';
import { computeMyersDiff, generateDiffOutput } from '@/src/lib/diff/myersDiff';

describe('Myers Diff Algorithm', () => {
  it('handles empty inputs', () => {
    const diff = computeMyersDiff([], []);
    expect(diff).toEqual([]);

    const output = generateDiffOutput('', '');
    expect(output.additions).toBe(0);
    expect(output.removals).toBe(0);
  });

  it('detects identical inputs with no adds or removes', () => {
    const lines = ['alpha', 'beta', 'gamma'];
    const diff = computeMyersDiff(lines, lines);
    expect(diff.every((l) => l.type === 'same')).toBe(true);
    expect(diff.length).toBe(3);
  });

  it('detects additions and removals accurately', () => {
    const a = ['apple', 'banana', 'orange'];
    const b = ['apple', 'cherry', 'orange', 'pear'];
    const output = generateDiffOutput(a.join('\n'), b.join('\n'));

    expect(output.removals).toBe(1); // 'banana' removed
    expect(output.additions).toBe(2); // 'cherry', 'pear' added
    expect(output.unifiedPatch).toContain('-banana');
    expect(output.unifiedPatch).toContain('+cherry');
    expect(output.unifiedPatch).toContain('+pear');
  });

  it('respects ignoreCase option', () => {
    const a = ['Hello World'];
    const b = ['hello world'];
    const strictDiff = computeMyersDiff(a, b, { ignoreCase: false });
    expect(strictDiff.some((l) => l.type === 'remove')).toBe(true);

    const looseDiff = computeMyersDiff(a, b, { ignoreCase: true });
    expect(looseDiff.every((l) => l.type === 'same')).toBe(true);
  });

  it('respects ignoreWhitespace option', () => {
    const a = ['  const x   =   1;  '];
    const b = ['const x = 1;'];
    const diff = computeMyersDiff(a, b, { ignoreWhitespace: true });
    expect(diff[0].type).toBe('same');
  });

  it('computes token-level word diffs for modified lines', () => {
    const a = 'The quick brown fox';
    const b = 'The fast brown fox';
    const output = generateDiffOutput(a, b);
    const lineWithWords = output.lines.find((l) => l.wordParts && l.wordParts.length > 0);
    expect(lineWithWords).toBeDefined();
    if (lineWithWords && lineWithWords.wordParts) {
      expect(lineWithWords.wordParts.some((wp) => wp.type === 'same')).toBe(true);
    }
  });
});
