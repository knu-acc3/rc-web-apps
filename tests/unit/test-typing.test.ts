import { describe, expect, it } from "vitest";
import {
  EMPTY_TALLY,
  accuracy,
  countCorrect,
  countUncorrected,
  cpm,
  diffInput,
  stateRuns,
  tallyInput,
  typingResult,
  wpm,
  type KeystrokeTally,
} from "@/sections/test/lib/typing-stats";
import { TYPING_TEXTS } from "@/sections/test/data/typing-texts";

/** Replay a sequence of input values, as the textarea would report them. */
function replay(values: string[], target: string): KeystrokeTally {
  let tally = EMPTY_TALLY;
  let prev = "";
  for (const v of values) {
    tally = tallyInput(tally, prev, v, target);
    prev = v;
  }
  return tally;
}

describe("typing speed", () => {
  it("250 correct characters in 60 s = 50 WPM, 250 CPM", () => {
    expect(wpm(250, 60_000)).toBe(50);
    expect(cpm(250, 60_000)).toBe(250);
  });

  it("scales with time", () => {
    expect(wpm(500, 120_000)).toBe(50);
    expect(cpm(150, 30_000)).toBe(300);
    expect(wpm(1500, 300_000)).toBe(60);
  });

  it("returns 0 for zero time", () => {
    expect(wpm(10, 0)).toBe(0);
    expect(cpm(10, 0)).toBe(0);
  });
});

describe("accuracy counts corrected errors", () => {
  it("200 keystrokes with 10 wrong → 95 %", () => {
    expect(accuracy(200, 10)).toBe(95);
    expect(accuracy(0, 0)).toBe(100);
    expect(accuracy(4, 4)).toBe(0);
  });

  it("a typo fixed with Backspace still lowers accuracy", () => {
    const target = "cat";
    // c, x (wrong), backspace, a, t
    const tally = replay(["c", "cx", "c", "ca", "cat"], target);
    expect(tally).toEqual({ keystrokes: 4, errors: 1 });
    expect(accuracy(tally.keystrokes, tally.errors)).toBe(75);
    // …while the final text itself is fully correct
    expect(countCorrect("cat", target)).toBe(3);
    expect(countUncorrected("cat", target)).toBe(0);
  });

  it("200 keystrokes with 10 corrected mistakes → 95 %", () => {
    const target = "a".repeat(190);
    const values: string[] = [];
    let cur = "";
    for (let i = 0; i < 190; i++) {
      if (i % 19 === 0) {
        values.push(cur + "b"); // wrong
        values.push(cur); // backspace
      }
      cur += "a";
      values.push(cur);
    }
    const tally = replay(values, target);
    expect(tally.keystrokes).toBe(200);
    expect(tally.errors).toBe(10);
    expect(accuracy(tally.keystrokes, tally.errors)).toBe(95);
    const r = typingResult(cur, target, tally, 60_000);
    expect(r.correct).toBe(190);
    expect(r.uncorrected).toBe(0);
    expect(r.wpm).toBe(38);
    expect(r.accuracy).toBe(95);
  });

  it("treats ё as е and typographic dashes as hyphens", () => {
    const t = replay(["е", "еж"], "ёж");
    expect(t).toEqual({ keystrokes: 2, errors: 0 });
    expect(countCorrect("a - b", "a — b")).toBe(5);
  });

  it("counts every character of a multi-character insertion", () => {
    const t = tallyInput(EMPTY_TALLY, "he", "hello", "help!");
    expect(t).toEqual({ keystrokes: 3, errors: 2 });
  });

  it("deletions are free", () => {
    const t = tallyInput({ keystrokes: 5, errors: 1 }, "hello", "he", "hello");
    expect(t).toEqual({ keystrokes: 5, errors: 1 });
  });
});

describe("input diff and runs", () => {
  it("finds a single changed span", () => {
    expect(diffInput("abc", "abcd")).toEqual({ at: 3, removed: 0, inserted: "d" });
    expect(diffInput("abcd", "abc")).toEqual({ at: 3, removed: 1, inserted: "" });
    expect(diffInput("hello world", "hello wide world")).toEqual({ at: 7, removed: 0, inserted: "ide w" });
  });

  it("groups characters into runs around the caret", () => {
    const r = stateRuns("hxl", "hello");
    expect(r.before).toEqual([
      { state: "ok", text: "h" },
      { state: "err", text: "e" },
      { state: "ok", text: "l" },
    ]);
    expect(r.caret).toBe("l");
    expect(r.after).toBe("o");
  });
});

describe("typing texts", () => {
  for (const lang of ["ru", "en"] as const) {
    it(`${lang}: at least 10 texts of varied length, no double spaces`, () => {
      const texts = TYPING_TEXTS[lang];
      expect(texts.length).toBeGreaterThanOrEqual(10);
      const lengths = texts.map((t) => t.length);
      expect(Math.min(...lengths)).toBeLessThan(250);
      expect(Math.max(...lengths)).toBeGreaterThan(450);
      for (const t of texts) {
        expect(t).toBe(t.trim());
        expect(t).not.toMatch(/ {2}|\n|\t/);
      }
    });
  }
});
