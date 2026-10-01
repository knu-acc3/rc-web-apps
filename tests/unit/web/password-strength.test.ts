import { describe, expect, it } from "vitest";
import { checkStrength } from "@/tools/web/password/lib/strength-core";
import { humanDuration } from "@/tools/web/password/lib/time";

describe("password strength (zxcvbn-ts)", () => {
  it("rates repeated dictionary words as weak", () => {
    expect(checkStrength("passwordpasswordpassword", "en").score).toBeLessThanOrEqual(1);
    expect(checkStrength("passwordpasswordpassword", "ru").warning).toMatch(/Повтор/);
  });

  it("rates common Russian-user passwords as weak", () => {
    for (const p of ["qwerty123", "ytrewq", "parol123", "йцукен", "пароль", "zaq12wsx"]) expect(checkStrength(p, "ru").score, p).toBeLessThanOrEqual(1);
  });

  it("rates a long random password as very strong", () => {
    expect(checkStrength("kZ7#pQ2!vL9@xR4$mN8^", "en").score).toBe(4);
  });

  it("returns crack times for every scenario", () => {
    const r = checkStrength("correct horse battery staple", "en");
    expect(r.seconds.offlineFast).toBeGreaterThan(0);
    expect(r.seconds.onlineThrottled).toBeGreaterThan(r.seconds.offlineFast);
  });
});

describe("durations", () => {
  it("uses Russian plurals", () => {
    expect(humanDuration(0.2, "ru")).toBe("меньше секунды");
    expect(humanDuration(1, "ru")).toBe("1 секунда");
    expect(humanDuration(3, "ru")).toBe("3 секунды");
    expect(humanDuration(25, "ru")).toBe("25 секунд");
    expect(humanDuration(3600 * 21, "ru")).toBe("21 час");
    expect(humanDuration(86400 * 2, "ru")).toBe("2 дня");
    expect(humanDuration(365.25 * 86400 * 5, "ru")).toBe("5 лет");
    expect(humanDuration(365.25 * 86400 * 2, "en")).toBe("2 years");
    expect(humanDuration(1e30, "ru")).toBe("дольше возраста Вселенной");
  });
});
