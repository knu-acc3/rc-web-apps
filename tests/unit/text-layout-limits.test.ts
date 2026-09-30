import { describe, expect, it } from "vitest";
import { convertLayout, detectDirection, LAYOUT_PAIRS } from "@/sections/text/lib/layout";
import { smsInfo, xWeightedLength } from "@/sections/text/lib/limits";

describe("keyboard layout fixer", () => {
  it("EN → RU", () => {
    expect(convertLayout("ghbdtn")).toBe("привет");
    expect(convertLayout("Ghbdtn? rfr ltkf&")).toBe("Привет, как дела?");
    expect(convertLayout("Z yt gthtrk.xbk hfcrkflre")).toBe("Я не переключил раскладку");
    expect(convertLayout("`,")).toBe("ёб");
    expect(convertLayout('"@#$^&', "en-ru")).toBe('Э"№;:?');
  });
  it("RU → EN", () => {
    expect(convertLayout("руддщ")).toBe("hello");
    expect(convertLayout("Руддщб цщкдв! Ш ащкпще ещ ыцшеср дфнщгею")).toBe("Hello, world! I forgot to switch layout.");
  });
  it("round trip and detection", () => {
    const s = "Съешь же ещё этих мягких французских булок";
    expect(convertLayout(convertLayout(s, "ru-en"), "en-ru")).toBe(s);
    expect(detectDirection("ghbdtn vbh")).toBe("en-ru");
    expect(detectDirection("руддщ")).toBe("ru-en");
    expect(LAYOUT_PAIRS).toHaveLength(74);
    expect(new Set(LAYOUT_PAIRS.map((p) => p[1])).size).toBe(74);
  });
});

describe("SMS segments", () => {
  it("GSM-7: 160 in one part, 153 per part after that", () => {
    expect(smsInfo("")).toMatchObject({ segments: 0, units: 0 });
    expect(smsInfo("a".repeat(160))).toMatchObject({ encoding: "GSM-7", segments: 1, remaining: 0 });
    expect(smsInfo("a".repeat(161))).toMatchObject({ encoding: "GSM-7", segments: 2, perSegment: 153 });
    expect(smsInfo("a".repeat(306)).segments).toBe(2);
    expect(smsInfo("a".repeat(307)).segments).toBe(3);
  });
  it("extension characters cost two septets and are never split", () => {
    expect(smsInfo("€".repeat(80))).toMatchObject({ encoding: "GSM-7", units: 160, segments: 1 });
    expect(smsInfo("€".repeat(81)).segments).toBe(2);
    // 152 septets + "€" (2) would straddle the boundary → pushed to part 2
    const s = "a".repeat(152) + "€" + "a".repeat(10);
    expect(smsInfo(s)).toMatchObject({ units: 164, segments: 2 });
  });
  it("UCS-2: Cyrillic is 70 per SMS, 67 per part", () => {
    expect(smsInfo("я".repeat(70))).toMatchObject({ encoding: "UCS-2", segments: 1 });
    expect(smsInfo("я".repeat(71))).toMatchObject({ encoding: "UCS-2", segments: 2, perSegment: 67 });
    expect(smsInfo("я".repeat(134)).segments).toBe(2);
    expect(smsInfo("я".repeat(135)).segments).toBe(3);
  });
  it("one non-GSM character switches the whole message to UCS-2", () => {
    const info = smsInfo("Hello “world”");
    expect(info.encoding).toBe("UCS-2");
    expect(info.nonGsm).toEqual(["“", "”"]);
    expect(smsInfo("Hello {world} ^ | ~").encoding).toBe("GSM-7");
    expect(smsInfo("Emoji 😀").units).toBe(8); // surrogate pair = 2 units
  });
});

describe("X (Twitter) weighted length", () => {
  it("Latin and Cyrillic weigh 1, CJK 2, emoji 2, URLs 23", () => {
    expect(xWeightedLength("hello").weighted).toBe(5);
    expect(xWeightedLength("привет").weighted).toBe(6);
    expect(xWeightedLength("日本語").weighted).toBe(6);
    expect(xWeightedLength("👨‍👩‍👧").weighted).toBe(2);
    expect(xWeightedLength("🇰🇿").weighted).toBe(2);
    expect(xWeightedLength("see https://example.com/some/very/long/path?x=1").weighted).toBe(4 + 23);
    expect(xWeightedLength("a".repeat(280)).remaining).toBe(0);
    expect(xWeightedLength("© 2025").weighted).toBe(6);
  });
});
