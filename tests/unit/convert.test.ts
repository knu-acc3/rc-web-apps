import { describe, expect, it } from "vitest";
import { clean, convert, relation } from "@/sections/convert/lib/engine";
import { QUANTITIES } from "@/sections/convert/data/units";

const unit = (slug: string) => {
  for (const q of QUANTITIES) for (const u of q.units) if (u.slug === slug) return u;
  throw new Error(slug);
};

describe("unit engine", () => {
  it.each([
    ["kilometers", "miles", 1, 0.621371192237],
    ["miles", "kilometers", 1, 1.609344],
    ["celsius", "fahrenheit", 100, 212],
    ["fahrenheit", "celsius", 32, 0],
    ["celsius", "kelvin", 0, 273.15],
    ["kelvin", "rankine", 100, 180],
    ["pounds", "kilograms", 1, 0.45359237],
    ["ares", "square-meters", 10, 1000],
    ["liters-per-100-km", "mpg-us", 10, 23.5214583],
    ["mpg-us", "liters-per-100-km", 30, 7.84048611],
    ["bars", "psi", 1, 14.5037738],
    ["kilocalories", "kilojoules", 1, 4.184],
    ["metric-horsepower", "kilowatts", 100, 73.549875],
    ["degrees", "radians", 180, Math.PI],
  ])("%s → %s", (a, b, v, expected) => {
    expect(clean(convert(v, unit(a), unit(b)))).toBeCloseTo(expected, 5);
  });

  it("round-trips every unit", () => {
    for (const q of QUANTITIES)
      for (const u of q.units) for (const w of q.units) expect(convert(convert(7.25, u, w), w, u)).toBeCloseTo(7.25, 6);
  });

  it("affine relation for °C → °F is ×1.8 + 32", () => {
    expect(relation(unit("celsius"), unit("fahrenheit"))).toEqual({ type: "mul", m: 1.8, c: 32 });
  });
});
