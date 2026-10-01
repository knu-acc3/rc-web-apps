import { describe, expect, it } from "vitest";
import { det, eigenvalues, inverse, madd, mmul, rank, rref, transpose, type M } from "@/tools/calc/calc/algebra/matrix";
import { complexText, cubic, linear, poly, quadratic } from "@/tools/calc/calc/algebra/poly";
import { parseQ, q, toText } from "@/tools/calc/calc/algebra/rational";
import { solveSystem } from "@/tools/calc/calc/algebra/system";

const m = (rows: (number | string)[][]): M => rows.map((r) => r.map((x) => (typeof x === "number" ? q(x) : parseQ(x)!)));
const txt = (a: M | null) => a?.map((r) => r.map((x) => toText(x, "-")));

describe("equations", () => {
  it("linear edge cases", () => {
    expect(linear(2, 3, 11)).toEqual({ kind: "one", x: 4 });
    expect(linear(0, 3, 3)).toEqual({ kind: "all" });
    expect(linear(0, 3, 4)).toEqual({ kind: "none" });
  });

  it("quadratic with real roots", () => {
    const r = quadratic("en", 1, -3, 2);
    expect(r.D).toBe(1);
    expect(r.roots.map((z) => z.re)).toEqual([1, 2]);
    expect(quadratic("en", 1, -4, 4).roots.map((z) => z.re)).toEqual([2, 2]);
    expect(quadratic("en", 1, -3, 1).exact).toBe("(3 ± √5) / 2");
    expect(quadratic("en", 1, -2, -4).exact).toBe("1 ± √5");
  });

  it("quadratic with complex roots", () => {
    const r = quadratic("en", 1, 2, 5);
    expect(r.D).toBe(-16);
    expect(r.roots).toEqual([
      { re: -1, im: 2 },
      { re: -1, im: -2 },
    ]);
    expect(r.exact).toBe("−1 ± 2i");
    expect(quadratic("en", 1, 1, 1).exact).toBe("(−1 ± i√3) / 2");
    expect(complexText("ru", { re: -1, im: -2 })).toBe("−1 − 2i");
    expect(complexText("ru", { re: 0, im: 1 })).toBe("i");
  });

  it("cubic", () => {
    const r = cubic(1, -6, 11, -6);
    expect(r.nature).toBe("three-real");
    expect(r.roots.map((z) => z.re)).toEqual([1, 2, 3]);
    const c = cubic(1, 0, 0, 1);
    expect(c.nature).toBe("one-real");
    expect(c.roots[0]).toEqual({ re: -1, im: 0 });
    expect(c.roots[1].re).toBeCloseTo(0.5, 10);
    expect(c.roots[1].im).toBeCloseTo(0.8660254, 6);
    expect(cubic(1, -3, 3, -1).roots.map((z) => z.re)).toEqual([1, 1, 1]);
    expect(cubic(1, -5, 8, -4).nature).toBe("multiple"); // (x−1)(x−2)²
  });

  it("formats polynomials without '+ −'", () => {
    expect(poly("en", [1, -3, 2])).toBe("x² − 3x + 2");
    expect(poly("en", [-1, 0, 4])).toBe("−x² + 4");
    expect(poly("ru", [2.5, -1, -0.5])).toBe("2,5x² − x − 0,5");
    expect(poly("en", [1, 0, 0, -8])).toBe("x³ − 8");
    expect(poly("en", [0, 0, 0])).toBe("0");
    expect(poly("en", [1, -3, 2])).not.toContain("+ -");
  });

  it("2×2 and 3×3 systems (Cramer)", () => {
    const r = solveSystem(m([[2, 3], [1, -1]]), [q(13), q(-1)]);
    expect(r.kind).toBe("one");
    if (r.kind === "one") expect(r.x.map((x) => toText(x))).toEqual(["2", "3"]);
    const s = solveSystem(m([[1, 1, 1], [0, 2, 5], [2, 5, -1]]), [q(6), q(-4), q(27)]);
    if (s.kind === "one") expect(s.x.map((x) => toText(x, "-"))).toEqual(["5", "3", "-2"]);
    expect(solveSystem(m([[1, 2], [2, 4]]), [q(3), q(7)]).kind).toBe("none");
    expect(solveSystem(m([[1, 2], [2, 4]]), [q(3), q(6)]).kind).toBe("infinite");
  });
});

describe("matrices", () => {
  it("determinants", () => {
    expect(toText(det(m([[1, 2], [3, 4]]))!)).toBe("−2");
    expect(toText(det(m([[2, -3, 1], [2, 0, -1], [1, 4, 5]]))!)).toBe("49");
    expect(toText(det(m([["1/2", 1], [1, 2]]))!)).toBe("0");
  });

  it("inverse exactly", () => {
    expect(txt(inverse(m([[4, 7], [2, 6]])))).toEqual([
      ["3/5", "-7/10"],
      ["-1/5", "2/5"],
    ]);
    expect(inverse(m([[1, 2], [2, 4]]))).toBeNull();
  });

  it("rank, RREF, products", () => {
    expect(rank(m([[1, 2, 3], [2, 4, 6], [1, 0, 1]]))).toBe(2);
    const r = rref(m([[2, 4], [1, 3]]));
    expect(txt(r.R)).toEqual([
      ["1", "0"],
      ["0", "1"],
    ]);
    expect(r.ops.length).toBeGreaterThan(0);
    expect(txt(mmul(m([[1, 2], [3, 4]]), m([[5, 6], [7, 8]])))).toEqual([
      ["19", "22"],
      ["43", "50"],
    ]);
    expect(mmul(m([[1, 2]]), m([[1, 2]]))).toBeNull();
    expect(txt(transpose(m([[1, 2, 3]])))).toEqual([["1"], ["2"], ["3"]]);
    expect(txt(madd(m([[1, 2]]), m([[3, 4]]), true))).toEqual([["-2", "-2"]]);
  });

  it("eigenvalues 2×2 and 3×3", () => {
    expect(eigenvalues(m([[2, 0], [0, 3]]))!.roots.map((z) => z.re)).toEqual([2, 3]);
    const rot = eigenvalues(m([[0, -1], [1, 0]]))!.roots;
    expect(rot).toEqual([
      { re: 0, im: 1 },
      { re: 0, im: -1 },
    ]);
    expect(eigenvalues(m([[2, 0, 0], [0, 3, 4], [0, 4, 9]]))!.roots.map((z) => z.re)).toEqual([1, 2, 11]);
  });
});
