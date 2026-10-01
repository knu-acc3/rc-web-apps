import { describe, expect, it } from "vitest";
import { ruCardinalCase } from "@/sections/numbers/lib/declension";
import { ruCardinal } from "@/sections/numbers/lib/words-ru";

describe("Russian numeral declension", () => {
  it("nominative equals the cardinal engine", () => {
    for (const n of [1, 2, 5, 11, 21, 40, 99, 101, 999, 1000, 1001, 2024, 21_000, 22_222, 1_000_000, 2_000_002, 123_456_789]) {
      expect(ruCardinalCase(n, "nom")).toBe(ruCardinal(n));
      expect(ruCardinalCase(n, "nom", "f")).toBe(ruCardinal(n, "f"));
    }
  });

  it("declines 2024", () => {
    expect(ruCardinalCase(2024, "gen")).toBe("двух тысяч двадцати четырёх");
    expect(ruCardinalCase(2024, "dat")).toBe("двум тысячам двадцати четырём");
    expect(ruCardinalCase(2024, "acc")).toBe("две тысячи двадцать четыре");
    expect(ruCardinalCase(2024, "ins")).toBe("двумя тысячами двадцатью четырьмя");
    expect(ruCardinalCase(2024, "pre")).toBe("двух тысячах двадцати четырёх");
  });

  it("agrees scale nouns and gender", () => {
    expect(ruCardinalCase(1000, "ins")).toBe("одной тысячей");
    expect(ruCardinalCase(1000, "acc")).toBe("одну тысячу");
    expect(ruCardinalCase(21_000, "gen")).toBe("двадцати одной тысячи");
    expect(ruCardinalCase(5000, "pre")).toBe("пяти тысячах");
    expect(ruCardinalCase(1_000_000, "gen")).toBe("одного миллиона");
    expect(ruCardinalCase(5_000_000, "dat")).toBe("пяти миллионам");
    expect(ruCardinalCase(541, "ins")).toBe("пятьюстами сорока одним");
    expect(ruCardinalCase(1, "acc", "f")).toBe("одну");
    expect(ruCardinalCase(2, "gen", "f")).toBe("двух");
    expect(ruCardinalCase(90, "ins")).toBe("девяноста");
    expect(ruCardinalCase(100, "dat")).toBe("ста");
    expect(ruCardinalCase(0, "ins")).toBe("нулём");
  });
});
