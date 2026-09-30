import { describe, expect, it } from "vitest";
import {
  SHOE_SYSTEMS,
  allSizes,
  chartRows,
  footFrom,
  footFromEu,
  kidsLabel,
  lookupRow,
  sizeIn,
  sizeOptions,
  type ShoeGroup,
} from "@/sections/sizes/shoes/engine";
import { MEN, SHIRTS, WOMEN, menByMeasure, womenByMeasure } from "@/sections/sizes/clothing/data";
import {
  circumference,
  diameterFrom,
  diameterToJp,
  diameterToUs,
  jpToDiameter,
  ringSizes,
  ukIndexFromCirc,
  ukLabel,
  ukOptions,
  usToDiameter,
} from "@/sections/sizes/rings/engine";
import { BANDS, EU_CUPS, braFromMeasure, braSize, sisterSizes } from "@/sections/sizes/bra/engine";

const GROUPS: ShoeGroup[] = ["men", "women", "kids"];

describe("shoe sizes", () => {
  it("reference points of the model", () => {
    const f = footFromEu(42);
    expect(f).toBeCloseTo(26.67, 2);
    expect(allSizes(f, "men")).toMatchObject({ eu: 42, ru: 41, uk: 8, us: 9, cm: 26.5 });
    expect(allSizes(footFromEu(38), "women")).toMatchObject({ eu: 38, ru: 37, uk: 5, us: 7, cm: 24 });
    expect(allSizes(footFromEu(25), "kids")).toMatchObject({ eu: 25, ru: 25, uk: 7.5, us: 8 });
    expect(kidsLabel("us", sizeIn("us", footFromEu(35), "kids"))).toEqual({ n: 3, scale: "adult" });
  });

  for (const g of GROUPS) {
    it(`${g}: chart rows are complete and strictly increasing`, () => {
      const rows = chartRows(g);
      expect(rows.length).toBeGreaterThan(8);
      for (const r of rows) for (const k of ["foot", "eu", "ru", "uk", "us", "cm"] as const) expect(Number.isFinite(r[k]), `${g} ${r.eu} ${k}`).toBe(true);
      for (let i = 1; i < rows.length; i++) {
        for (const k of ["foot", "eu", "ru", "uk", "us"] as const) expect(rows[i][k], `${g} ${rows[i].eu} ${k}`).toBeGreaterThan(rows[i - 1][k]);
        expect(rows[i].cm).toBeGreaterThanOrEqual(rows[i - 1].cm);
        expect(rows[i].range[0]).toBeCloseTo(rows[i - 1].range[1], 9);
      }
    });

    it(`${g}: every value of a row looks up the same row`, () => {
      for (const r of chartRows(g)) {
        for (const s of SHOE_SYSTEMS) expect(lookupRow(s, r[s], g)?.eu, `${g} ${s}=${r[s]}`).toBe(r.eu);
      }
    });

    it(`${g}: a value converted to foot length and back is unchanged`, () => {
      for (const s of SHOE_SYSTEMS) {
        for (const v of sizeOptions(s, g)) expect(sizeIn(s, footFrom(s, v, g), g), `${g} ${s} ${v}`).toBe(v);
      }
    });
  }

  it("US women = US men + 1, RU = EU − 1 for adults", () => {
    for (const eu of [36, 38, 40, 42, 44]) {
      const f = footFromEu(eu);
      expect(sizeIn("us", f, "women") - sizeIn("us", f, "men")).toBe(1);
      expect(sizeIn("ru", f, "men")).toBe(eu - 1);
    }
  });
});

describe("clothing sizes", () => {
  it("women: RU 44 = S = DE 38 = FR 40 = IT 42 = UK 10 = US 6, bust 88", () => {
    const r = WOMEN.find((x) => x.ru === 44)!;
    expect(r).toMatchObject({ int: "S", de: 38, fr: 40, it: 42, uk: 10, us: 6, bust: 88, waist: 70, hips: 96 });
  });

  it("men: RU 48 = M = EU 48 = chest 38 in (96 cm)", () => {
    const r = MEN.find((x) => x.ru === 48)!;
    expect(r).toMatchObject({ int: "M", eu: 48, it: 48, chestIn: 38, chest: 96 });
  });

  it("tables are monotonic and complete", () => {
    for (const rows of [WOMEN, MEN] as unknown as { [k: string]: number | string }[][]) {
      const keys = Object.keys(rows[0]).filter((k) => typeof rows[0][k] === "number");
      for (let i = 1; i < rows.length; i++) for (const k of keys) expect(rows[i][k] as number, k).toBeGreaterThan(rows[i - 1][k] as number);
      expect(new Set(rows.map((r) => r.int)).size).toBe(rows.length);
    }
    for (let i = 1; i < SHIRTS.length; i++) {
      expect(SHIRTS[i].collar).toBeGreaterThan(SHIRTS[i - 1].collar);
      expect(SHIRTS[i].collarIn).toBeGreaterThan(SHIRTS[i - 1].collarIn);
    }
  });

  it("tops and bottoms are picked by different measurements", () => {
    // Bust 88 (size 44 top) with hips 100 (size 46 bottom).
    expect(womenByMeasure("tops", { bust: 88 })?.ru).toBe(44);
    expect(womenByMeasure("bottoms", { hips: 100 })?.ru).toBe(46);
    expect(menByMeasure("tops", { chest: 100 })?.ru).toBe(50);
    expect(menByMeasure("bottoms", { waist: 82 })?.ru).toBe(48);
    // Round trip: each row's own measurements select the row.
    for (const r of WOMEN) {
      expect(womenByMeasure("tops", { bust: r.bust })?.ru).toBe(r.ru);
      expect(womenByMeasure("bottoms", { hips: r.hips, waist: r.waist })?.ru).toBe(r.ru);
    }
    for (const r of MEN) expect(menByMeasure("tops", { chest: r.chest })?.ru).toBe(r.ru);
  });
});

describe("ring sizes", () => {
  it("US formula d = 11.63 + 0.8128 × US", () => {
    expect(usToDiameter(7)).toBeCloseTo(17.3196, 4);
    expect(diameterToUs(usToDiameter(9.5))).toBeCloseTo(9.5, 9);
    expect(usToDiameter(5)).toBeCloseTo(15.694, 3);
  });

  it("diameter ↔ circumference", () => {
    expect(circumference(17)).toBeCloseTo(53.407, 3);
    expect(diameterFrom("c", circumference(18.25))).toBeCloseTo(18.25, 9);
    expect(diameterFrom("eu", 54)).toBeCloseTo(17.189, 3);
  });

  it("UK letters (C = 40 mm, 1.25 mm per letter) and JIS sizes", () => {
    expect(ukLabel(ukIndexFromCirc(40))).toBe("C");
    expect(ukLabel(ukIndexFromCirc(53.75))).toBe("N");
    expect(ukLabel(ukIndexFromCirc(54.375))).toBe("N½");
    expect(ringSizes(usToDiameter(7)).uk).toBe("N½");
    expect(jpToDiameter(1)).toBe(13);
    expect(jpToDiameter(13)).toBe(17);
    expect(diameterToJp(15.667)).toBeCloseTo(9, 2);
    expect(circumference(jpToDiameter(9))).toBeCloseTo(49.2, 1);
  });

  it("RU 17 converts to US ≈ 6.5, EU 53, JP 13", () => {
    expect(ringSizes(17)).toMatchObject({ ru: 17, us: 6.5, eu: 53, jp: 13 });
  });

  it("UK options are ordered and every option round-trips", () => {
    const opts = ukOptions();
    for (let i = 1; i < opts.length; i++) expect(opts[i].index).toBeGreaterThan(opts[i - 1].index);
    for (const o of opts) expect(ringSizes(diameterFrom("uk", o.index)).uk).toBe(o.label);
  });
});

describe("bra sizes", () => {
  it("75B converts to UK 34B, FR 90B; E → UK DD", () => {
    expect(braSize(75, "B")).toMatchObject({ eu: "75B", ru: "75B", fr: "90B", uk: "34B", us: "34B", underbust: [73, 77], bust: [87, 92] });
    expect(braSize(80, "E").uk).toBe("36DD");
    expect(braSize(70, "F").uk).toBe("32E");
  });

  it("measurements pick band and cup; every size round-trips", () => {
    expect(braFromMeasure(75, 90)).toEqual({ band: 75, cup: "B" });
    expect(braFromMeasure(68, 84)).toEqual({ band: 70, cup: "C" });
    for (const b of BANDS) {
      for (const c of EU_CUPS) {
        const s = braSize(b, c);
        const mid = (s.underbust[0] + s.underbust[1]) / 2;
        expect(braFromMeasure(mid, mid + (s.bust[0] - s.underbust[0]))).toEqual({ band: b, cup: c });
      }
    }
  });

  it("sister sizes", () => {
    expect(sisterSizes(75, "B")).toEqual([
      { band: 70, cup: "C" },
      { band: 80, cup: "A" },
    ]);
  });
});
