/**
 * Myers Diff Algorithm O((N+M)D) with intra-line word diffs
 * Replaces O(N*M) quadratic matrix to easily handle up to 100,000 lines.
 */

export type DiffChangeType = 'same' | 'add' | 'remove';

export interface DiffWordPart {
  type: DiffChangeType;
  text: string;
}

export interface DiffLineResult {
  type: DiffChangeType;
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
  wordParts?: DiffWordPart[];
}

export interface DiffComputeOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  ignoreBlank?: boolean;
}

export interface DiffOutput {
  lines: DiffLineResult[];
  additions: number;
  removals: number;
  unifiedPatch: string;
}

function normalizeLine(line: string, options: DiffComputeOptions): string {
  let res = line;
  if (options.ignoreWhitespace) res = res.replace(/\s+/g, ' ').trim();
  if (options.ignoreCase) res = res.toLowerCase();
  return res;
}

/**
 * Standard greedy Myers Diff algorithm returning shortest edit script.
 */
export function computeMyersDiff(
  a: string[],
  b: string[],
  options: DiffComputeOptions = {},
): DiffLineResult[] {
  const n = a.length;
  const m = b.length;

  if (n === 0 && m === 0) return [];
  if (n === 0) {
    return b.map((text, i) => ({ type: 'add', text, newLineNumber: i + 1 }));
  }
  if (m === 0) {
    return a.map((text, i) => ({ type: 'remove', text, oldLineNumber: i + 1 }));
  }

  const normA = a.map((line) => normalizeLine(line, options));
  const normB = b.map((line) => normalizeLine(line, options));

  const max = n + m;
  const vSize = 2 * max + 1;
  const offset = max;
  const v = new Int32Array(vSize);
  const trace: Int32Array[] = [];

  let dFound = -1;

  for (let d = 0; d <= max; d++) {
    const vCopy = new Int32Array(v);
    trace.push(vCopy);

    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1]; // downward move (insert from b)
      } else {
        x = v[offset + k - 1] + 1; // rightward move (delete from a)
      }

      let y = x - k;

      while (x < n && y < m && normA[x] === normB[y]) {
        x++;
        y++;
      }

      v[offset + k] = x;

      if (x >= n && y >= m) {
        dFound = d;
        break;
      }
    }

    if (dFound !== -1) break;
  }

  // Backtrack to find edit script
  const script: DiffLineResult[] = [];
  let curX = n;
  let curY = m;

  for (let d = dFound; d > 0; d--) {
    const k = curX - curY;
    const prevV = trace[d];

    let prevK: number;
    if (k === -d || (k !== d && prevV[offset + k - 1] < prevV[offset + k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = prevV[offset + prevK];
    const prevY = prevX - prevK;

    // Diagonal elements (same)
    while (curX > prevX && curY > prevY) {
      curX--;
      curY--;
      script.push({
        type: 'same',
        text: b[curY],
        oldLineNumber: curX + 1,
        newLineNumber: curY + 1,
      });
    }

    if (curX === prevX) {
      // Insertion (add)
      curY--;
      script.push({
        type: 'add',
        text: b[curY],
        newLineNumber: curY + 1,
      });
    } else if (curY === prevY) {
      // Deletion (remove)
      curX--;
      script.push({
        type: 'remove',
        text: a[curX],
        oldLineNumber: curX + 1,
      });
    }
  }

  // Remaining diagonal elements at beginning
  while (curX > 0 && curY > 0) {
    curX--;
    curY--;
    script.push({
      type: 'same',
      text: b[curY],
      oldLineNumber: curX + 1,
      newLineNumber: curY + 1,
    });
  }

  const result = script.reverse();

  // Intra-line word diffing for adjacent remove + add
  enhanceWithIntraLineDiffs(result);

  return result;
}

/**
 * Tokenizes a string into words and punctuation tokens.
 */
function tokenizeWords(str: string): string[] {
  return str.match(/\w+|\s+|[^\w\s]+/g) || [str];
}

/**
 * Word-level Myers diff for modified lines to highlight precise character/word differences.
 */
function enhanceWithIntraLineDiffs(lines: DiffLineResult[]): void {
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].type === 'remove' && lines[i + 1].type === 'add') {
      const oldWords = tokenizeWords(lines[i].text);
      const newWords = tokenizeWords(lines[i + 1].text);

      // Short word-level Myers diff
      const wordDiff = computeWordDiff(oldWords, newWords);

      lines[i].wordParts = wordDiff.filter((w) => w.type !== 'add');
      lines[i + 1].wordParts = wordDiff.filter((w) => w.type !== 'remove');
    }
  }
}

function computeWordDiff(a: string[], b: string[]): DiffWordPart[] {
  if (a.length > 500 || b.length > 500) {
    return [];
  }
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max;
  const v = new Int32Array(2 * max + 1);
  const trace: Int32Array[] = [];
  let dFound = -1;

  for (let d = 0; d <= max; d++) {
    trace.push(new Int32Array(v));
    for (let k = -d; k <= d; k += 2) {
      let x = (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]))
        ? v[offset + k + 1]
        : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        dFound = d;
        break;
      }
    }
    if (dFound !== -1) break;
  }

  const parts: DiffWordPart[] = [];
  let curX = n;
  let curY = m;

  for (let d = dFound; d > 0; d--) {
    const k = curX - curY;
    const prevV = trace[d];
    const prevK = (k === -d || (k !== d && prevV[offset + k - 1] < prevV[offset + k + 1]))
      ? k + 1
      : k - 1;
    const prevX = prevV[offset + prevK];
    const prevY = prevX - prevK;

    while (curX > prevX && curY > prevY) {
      curX--;
      curY--;
      parts.push({ type: 'same', text: b[curY] });
    }

    if (curX === prevX) {
      curY--;
      parts.push({ type: 'add', text: b[curY] });
    } else if (curY === prevY) {
      curX--;
      parts.push({ type: 'remove', text: a[curX] });
    }
  }

  while (curX > 0 && curY > 0) {
    curX--;
    curY--;
    parts.push({ type: 'same', text: b[curY] });
  }

  return parts.reverse();
}

export function generateDiffOutput(
  oldText: string,
  newText: string,
  options: DiffComputeOptions = {},
): DiffOutput {
  const oldLines = oldText.replace(/\r\n?/g, '\n').split('\n');
  const newLines = newText.replace(/\r\n?/g, '\n').split('\n');

  const filteredOld = options.ignoreBlank ? oldLines.filter((l) => l.trim() !== '') : oldLines;
  const filteredNew = options.ignoreBlank ? newLines.filter((l) => l.trim() !== '') : newLines;

  const lines = computeMyersDiff(filteredOld, filteredNew, options);

  const additions = lines.filter((l) => l.type === 'add').length;
  const removals = lines.filter((l) => l.type === 'remove').length;

  const unifiedPatch = [
    '--- original',
    '+++ modified',
    '@@ -1,' + filteredOld.length + ' +1,' + filteredNew.length + ' @@',
    ...lines.map((l) => `${l.type === 'add' ? '+' : l.type === 'remove' ? '-' : ' '}${l.text}`),
  ].join('\n');

  return {
    lines,
    additions,
    removals,
    unifiedPatch,
  };
}
