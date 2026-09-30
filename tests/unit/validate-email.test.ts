import { describe, expect, it } from "vitest";
import { checkEmail } from "@/sections/validate/lib/email";

describe("email syntax", () => {
  it.each(["user@example.com", "first.last+tag@sub.example.co.uk", "a@b.co", "o'brien@example.ie", "user_1@xn--80ak6aa92e.com"])("valid %s", (e) => {
    expect(checkEmail(e).valid).toBe(true);
  });

  it.each([
    ["a@1.2.3", "tld-numeric"],
    ["a@1.2.3.4", "tld-numeric"],
    ["plainaddress", "no-at"],
    ["@example.com", "local-empty"],
    ["user@", "domain-empty"],
    [".user@example.com", "local-dot"],
    ["us..er@example.com", "local-dot"],
    ["user@localhost", "domain-no-dot"],
    ["user@-example.com", "domain-hyphen"],
    ["user@exa_mple.com", "domain-label"],
    ["user name@example.com", "spaces"],
    ["user@example.c", "tld-short"],
    ["user(comment)@example.com", "local-chars"],
    [`${"a".repeat(65)}@example.com`, "local-long"],
  ])("invalid %s (%s)", (e, issue) => {
    const r = checkEmail(e);
    expect(r.valid).toBe(false);
    expect(r.issues).toContain(issue);
  });

  it("IDN domains are converted to punycode", () => {
    const r = checkEmail("иван@почта.рф");
    expect(r.valid).toBe(true);
    expect(r.issues).toContain("idn");
    expect(r.issues).toContain("local-unicode");
    expect(r.asciiDomain).toBe("xn--80a1acny.xn--p1ai");
  });

  it("quoted local parts and IP literals are valid but flagged", () => {
    expect(checkEmail('"john doe"@example.com')).toMatchObject({ valid: true, issues: ["local-quoted"] });
    expect(checkEmail("user@[192.168.0.1]")).toMatchObject({ valid: true, issues: ["ip-literal"] });
    expect(checkEmail("user@[300.1.1.1]").valid).toBe(false);
  });

  it("suggests common typo fixes", () => {
    expect(checkEmail("user@gmial.com").suggestion).toBe("gmail.com");
    expect(checkEmail("user@yandex.r").suggestion).toBe("yandex.ru");
    expect(checkEmail("user@mail.ry").suggestion).toBe("mail.ru");
    expect(checkEmail("user@gmail.com").suggestion).toBeUndefined();
  });
});
