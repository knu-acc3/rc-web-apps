/**
 * Typing-test calculators.
 *
 * Speed counts only correctly typed characters (as they stand at the end).
 * Accuracy counts EVERY wrong keystroke, including ones that were later
 * corrected with Backspace — fixing a typo does not erase it from accuracy.
 */

/** Standard "word" length used by WPM (characters incl. spaces). */
const CHARS_PER_WORD = 5;

export const TYPING_DURATIONS = [60, 180, 300] as const;
/** 0 = type the whole text (no time limit). */
export type TypingMode = (typeof TYPING_DURATIONS)[number] | 0;

/** Words per minute (5 characters = 1 word). */
export function wpm(correctChars: number, elapsedMs: number): number {
  if (!(elapsedMs > 0)) return 0;
  return correctChars / CHARS_PER_WORD / (elapsedMs / 60_000);
}

/** Characters per minute. */
export function cpm(correctChars: number, elapsedMs: number): number {
  if (!(elapsedMs > 0)) return 0;
  return correctChars / (elapsedMs / 60_000);
}

/** Accuracy in percent: share of keystrokes that were right when typed. */
export function accuracy(keystrokes: number, wrongKeystrokes: number): number {
  if (keystrokes <= 0) return 100;
  return (Math.max(0, keystrokes - wrongKeystrokes) / keystrokes) * 100;
}

/** Characters that are treated as equal while typing (ё = е, typographic quotes and dashes). */
function normalizeChar(c: string): string {
  switch (c) {
    case "ё":
      return "е";
    case "Ё":
      return "Е";
    case " ":
    case " ":
      return " ";
    case "—":
    case "–":
    case "−":
      return "-";
    case "«":
    case "»":
    case "“":
    case "”":
    case "„":
      return '"';
    case "’":
    case "‘":
      return "'";
    default:
      return c;
  }
}

function charsMatch(typed: string, expected: string): boolean {
  return normalizeChar(typed) === normalizeChar(expected);
}

interface InputDiff {
  /** Index where the change starts. */
  at: number;
  /** Number of characters removed from the previous value. */
  removed: number;
  /** Characters inserted at `at`. */
  inserted: string;
}

/** Minimal single-span diff between two successive values of the input. */
export function diffInput(prev: string, next: string): InputDiff {
  let start = 0;
  const max = Math.min(prev.length, next.length);
  while (start < max && prev[start] === next[start]) start++;
  let endPrev = prev.length;
  let endNext = next.length;
  while (endPrev > start && endNext > start && prev[endPrev - 1] === next[endNext - 1]) {
    endPrev--;
    endNext--;
  }
  return { at: start, removed: endPrev - start, inserted: next.slice(start, endNext) };
}

export interface KeystrokeTally {
  /** Characters typed (inserted), each one counted once. */
  keystrokes: number;
  /** Inserted characters that did not match the text at their position. */
  errors: number;
}

export const EMPTY_TALLY: KeystrokeTally = { keystrokes: 0, errors: 0 };

/**
 * Update the tally for a change of the input from `prev` to `next`.
 * Deletions are free; every inserted character is judged against the target
 * at the position where it landed.
 */
export function tallyInput(tally: KeystrokeTally, prev: string, next: string, target: string): KeystrokeTally {
  const d = diffInput(prev, next);
  if (!d.inserted) return tally;
  let errors = tally.errors;
  for (let i = 0; i < d.inserted.length; i++) {
    const pos = d.at + i;
    if (pos >= target.length || !charsMatch(d.inserted[i], target[pos])) errors++;
  }
  return { keystrokes: tally.keystrokes + d.inserted.length, errors };
}

/** Correct characters in the current input. */
export function countCorrect(input: string, target: string): number {
  let n = 0;
  const len = Math.min(input.length, target.length);
  for (let i = 0; i < len; i++) if (charsMatch(input[i], target[i])) n++;
  return n;
}

/** Wrong characters that are still in the input (not corrected). */
export function countUncorrected(input: string, target: string): number {
  return Math.min(input.length, target.length) - countCorrect(input, target);
}

type CharState = "ok" | "err" | "todo";

interface Run {
  state: CharState;
  text: string;
}

/**
 * Group the target text into runs of equal state for cheap rendering.
 * The character at the caret position starts a fresh "todo" run.
 */
export function stateRuns(input: string, target: string): { before: Run[]; caret: string; after: string } {
  const before: Run[] = [];
  const typed = Math.min(input.length, target.length);
  for (let i = 0; i < typed; i++) {
    const state: CharState = charsMatch(input[i], target[i]) ? "ok" : "err";
    const last = before[before.length - 1];
    if (last && last.state === state) last.text += target[i];
    else before.push({ state, text: target[i] });
  }
  return { before, caret: target.slice(typed, typed + 1), after: target.slice(typed + 1) };
}

export interface TypingResult {
  elapsedMs: number;
  correct: number;
  typed: number;
  keystrokes: number;
  errors: number;
  uncorrected: number;
  wpm: number;
  cpm: number;
  accuracy: number;
}

export function typingResult(input: string, target: string, tally: KeystrokeTally, elapsedMs: number): TypingResult {
  const correct = countCorrect(input, target);
  return {
    elapsedMs,
    correct,
    typed: Math.min(input.length, target.length),
    keystrokes: tally.keystrokes,
    errors: tally.errors,
    uncorrected: countUncorrected(input, target),
    wpm: wpm(correct, elapsedMs),
    cpm: cpm(correct, elapsedMs),
    accuracy: accuracy(tally.keystrokes, tally.errors),
  };
}
