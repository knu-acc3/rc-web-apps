import { describe, expect, it } from "vitest";
import { seasonMoment, type Season } from "@/sections/countdown/lib/astro";

// Reference instants (UTC, rounded to the minute) as published by the US Naval Observatory.
const REF: [number, Season, string][] = [
  [2024, "march", "2024-03-20T03:06:00Z"],
  [2024, "june", "2024-06-20T20:51:00Z"],
  [2024, "september", "2024-09-22T12:44:00Z"],
  [2024, "december", "2024-12-21T09:21:00Z"],
  [2025, "march", "2025-03-20T09:01:00Z"],
  [2025, "june", "2025-06-21T02:42:00Z"],
  [2025, "september", "2025-09-22T18:19:00Z"],
  [2025, "december", "2025-12-21T15:03:00Z"],
];

describe("equinoxes and solstices (Meeus)", () => {
  it.each(REF)("%i %s ≈ %s", (y, s, iso) => {
    const diffMin = Math.abs(seasonMoment(y, s) - Date.parse(iso)) / 60000;
    expect(diffMin).toBeLessThan(3);
  });
});
