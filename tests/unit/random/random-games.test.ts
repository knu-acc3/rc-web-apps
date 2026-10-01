import { describe, expect, it } from "vitest";
import { diceDistribution, diceRange, diceStats, parseDice, rollDice, type DiceExpr } from "@/tools/random/random/lib/dice";
import { binomial, drawTicket, jackpotCombinations, matchCounts } from "@/tools/random/random/lib/lottery";
import { splitIntoTeams, teamSizes } from "@/tools/random/random/lib/teams";
import { allowedMatrix, drawSecretSanta, hasValidAssignment, isValidAssignment } from "@/tools/random/random/lib/santa";
import { generateNumbers, numberGrid } from "@/tools/random/random/lib/numbers";
import { countWeekdays, isoToDay, isWeekend, randomDate } from "@/tools/random/random/lib/dates";
import { ALPHABETS, drawLetters, letterPool } from "@/tools/random/random/lib/letters";
import { buildDeck, cardName } from "@/tools/random/random/lib/cards";
import { rpsOutcome } from "@/tools/random/random/lib/rps";

const expr = (s: string): DiceExpr => {
  const r = parseDice(s);
  if (!r.ok) throw new Error(`parse failed: ${s} (${r.error})`);
  return r.expr;
};

describe("dice notation parser", () => {
  it("parses standard forms", () => {
    expect(expr("2d6+3").terms).toEqual([
      { kind: "dice", sign: 1, count: 2, sides: 6 },
      { kind: "const", sign: 1, value: 3 },
    ]);
    expect(expr("4d6").text).toBe("4d6");
    expect(expr("d20-1").text).toBe("1d20-1");
    expect(expr("3d6+1d4").text).toBe("3d6+1d4");
    expect(expr(" 2 D 8 + 1 ").text).toBe("2d8+1");
    expect(expr("d%").text).toBe("1d100");
    expect(expr("3к6").text).toBe("3d6"); // Russian notation
    expect(expr("1d6−2").text).toBe("1d6-2"); // typographic minus
    expect(expr("2d6-1d4").terms[1]).toEqual({ kind: "dice", sign: -1, count: 1, sides: 4 });
  });

  it("rejects invalid input with a reason", () => {
    const err = (s: string) => {
      const r = parseDice(s);
      return r.ok ? null : r.error;
    };
    expect(err("")).toBe("empty");
    expect(err("abc")).toBe("syntax");
    expect(err("2d")).toBe("syntax");
    expect(err("5")).toBe("syntax"); // no dice at all
    expect(err("2d6++1")).toBe("syntax");
    expect(err("0d6")).toBe("count");
    expect(err("101d6")).toBe("count");
    expect(err("1d1")).toBe("sides");
    expect(err("1d1001")).toBe("sides");
    expect(err("100d6+100d6+1d6")).toBe("total");
  });

  it("computes range and stats", () => {
    expect(diceRange(expr("2d6+3"))).toEqual({ min: 5, max: 15 });
    expect(diceRange(expr("d20-1"))).toEqual({ min: 0, max: 19 });
    expect(diceRange(expr("1d6-1d4"))).toEqual({ min: -3, max: 5 });
    expect(diceStats(expr("2d6")).mean).toBe(7);
    expect(diceStats(expr("1d20+5")).mean).toBe(15.5);
    expect(diceStats(expr("1d6")).sd).toBeCloseTo(Math.sqrt(35 / 12), 12);
  });

  it("rolls stay within range and report each die", () => {
    const e = expr("3d6+1d4-2");
    for (let i = 0; i < 500; i++) {
      const r = rollDice(e);
      expect(r.groups[0].faces).toHaveLength(3);
      expect(r.groups[1].faces).toHaveLength(1);
      for (const f of r.groups[0].faces) expect(f >= 1 && f <= 6).toBe(true);
      const sum = r.groups[0].faces.reduce((a, b) => a + b, 0) + r.groups[1].faces[0] - 2;
      expect(r.total).toBe(sum);
      expect(r.total).toBeGreaterThanOrEqual(2);
      expect(r.total).toBeLessThanOrEqual(20);
    }
  });
});

describe("dice: exact sum distributions (convolution)", () => {
  it("2d6: P(7) = 6/36, P(2) = P(12) = 1/36", () => {
    const d = diceDistribution(expr("2d6"))!;
    expect(d.min).toBe(2);
    expect(d.outcomes).toBe(36n);
    expect(d.ways.map(Number)).toEqual([1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]);
    expect(d.ways[7 - d.min]).toBe(6n);
  });

  it("3d6 has 216 outcomes; 10 and 11 are the most likely (27 ways each)", () => {
    const d = diceDistribution(expr("3d6"))!;
    expect(d.outcomes).toBe(216n);
    expect(d.ways[10 - d.min]).toBe(27n);
    expect(d.ways[11 - d.min]).toBe(27n);
    expect(d.ways.reduce((a, b) => a + b, 0n)).toBe(216n);
  });

  it("4d6 sums to 1296 outcomes, P(14) = 146/1296", () => {
    const d = diceDistribution(expr("4d6"))!;
    expect(d.outcomes).toBe(1296n);
    expect(d.ways[14 - d.min]).toBe(146n);
  });

  it("handles modifiers and subtracted dice", () => {
    const d = diceDistribution(expr("1d20+5"))!;
    expect(d.min).toBe(6);
    expect(d.ways).toHaveLength(20);
    const n = diceDistribution(expr("1d6-1d6"))!;
    expect(n.min).toBe(-5);
    expect(n.ways.map(Number)).toEqual([1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]);
  });

  it("2d20 is triangular with 400 outcomes and a peak at 21", () => {
    const d = diceDistribution(expr("2d20"))!;
    expect(d.outcomes).toBe(400n);
    expect(d.ways[21 - d.min]).toBe(20n);
  });
});

describe("lottery: exact combinatorics", () => {
  it("binomial coefficients", () => {
    expect(binomial(45, 6)).toBe(8145060n);
    expect(binomial(36, 5)).toBe(376992n);
    expect(binomial(49, 6)).toBe(13983816n);
    expect(binomial(49, 7)).toBe(85900584n);
    expect(binomial(5, 0)).toBe(1n);
    expect(binomial(5, 6)).toBe(0n);
  });

  it("jackpot odds of multi-drum games", () => {
    expect(jackpotCombinations([{ pick: 5, of: 69 }, { pick: 1, of: 26 }])).toBe(292201338n);
    expect(jackpotCombinations([{ pick: 5, of: 50 }, { pick: 2, of: 12 }])).toBe(139838160n);
    expect(jackpotCombinations([{ pick: 4, of: 20 }, { pick: 4, of: 20 }])).toBe(23474025n);
  });

  it("match counts sum to all tickets (6 of 45: exactly 3 matches in 182 780 tickets)", () => {
    const c = matchCounts({ pick: 6, of: 45 });
    expect(c.reduce((a, b) => a + b, 0n)).toBe(8145060n);
    expect(c[6]).toBe(1n);
    expect(c[3]).toBe(20n * 9139n); // C(6,3)·C(39,3) = 182 780
  });

  it("draws sorted unique numbers in range", () => {
    for (let i = 0; i < 300; i++) {
      const [main, bonus] = drawTicket([{ pick: 5, of: 69 }, { pick: 1, of: 26 }]);
      expect(new Set(main).size).toBe(5);
      expect(main).toEqual([...main].sort((a, b) => a - b));
      for (const n of main) expect(n >= 1 && n <= 69).toBe(true);
      expect(bonus[0] >= 1 && bonus[0] <= 26).toBe(true);
    }
  });
});

describe("teams", () => {
  it("sizes differ by at most one and sum to the number of people", () => {
    for (let people = 0; people <= 30; people++) {
      for (let teams = 1; teams <= 6; teams++) {
        const s = teamSizes(people, teams);
        expect(s.reduce((a, b) => a + b, 0)).toBe(people);
        expect(Math.max(...s) - Math.min(...s)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("the extra member is not always on team 1", () => {
    const bigger = [0, 0];
    for (let i = 0; i < 400; i++) {
      const s = teamSizes(5, 2);
      bigger[s[0] === 3 ? 0 : 1]++;
    }
    expect(bigger[0]).toBeGreaterThan(120);
    expect(bigger[1]).toBeGreaterThan(120);
  });

  it("every team position gets extras equally often (7 people, 3 teams)", () => {
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) teamSizes(7, 3).forEach((s, t) => s === 3 && counts[t]++);
    for (const c of counts) expect(c).toBeGreaterThan(850);
  });

  it("deals every participant exactly once and picks captains from the team", () => {
    const people = Array.from({ length: 11 }, (_, i) => `p${i}`);
    const teams = splitIntoTeams(people, 3, true);
    expect(teams.flatMap((t) => t.members).sort()).toEqual([...people].sort());
    for (const t of teams) {
      expect(t.captain).toBeGreaterThanOrEqual(0);
      expect(t.captain).toBeLessThan(t.members.length);
    }
    expect(splitIntoTeams(people, 3).every((t) => t.captain === -1)).toBe(true);
  });
});

describe("secret santa", () => {
  it("produces derangements (nobody draws themselves) that are permutations", () => {
    for (let n = 3; n <= 12; n++) {
      for (let t = 0; t < 30; t++) {
        const r = drawSecretSanta(n);
        expect(r.ok).toBe(true);
        if (!r.ok) continue;
        expect(new Set(r.assignment).size).toBe(n);
        r.assignment.forEach((to, from) => expect(to).not.toBe(from));
      }
    }
  });

  it("respects exclusions in both directions", () => {
    const ex: [number, number][] = [
      [0, 1],
      [2, 3],
      [4, 0],
    ];
    const allowed = allowedMatrix(6, ex);
    for (let t = 0; t < 300; t++) {
      const r = drawSecretSanta(6, ex);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(isValidAssignment(r.assignment, allowed)).toBe(true);
      for (const [a, b] of ex) {
        expect(r.assignment[a]).not.toBe(b);
        expect(r.assignment[b]).not.toBe(a);
      }
    }
  });

  it("is uniform over all valid assignments (3 people → 2 derangements)", () => {
    const counts = new Map<string, number>();
    for (let t = 0; t < 4000; t++) {
      const r = drawSecretSanta(3);
      if (r.ok) counts.set(r.assignment.join(), (counts.get(r.assignment.join()) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual(["1,2,0", "2,0,1"]);
    for (const c of counts.values()) expect(c).toBeGreaterThan(1800);
  });

  it("detects impossible constraint sets", () => {
    expect(drawSecretSanta(2)).toEqual({ ok: false, error: "few" });
    // Person 0 is excluded from everyone else.
    expect(drawSecretSanta(3, [[0, 1], [0, 2]])).toEqual({ ok: false, error: "noRecipient", person: 0 });
    // 0 and 1 may only give to 3 (Hall's condition fails) although everyone has some option.
    const r = drawSecretSanta(4, [[0, 1], [0, 2], [1, 2]]);
    expect(r).toEqual({ ok: false, error: "impossible" });
    expect(hasValidAssignment(allowedMatrix(4, [[0, 1], [0, 2], [1, 2]]))).toBe(false);
    expect(hasValidAssignment(allowedMatrix(4, [[0, 1]]))).toBe(true);
  });
});

describe("random numbers", () => {
  it("builds the value grid for integers and decimals", () => {
    expect(numberGrid({ min: 1, max: 100, decimals: 0 })).toEqual({ lo: 1, hi: 100, scale: 1, size: 100 });
    expect(numberGrid({ min: 0, max: 1, decimals: 2 })).toEqual({ lo: 0, hi: 100, scale: 100, size: 101 });
    expect(numberGrid({ min: 0.1, max: 0.3, decimals: 1 })?.size).toBe(3);
    expect(numberGrid({ min: -5, max: 5, decimals: 0 })?.size).toBe(11);
    expect(numberGrid({ min: 5, max: 1, decimals: 0 })).toBeNull();
  });

  it("unique mode never repeats and fails clearly when impossible", () => {
    const r = generateNumbers({ min: 1, max: 10, decimals: 0 }, 10, true, true);
    expect(r).toEqual({ ok: true, values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] });
    expect(generateNumbers({ min: 1, max: 10, decimals: 0 }, 11, true, false)).toEqual({ ok: false, error: "unique" });
    const big = generateNumbers({ min: 1, max: 1e12, decimals: 0 }, 1000, true, false);
    expect(big.ok && new Set(big.values).size === 1000).toBe(true);
  });

  it("negative and decimal ranges stay in bounds", () => {
    const r = generateNumbers({ min: -2.5, max: 2.5, decimals: 1 }, 2000, false, false);
    expect(r.ok).toBe(true);
    if (r.ok) for (const v of r.values) expect(v >= -2.5 && v <= 2.5).toBe(true);
  });
});

describe("random dates", () => {
  it("parses ISO dates and counts weekdays", () => {
    const mon = isoToDay("2024-01-01")!; // Monday
    expect(isWeekend(mon)).toBe(false);
    expect(isWeekend(mon + 5)).toBe(true);
    expect(countWeekdays(mon, mon + 6)).toBe(5);
    expect(countWeekdays(mon, mon + 13)).toBe(10);
    expect(isoToDay("2024-02-30")).toBeNull();
  });

  it("weekdays-only never returns Saturday or Sunday and stays in range", () => {
    const a = isoToDay("2024-03-01")!;
    const b = isoToDay("2024-03-31")!;
    for (let i = 0; i < 500; i++) {
      const d = randomDate(a, b, true, true);
      expect(d.day >= a && d.day <= b).toBe(true);
      expect(isWeekend(d.day)).toBe(false);
      expect(d.minute >= 0 && d.minute < 1440).toBe(true);
    }
    const sat = isoToDay("2024-03-02")!;
    expect(() => randomDate(sat, sat + 1, true, false)).toThrow(RangeError);
  });
});

describe("rock paper scissors", () => {
  it("rock beats scissors, paper beats rock, scissors beat paper", () => {
    expect(rpsOutcome(0, 2)).toBe("win");
    expect(rpsOutcome(1, 0)).toBe("win");
    expect(rpsOutcome(2, 1)).toBe("win");
    expect(rpsOutcome(2, 0)).toBe("lose");
    expect(rpsOutcome(0, 1)).toBe("lose");
    expect(rpsOutcome(1, 2)).toBe("lose");
    for (const m of [0, 1, 2] as const) expect(rpsOutcome(m, m)).toBe("draw");
  });
});

describe("letters and cards", () => {
  it("alphabets have the right sizes", () => {
    expect(ALPHABETS.ru.letters).toHaveLength(33);
    expect(ALPHABETS.en.letters).toHaveLength(26);
    expect(ALPHABETS.kk.letters).toHaveLength(42);
    expect(letterPool(ALPHABETS.ru, "vowels", false)).toHaveLength(10);
    expect(letterPool(ALPHABETS.ru, "consonants", false)).toHaveLength(21);
    expect(letterPool(ALPHABETS.ru, "all", true)).not.toContain("Ъ");
  });

  it("unique letters never repeat", () => {
    const pool = letterPool(ALPHABETS.en, "all", false);
    const d = drawLetters(pool, 26, true);
    expect(new Set(d).size).toBe(26);
  });

  it("decks and Russian card names", () => {
    expect(buildDeck(52)).toHaveLength(52);
    expect(buildDeck(36)).toHaveLength(36);
    expect(cardName({ rank: 12, suit: "H" }, "ru")).toBe("Дама червей");
    expect(cardName({ rank: 14, suit: "S" }, "ru")).toBe("Туз пик");
    expect(cardName({ rank: 10, suit: "D" }, "en")).toBe("Ten of Diamonds");
  });
});
