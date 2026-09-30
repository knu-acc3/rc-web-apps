import { describe, expect, it } from "vitest";
import { CITIES, COUNTRIES, cityBySlug, countryBySlug, zoneInfo } from "@/sections/time/model";
import { loadPlaces, parseOffsetQuery, searchPlaces } from "@/sections/time/lib/places";
import { sunDay } from "@/sections/time/lib/sun";
import { fmtOffset, nextTransition, offsetSlug, parseOffsetSlug, transitions, tzOffset, zoned, zonedToUtc } from "@/sections/time/lib/tz";

/** Local "HH:MM" of a UTC instant at a fixed offset. */
const hm = (t: number | null, off: number) => {
  if (t === null) return null;
  const d = new Date(t + off * 60000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};
const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
const near = (actual: string | null, expected: string, tol = 3) => {
  expect(actual).not.toBeNull();
  expect(Math.abs(minutes(actual!) - minutes(expected))).toBeLessThanOrEqual(tol);
};

describe("sunrise and sunset (NOAA)", () => {
  // Reference values: timeanddate.com / NOAA solar calculator, local time.
  it.each([
    ["Moscow, June 21", 55.7558, 37.6173, 2024, 6, 21, 180, "03:44", "21:18"],
    ["Moscow, December 22", 55.7558, 37.6173, 2024, 12, 22, 180, "08:59", "15:58"],
    ["London, June 21", 51.5074, -0.1278, 2024, 6, 21, 60, "04:43", "21:21"],
    ["London, December 21", 51.5074, -0.1278, 2024, 12, 21, 0, "08:04", "15:53"],
    ["Quito, March 20", -0.1807, -78.4678, 2024, 3, 20, -300, "06:17", "18:23"],
    ["Sydney, December 21", -33.8688, 151.2093, 2024, 12, 21, 660, "05:41", "20:05"],
  ])("%s", (_n, lat, lon, y, m, d, off, rise, set) => {
    const s = sunDay(y as number, m as number, d as number, lat as number, lon as number, off as number);
    near(hm(s.sunrise, off as number), rise as string);
    near(hm(s.sunset, off as number), set as string);
  });

  it("polar day and polar night in Murmansk", () => {
    expect(sunDay(2026, 6, 21, 68.9585, 33.0827, 180).polar).toBe("day");
    expect(sunDay(2026, 12, 21, 68.9585, 33.0827, 180).polar).toBe("night");
    expect(sunDay(2026, 3, 20, 68.9585, 33.0827, 180).polar).toBeNull();
  });
});

describe("time zones via Intl", () => {
  it("Kazakhstan is UTC+5 since March 2024", () => {
    const t = Date.UTC(2025, 5, 1);
    for (const tz of ["Asia/Almaty", "Asia/Qostanay", "Asia/Aqtobe", "Asia/Oral", "Asia/Qyzylorda"]) expect(tzOffset(tz, t)).toBe(300);
    expect(tzOffset("Asia/Almaty", Date.UTC(2023, 5, 1))).toBe(360);
  });

  it("offsets and DST", () => {
    expect(tzOffset("Europe/Moscow", Date.UTC(2026, 0, 15))).toBe(180);
    expect(tzOffset("America/New_York", Date.UTC(2026, 0, 15))).toBe(-300);
    expect(tzOffset("America/New_York", Date.UTC(2026, 6, 15))).toBe(-240);
    expect(tzOffset("Asia/Kolkata", Date.UTC(2026, 6, 15))).toBe(330);
    expect(tzOffset("Asia/Kathmandu", Date.UTC(2026, 6, 15))).toBe(345);
  });

  it("finds DST transitions of 2026", () => {
    const tr = transitions("Europe/London", Date.UTC(2026, 0, 1), Date.UTC(2027, 0, 1));
    expect(tr.map((x) => new Date(x.at).toISOString())).toEqual(["2026-03-29T01:00:00.000Z", "2026-10-25T01:00:00.000Z"]);
    expect(nextTransition("Europe/Moscow", Date.UTC(2026, 0, 1))).toBeNull();
    const ny = nextTransition("America/New_York", Date.UTC(2026, 8, 30));
    expect(new Date(ny!.at).toISOString()).toBe("2026-11-01T06:00:00.000Z");
  });

  it("wall time ↔ UTC", () => {
    expect(new Date(zonedToUtc("Asia/Almaty", 2026, 1, 1, 0, 0)).toISOString()).toBe("2025-12-31T19:00:00.000Z");
    expect(new Date(zonedToUtc(330, 2026, 1, 1, 12, 0)).toISOString()).toBe("2026-01-01T06:30:00.000Z");
    const p = zoned("Asia/Tokyo", Date.UTC(2026, 11, 31, 20, 0));
    expect([p.y, p.m, p.d, p.h, p.wd]).toEqual([2027, 1, 1, 5, 5]);
  });
});

describe("offset slugs", () => {
  it.each([
    [0, "utc", "UTC+0"],
    [300, "utc-plus-5", "UTC+5"],
    [330, "utc-plus-5-30", "UTC+5:30"],
    [345, "utc-plus-5-45", "UTC+5:45"],
    [-210, "utc-minus-3-30", "UTC−3:30"],
    [-720, "utc-minus-12", "UTC−12"],
    [840, "utc-plus-14", "UTC+14"],
  ])("%i ↔ %s", (off, slug, label) => {
    expect(offsetSlug(off)).toBe(slug);
    expect(parseOffsetSlug(slug)).toBe(off);
    expect(fmtOffset(off)).toBe(label);
  });

  it("rejects invalid slugs", () => {
    for (const s of ["utc-plus-15", "utc-minus-13", "utc-plus-5-20", "utc-plus-0", "gmt-plus-3", "utc-plus"]) expect(parseOffsetSlug(s)).toBeNull();
  });
});

describe("city dataset", () => {
  it("has correct zones and no placeholder coordinates", () => {
    expect(CITIES.length).toBeGreaterThan(600);
    expect(CITIES.every((c) => !(c.lat === 0 && c.lon === 0))).toBe(true);
    expect(cityBySlug.get("almaty")?.tz).toBe("Asia/Almaty");
    expect(cityBySlug.get("vancouver")?.tz).toBe("America/Vancouver");
    expect(cityBySlug.get("perth")?.tz).toBe("Australia/Perth");
    expect(cityBySlug.get("izhevsk")?.tz).toBe("Europe/Samara");
    expect(zoneInfo("Asia/Almaty", 2026)).toMatchObject({ std: 300, hasDst: false });
  });

  it("Russian names and prepositional forms", () => {
    expect(cityBySlug.get("moscow")).toMatchObject({ ru: "Москва", ruIn: "в Москве" });
    expect(cityBySlug.get("vladivostok")?.ruIn).toBe("во Владивостоке");
    expect(cityBySlug.get("almaty")?.ruIn).toBe("в Алматы");
    expect(countryBySlug.get("kazakhstan")?.ruIn).toBe("в Казахстане");
    expect(COUNTRIES.every((c) => /^(в|во|на) /.test(c.ruIn))).toBe(true);
  });
});

describe("place search", () => {
  it("finds cities by Russian and English names, zones and offsets", async () => {
    const list = await loadPlaces("ru");
    expect(searchPlaces(list, "Алматы", "ru")[0].key).toBe("almaty");
    expect(searchPlaces(list, "almaty", "ru")[0].key).toBe("almaty");
    expect(searchPlaces(list, "нью", "ru")[0].key).toBe("new-york");
    expect(searchPlaces(list, "MSK", "ru")[0].key).toBe("zone:msk");
    expect(searchPlaces(list, "utc+5:30", "ru")[0]).toMatchObject({ offset: 330 });
    expect(searchPlaces(list, "Казахстан", "ru").every((p) => p.sub === "Казахстан")).toBe(true);
  });

  it("parses offsets typed as text", () => {
    expect(parseOffsetQuery("GMT-3", "en")?.offset).toBe(-180);
    expect(parseOffsetQuery("мск+2", "ru")?.offset).toBe(300);
    expect(parseOffsetQuery("utc+15", "ru")).toBeNull();
  });
});
