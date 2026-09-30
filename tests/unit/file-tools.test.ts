import { describe, expect, it } from "vitest";
import { base64ToBytes, bytesToBase64, decodedSize, parseBase64, wrapLines } from "@/sections/file/lib/b64";
import { parsePart, partName, partSizes, planJoin } from "@/sections/file/lib/parts";
import { DEFAULT_RENAME, regexError, renameAll, splitName, transliterate } from "@/sections/file/lib/rename";
import { aspectPlan, longSideFor, parseAspect } from "@/sections/video/engine/aspect";

const f = (name: string, t = new Date(2024, 0, 15, 9, 5, 7).getTime()) => ({ name, lastModified: t });

describe("batch rename", () => {
  it("keeps names by default and splits extensions", () => {
    expect(renameAll([f("a.JPG"), f("b.png")], DEFAULT_RENAME).map((r) => r.name)).toEqual(["a.JPG", "b.png"]);
    expect(splitName("archive.tar.gz")).toEqual({ base: "archive.tar", ext: "gz" });
    expect(splitName(".env")).toEqual({ base: ".env", ext: "" });
  });
  it("numbers with padding and dates", () => {
    const r = renameAll([f("x.jpg"), f("y.jpg")], { ...DEFAULT_RENAME, pattern: "trip-{n:3}", start: 9 });
    expect(r.map((x) => x.name)).toEqual(["trip-009.jpg", "trip-010.jpg"]);
    expect(renameAll([f("x.jpg")], { ...DEFAULT_RENAME, pattern: "{date}_{time}_{name}" })[0].name).toBe("2024-01-15_09-05-07_x.jpg");
  });
  it("finds and replaces (plain and regex)", () => {
    expect(renameAll([f("IMG_0001.jpg")], { ...DEFAULT_RENAME, find: "IMG_", replace: "" })[0].name).toBe("0001.jpg");
    expect(renameAll([f("IMG_0001.jpg")], { ...DEFAULT_RENAME, find: "^IMG_(\\d+)$", replace: "photo-$1", regex: true })[0].name).toBe("photo-0001.jpg");
    expect(regexError("(", true)).not.toBeNull();
    expect(regexError("(", false)).toBeNull();
  });
  it("transliterates Russian and Kazakh, changes case and spaces", () => {
    expect(transliterate("Щука и Ёж")).toBe("Shchuka i Yozh");
    expect(transliterate("Қазақстан")).toBe("Qazaqstan");
    const r = renameAll([f("Отпуск в Алматы.JPG")], { ...DEFAULT_RENAME, translit: true, spaces: "-", caseMode: "lower" });
    expect(r[0].name).toBe("otpusk-v-almaty.jpg");
    expect(renameAll([f("my holiday photo.png")], { ...DEFAULT_RENAME, caseMode: "title" })[0].name).toBe("My Holiday Photo.png");
  });
  it("flags duplicates, illegal and reserved names", () => {
    const r = renameAll([f("a.txt"), f("b.txt")], { ...DEFAULT_RENAME, pattern: "same" });
    expect(r.every((x) => x.error === "duplicate")).toBe(true);
    expect(renameAll([f("a.txt")], { ...DEFAULT_RENAME, pattern: "a:b" })[0].error).toBe("illegal");
    expect(renameAll([f("a.txt")], { ...DEFAULT_RENAME, pattern: "CON" })[0].error).toBe("reserved");
    expect(renameAll([f("a.txt")], { ...DEFAULT_RENAME, pattern: " " })[0].error).toBe("empty");
    // case-insensitive duplicates
    expect(renameAll([f("A.txt"), f("a.TXT")], DEFAULT_RENAME).every((x) => x.error === "duplicate")).toBe(true);
  });
});

describe("split and join", () => {
  it("computes part sizes", () => {
    expect(partSizes(10, { count: 3 })).toEqual([4, 3, 3]);
    expect(partSizes(10, { size: 4 })).toEqual([4, 4, 2]);
    expect(partSizes(8, { size: 4 })).toEqual([4, 4]);
    expect(partSizes(2, { count: 5 })).toEqual([1, 1]);
    expect(partSizes(0, { count: 3 })).toEqual([]);
    const s = partSizes(1_000_003, { count: 7 });
    expect(s.reduce((a, b) => a + b)).toBe(1_000_003);
  });
  it("names parts like 7-Zip", () => {
    expect(partName("video.mp4", 0, 5)).toBe("video.mp4.001");
    expect(partName("video.mp4", 1233, 1500)).toBe("video.mp4.1234");
  });
  it("parses part names", () => {
    expect(parsePart("video.mp4.003")).toEqual({ base: "video.mp4", index: 3 });
    expect(parsePart("backup.part2.rar")).toEqual({ base: "backup.rar", index: 2 });
    expect(parsePart("data_07")).toEqual({ base: "data", index: 7 });
    expect(parsePart("photo.jpg")).toBeNull();
  });
  it("orders parts and reports gaps", () => {
    const p = planJoin(["a.bin.003", "a.bin.001", "a.bin.004"]);
    expect(p.order).toEqual([1, 0, 2]);
    expect(p.base).toBe("a.bin");
    expect(p.missing).toEqual([2]);
    expect(p.mixed).toBe(false);
    expect(planJoin(["a.001", "b.002"]).mixed).toBe(true);
    expect(planJoin(["a.002", "a.003"]).missing).toEqual([1]);
    expect(planJoin(["x.txt", "a.001"]).unknown).toEqual([0]);
  });
});

describe("base64", () => {
  it("round-trips bytes", () => {
    const bytes = new Uint8Array(70000).map((_, i) => (i * 31) & 255);
    const s = bytesToBase64(bytes);
    expect(Array.from(base64ToBytes(s))).toEqual(Array.from(bytes));
    expect(decodedSize(s)).toBe(70000);
    expect(bytesToBase64(new TextEncoder().encode("Hi!"))).toBe("SGkh");
  });
  it("parses data URIs, URL-safe alphabet and missing padding", () => {
    expect(parseBase64("data:image/png;base64,iVBORw0KGgo=")).toEqual({ data: "iVBORw0KGgo=", mime: "image/png" });
    expect(parseBase64("SGk")).toEqual({ data: "SGk=", mime: null });
    expect(parseBase64("a-_b")?.data).toBe("a+/b");
    expect(parseBase64("SG\nk h")?.data).toBe("SGkh");
    expect(parseBase64("S")).toBeNull();
    expect(parseBase64("not base64!")).toBeNull();
    expect(parseBase64("data:text/plain,hello")).toBeNull();
  });
  it("wraps lines at 76 characters", () => {
    const s = "A".repeat(160);
    expect(wrapLines(s).split("\n").map((l) => l.length)).toEqual([76, 76, 8]);
  });
});

describe("aspect maths", () => {
  it("parses ratios", () => {
    expect(parseAspect("9:16")).toEqual([9, 16]);
    expect(parseAspect("16-9")).toEqual([16, 9]);
    expect(parseAspect("abc")).toBeNull();
  });
  it("crops the centre to the target ratio", () => {
    const p = aspectPlan(1920, 1080, 9, 16, "crop", longSideFor(1080, 9, 16));
    expect(p.crop).toEqual({ left: 656, top: 0, width: 608, height: 1080 });
    expect(p.width / p.height).toBeCloseTo(9 / 16, 2);
    expect(p.height).toBe(1080);
    const sq = aspectPlan(1920, 1080, 1, 1, "crop", 1080);
    expect(sq).toMatchObject({ width: 1080, height: 1080, crop: { left: 420, top: 0, width: 1080, height: 1080 } });
  });
  it("fits with bars and never upscales", () => {
    const p = aspectPlan(1920, 1080, 9, 16, "fit", longSideFor(1080, 9, 16));
    expect(p.fit).toBe("contain");
    expect(p.width % 2).toBe(0);
    expect(p.height).toBe(1920);
    expect(p.width).toBe(1080);
    const small = aspectPlan(640, 360, 16, 9, "crop", 1920);
    expect(small).toMatchObject({ width: 640, height: 360 });
  });
});
