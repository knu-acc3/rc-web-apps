import { describe, expect, it } from "vitest";
import { grossFromNet, KZ, SALARY_PAGES, salaryKz } from "@/tools/calc/finance/lib/salary-kz";

describe("KZ salary 2026 — gross 500 000 ₸ (documented reference)", () => {
  // OPV = 10 % × 500 000 = 50 000; VOSMS = 2 % × 500 000 = 10 000; deduction = 30 MRP × 4 325 = 129 750
  // taxable = 500 000 − 50 000 − 10 000 − 129 750 = 310 250; IPN = 10 % = 31 025; net = 408 975
  // SO = 5 % × (500 000 − 50 000) = 22 500; OPVR = 2.5 % × 500 000 = 12 500; OOSMS = 3 % × 500 000 = 15 000
  // SN = 6 % × (500 000 − 50 000 − 10 000) = 26 400 (no SO deduction); employer cost = 576 400
  const r = salaryKz(500_000, 2026);
  it("employee side", () => {
    expect(r.opv).toBe(50_000);
    expect(r.vosms).toBe(10_000);
    expect(r.deduction).toBe(129_750);
    expect(r.taxable).toBe(310_250);
    expect(r.ipn).toBe(31_025);
    expect(r.net).toBe(408_975);
  });
  it("employer side", () => {
    expect(r.so).toBe(22_500);
    expect(r.opvr).toBe(12_500);
    expect(r.oosms).toBe(15_000);
    expect(r.sn).toBe(26_400);
    expect(r.employerTotal).toBe(576_400);
  });
});

describe("KZ salary 2025 — gross 500 000 ₸", () => {
  // deduction = 14 × 3 932 = 55 048; taxable = 384 952; IPN = 38 495.2 → 38 495; net = 401 505
  // SN = 9.5 % × 440 000 − SO 22 500 = 41 800 − 22 500 = 19 300; OPVR 1.5 % = 7 500; cost = 564 300
  const r = salaryKz(500_000, 2025);
  it("matches the hand calculation", () => {
    expect(r.deduction).toBe(55_048);
    expect(r.ipn).toBe(38_495);
    expect(r.net).toBe(401_505);
    expect(r.so).toBe(22_500);
    expect(r.opvr).toBe(7_500);
    expect(r.oosms).toBe(15_000);
    expect(r.sn).toBe(19_300);
    expect(r.employerTotal).toBe(564_300);
  });

  it("applies the 90 % adjustment for income ≤ 25 MRP (98 300 ₸)", () => {
    // 85 000: OPV 8 500, VOSMS 1 700, taxable 85 000 − 8 500 − 1 700 − 55 048 = 19 752 → ×10 % → 1 975.2 → IPN 197.52 → 198
    const m = salaryKz(85_000, 2025);
    expect(m.opv).toBe(8_500);
    expect(m.vosms).toBe(1_700);
    expect(m.adjusted).toBe(true);
    expect(m.ipn).toBe(198);
    expect(salaryKz(98_301, 2025).adjusted).toBe(false);
    expect(salaryKz(85_000, 2026).adjusted).toBe(false);
  });
});

describe("caps and limits", () => {
  it("caps OPV at 50 MZP, VOSMS at 20 MZP, SO at 7 MZP, OOSMS at 40 MZP", () => {
    const r = salaryKz(5_000_000, 2026);
    expect(r.opv).toBe(425_000); // 10 % × 4 250 000
    expect(r.vosms).toBe(34_000); // 2 % × 1 700 000
    expect(r.so).toBe(29_750); // 5 % × 595 000
    expect(r.oosms).toBe(102_000); // 3 % × 3 400 000
    expect(r.opvr).toBe(106_250); // 2.5 % × 4 250 000
  });

  it("uses 15 % IPN only above 8 500 MRP a year (annualised)", () => {
    const threshold = (8500 * 4325) / 12; // 3 063 541.67 taxable per month
    const r = salaryKz(5_000_000, 2026);
    const taxable = 5_000_000 - 425_000 - 34_000 - 129_750;
    expect(r.ipn).toBe(Math.round(threshold * 0.1 + (taxable - threshold) * 0.15));
    // every curated page stays below the threshold → flat 10 %
    const top = salaryKz(3_000_000, 2026);
    expect(top.ipn).toBe(Math.round(top.taxable * 0.1));
  });

  it("SO and SN use the 1 MZP minimum base", () => {
    const r = salaryKz(50_000, 2026);
    expect(r.so).toBe(4_250); // 5 % × 85 000
    expect(r.sn).toBe(5_100); // 6 % × 85 000
    expect(salaryKz(0, 2026).so).toBe(0);
  });

  it("standard deduction can be switched off", () => {
    const r = salaryKz(500_000, 2026, { deduction: false });
    expect(r.ipn).toBe(44_000); // 10 % × 440 000
  });

  it("constants are the documented ones", () => {
    expect(KZ[2026].mrp).toBe(4325);
    expect(KZ[2025].mrp).toBe(3932);
    expect(KZ[2026].opvrRate).toBe(0.025);
    expect(KZ[2025].opvrRate).toBe(0.015);
    expect(KZ[2026].soRate).toBe(0.05);
  });
});

describe("net → gross", () => {
  it("round-trips", () => {
    for (const g of [85_000, 150_000, 500_000, 1_234_567, 3_000_000]) {
      for (const y of [2025, 2026] as const) {
        const net = salaryKz(g, y).net;
        const back = grossFromNet(net, y);
        expect(back.net).toBeGreaterThanOrEqual(net);
        expect(salaryKz(back.gross - 1, y).net).toBeLessThan(net);
      }
    }
  });

  it("net is monotone in 2026 and has 40 curated pages", () => {
    let prev = -1;
    for (let g = 0; g <= 400_000; g += 997) {
      const n = salaryKz(g, 2026).net;
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
    expect(SALARY_PAGES).toHaveLength(40);
  });
});
