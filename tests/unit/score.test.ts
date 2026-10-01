import { describe, expect, it } from "vitest";
import { addScore, countStep, digitsScale, matchWinner, percentOf, setWinner, tableTennisServer } from "@/sections/score/lib/score";
import { buildLots, defaultMafia } from "@/sections/random/lib/lots";

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

describe("counter", () => {
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
