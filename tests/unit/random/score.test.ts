import { describe, expect, it } from "vitest";
import {
  addScore,
  clockElapsed,
  clockMs,
  clockOver,
  clockReset,
  clockToggle,
  countStep,
  digitsScale,
  formatClock,
  isClock,
  isSteps,
  matchWinner,
  newClock,
  percentOf,
  setWinner,
  sportClock,
  tableTennisServer,
  tallyGroups,
  tallyView,
} from "@/tools/random/score/lib/score";
import { isBoard, isTally } from "@/tools/random/score/lib/state";
import { buildLots, defaultMafia } from "@/tools/random/random/lib/lots";

describe("scoreboard", () => {
  it("never goes below zero", () => {
    expect(addScore([0, 3], 0, -1)).toEqual([0, 3]);
    expect(addScore([2, 3], 1, 3)).toEqual([2, 6]);
  });

  it("ends a volleyball set at 25 with a two-point lead, the fifth at 15", () => {
    expect(setWinner("volleyball", [25, 23], 0)).toBe(0);
    expect(setWinner("volleyball", [25, 24], 0)).toBeNull();
    expect(setWinner("volleyball", [26, 28], 2)).toBe(1);
    expect(setWinner("volleyball", [15, 13], 4)).toBe(0);
    expect(setWinner("volleyball", [15, 13], 3)).toBeNull();
  });

  it("caps badminton at 30", () => {
    expect(setWinner("badminton", [21, 19], 0)).toBe(0);
    expect(setWinner("badminton", [30, 29], 0)).toBe(0);
    expect(setWinner("badminton", [29, 28], 0)).toBeNull();
  });

  it("has no sets for basketball", () => {
    expect(setWinner("basketball", [100, 2], 0)).toBeNull();
    expect(matchWinner("basketball", [5, 0])).toBeNull();
  });

  it("finds the match winner", () => {
    expect(matchWinner("volleyball", [3, 1])).toBe(0);
    expect(matchWinner("volleyball", [2, 2])).toBeNull();
    expect(matchWinner("badminton", [1, 2])).toBe(1);
  });

  it("alternates the table tennis serve every two points, every point from 10:10", () => {
    expect(tableTennisServer([0, 0], 0)).toBe(0);
    expect(tableTennisServer([1, 0], 0)).toBe(0);
    expect(tableTennisServer([1, 1], 0)).toBe(1);
    expect(tableTennisServer([3, 1], 0)).toBe(0);
    expect(tableTennisServer([10, 10], 0)).toBe(0);
    expect(tableTennisServer([11, 10], 0)).toBe(1);
    expect(tableTennisServer([11, 11], 0)).toBe(0);
    expect(tableTennisServer([0, 0], 1)).toBe(1);
  });

  it("shrinks long numbers", () => {
    expect(digitsScale(7)).toBe(1);
    expect(digitsScale(123)).toBe(0.8);
    expect(digitsScale(-12)).toBe(0.8);
    expect(digitsScale(12345)).toBe(0.5);
  });
});

describe("saved boards", () => {
  // Exactly what the previous version stored in localStorage.
  const old = { title: "Финал", names: ["", "Гости"], scores: [12, 9], small: [1, 0], period: 2, serve: null, theme: "led", showSmall: true, flip: false };

  it("still accepts a board saved before buttons and the clock existed", () => {
    expect(isBoard(old)).toBe(true);
  });

  it("accepts the new optional fields and rejects broken ones", () => {
    expect(isBoard({ ...old, steps: [1, 2, 3], clock: newClock(10, "down") })).toBe(true);
    expect(isBoard({ ...old, clock: null })).toBe(true);
    expect(isBoard({ ...old, steps: [] })).toBe(false);
    expect(isBoard({ ...old, steps: [1, 0.5] })).toBe(false);
    expect(isBoard({ ...old, clock: { running: true } })).toBe(false);
    expect(isBoard({ ...old, theme: "pink" })).toBe(false);
  });

  it("validates button sets", () => {
    expect(isSteps([1, 5, 10])).toBe(true);
    expect(isSteps([1, 2, 3, 4, 5])).toBe(false);
    expect(isSteps("1")).toBe(false);
  });
});

describe("game clock", () => {
  const t0 = 1_700_000_000_000;

  it("has sport defaults", () => {
    expect(sportClock("basketball")).toMatchObject({ lengthMs: 600_000, dir: "down", running: false });
    expect(sportClock("football")).toMatchObject({ lengthMs: 2_700_000, dir: "up" });
    expect(sportClock("hockey")).toMatchObject({ lengthMs: 1_200_000, dir: "down" });
    expect(sportClock("volleyball")).toBeNull();
  });

  it("counts down from the period length and stops at zero", () => {
    const c = clockToggle(newClock(10, "down"), t0);
    expect(c.running).toBe(true);
    expect(clockMs(c, t0)).toBe(600_000);
    expect(clockMs(c, t0 + 61_000)).toBe(539_000);
    expect(clockMs(c, t0 + 700_000)).toBe(0);
    expect(clockOver(c, t0 + 600_000)).toBe(true);
    expect(clockOver(c, t0 + 599_999)).toBe(false);
  });

  it("counts up and never past the period", () => {
    const c = clockToggle(newClock(45, "up"), t0);
    expect(clockMs(c, t0 + 90_000)).toBe(90_000);
    expect(clockMs(c, t0 + 99 * 60_000)).toBe(45 * 60_000);
  });

  it("pauses, resumes and resets", () => {
    let c = clockToggle(newClock(10, "down"), t0);
    c = clockToggle(c, t0 + 30_000);
    expect(c).toMatchObject({ running: false, baseMs: 30_000, startedAt: null });
    expect(clockMs(c, t0 + 999_999)).toBe(570_000);
    c = clockToggle(c, t0 + 100_000);
    expect(clockElapsed(c, t0 + 110_000)).toBe(40_000);
    expect(clockReset(c)).toMatchObject({ running: false, baseMs: 0, startedAt: null });
  });

  it("starts the next period from zero once the time ran out", () => {
    const over = { ...newClock(1, "down"), baseMs: 60_000 };
    expect(clockMs(clockToggle(over, t0), t0)).toBe(60_000);
  });

  it("ignores a start time in the future (clock changed)", () => {
    const c = clockToggle(newClock(10, "up"), t0);
    expect(clockMs(c, t0 - 5_000)).toBe(0);
  });

  it("formats like a scoreboard", () => {
    expect(formatClock(600_000, "down")).toBe("10:00");
    expect(formatClock(599_001, "down")).toBe("10:00");
    expect(formatClock(545_000, "down")).toBe("9:05");
    expect(formatClock(59_950, "down")).toBe("59.9");
    expect(formatClock(0, "down")).toBe("0.0");
    expect(formatClock(61_999, "up")).toBe("1:01");
    expect(formatClock(2_700_000, "up")).toBe("45:00");
  });

  it("validates saved clocks", () => {
    expect(isClock(newClock(20, "down"))).toBe(true);
    expect(isClock({ ...newClock(20, "down"), dir: "left" })).toBe(false);
    expect(isClock({ ...newClock(20, "down"), lengthMs: 0 })).toBe(false);
  });
});

describe("tally marks", () => {
  it("groups strokes by five", () => {
    expect(tallyGroups(0)).toEqual([]);
    expect(tallyGroups(-3)).toEqual([]);
    expect(tallyGroups(4)).toEqual([4]);
    expect(tallyGroups(5)).toEqual([5]);
    expect(tallyGroups(12)).toEqual([5, 5, 2]);
    expect(tallyGroups(500)).toHaveLength(100);
  });

  it("falls back to digits for negatives and big numbers", () => {
    expect(tallyView(12)).toEqual({ marks: 12, digits: false });
    expect(tallyView(500)).toEqual({ marks: 500, digits: false });
    expect(tallyView(501)).toEqual({ marks: 1, digits: true });
    expect(tallyView(600)).toEqual({ marks: 100, digits: true });
    expect(tallyView(1234)).toEqual({ marks: 34, digits: true });
    expect(tallyView(-2)).toEqual({ marks: 0, digits: true });
  });
});

describe("counter", () => {
  it("still accepts a counter saved before the tally view existed", () => {
    const old = { title: "", items: [{ name: "", value: 7 }], step: 1, goal: 33, loop: true, laps: 2, sound: false, active: 0 };
    expect(isTally(old)).toBe(true);
    expect(isTally({ ...old, view: "tally" })).toBe(true);
    expect(isTally({ ...old, view: "dots" })).toBe(false);
  });

  it("counts laps when looping", () => {
    expect(countStep(32, 0, 1, 33, true)).toEqual({ value: 0, laps: 1, reached: true });
    expect(countStep(31, 2, 5, 33, true)).toEqual({ value: 3, laps: 3, reached: true });
    expect(countStep(32, 0, 1, 33, false)).toEqual({ value: 33, laps: 0, reached: true });
    expect(countStep(33, 0, 1, 33, false)).toEqual({ value: 34, laps: 0, reached: false });
    expect(countStep(5, 0, -1, 33, true)).toEqual({ value: 4, laps: 0, reached: false });
    expect(countStep(5, 0, 1, null, true)).toEqual({ value: 6, laps: 0, reached: false });
  });

  it("rounds percentages to one decimal", () => {
    expect(percentOf(1, 3)).toBe(33.3);
    expect(percentOf(0, 0)).toBe(0);
  });
});

describe("draw lots", () => {
  const base = { lines: [], count: 5, marked: 1, detective: true, doctor: true };

  it("makes one short straw by default", () => {
    const lots = buildLots("straws", base, "ru");
    expect(lots).toHaveLength(5);
    expect(lots.filter((l) => l.kind === "short")).toHaveLength(1);
  });

  it("keeps at least one long straw", () => {
    expect(buildLots("straws", { ...base, marked: 9 }, "en").filter((l) => l.kind === "long")).toHaveLength(1);
  });

  it("numbers 1..N", () => {
    expect(buildLots("numbers", { ...base, count: 4 }, "en").map((l) => l.text)).toEqual(["1", "2", "3", "4"]);
  });

  it("deals Mafia roles with mafia in the minority", () => {
    const lots = buildLots("mafia", { ...base, count: 10, marked: defaultMafia(10) }, "ru");
    expect(lots).toHaveLength(10);
    expect(lots.filter((l) => l.kind === "mafia")).toHaveLength(3);
    expect(lots.filter((l) => l.kind === "detective")).toHaveLength(1);
    expect(lots.filter((l) => l.kind === "doctor")).toHaveLength(1);
    const greedy = buildLots("mafia", { ...base, count: 6, marked: 6 }, "ru");
    expect(greedy.filter((l) => l.kind === "mafia").length).toBeLessThan(3);
    expect(greedy.some((l) => l.kind === "civilian")).toBe(true);
  });

  it("uses custom lines as they are", () => {
    expect(buildLots("custom", { ...base, lines: ["a", "b", "a"] }, "en").map((l) => l.text)).toEqual(["a", "b", "a"]);
  });
});
