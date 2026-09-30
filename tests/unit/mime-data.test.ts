import { describe, expect, it } from "vitest";
import { CATS, compressibleOf, ENTRIES, ENTRY_BY_EXT, isTextual } from "@/sections/mime/data";

describe("MIME data", () => {
  it("has ~300 unique curated extensions with valid slugs", () => {
    expect(ENTRIES.length).toBeGreaterThanOrEqual(280);
    expect(new Set(ENTRIES.map((e) => e.ext)).size).toBe(ENTRIES.length);
    for (const e of ENTRIES) expect(e.ext).toMatch(/^[a-z0-9]+$/);
    const slugs = new Set(CATS.map((c) => c.slug));
    for (const e of ENTRIES) expect(slugs.has(e.ext), `${e.ext} collides with a category slug`).toBe(false);
  });

  it("every entry has a type, texts and valid references", () => {
    for (const e of ENTRIES) {
      expect(e.types.length, e.ext).toBeGreaterThan(0);
      expect(e.primary.type, e.ext).toMatch(/^[a-z]+\/[a-z0-9.+-]+$/);
      expect(e.d[0].length, `${e.ext} ru`).toBeGreaterThan(20);
      expect(e.d[1].length, `${e.ext} en`).toBeGreaterThan(20);
      if (e.prefer) expect(e.types.some((t) => t.type === e.prefer), `${e.ext} prefer ${e.prefer}`).toBe(true);
      for (const r of e.related ?? []) expect(ENTRY_BY_EXT.has(r), `${e.ext} → ${r}`).toBe(true);
    }
  });

  it("picks the right primary types", () => {
    const p = (ext: string) => ENTRY_BY_EXT.get(ext)!.primary.type;
    expect(p("js")).toBe("text/javascript");
    expect(p("mjs")).toBe("text/javascript");
    expect(p("json")).toBe("application/json");
    expect(p("mp4")).toBe("video/mp4");
    expect(p("mp3")).toBe("audio/mpeg");
    expect(p("zip")).toBe("application/zip");
    expect(p("webp")).toBe("image/webp");
    expect(p("svg")).toBe("image/svg+xml");
    expect(p("docx")).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(p("yaml")).toBe("application/yaml");
    expect(p("xml")).toBe("application/xml");
    expect(p("wav")).toBe("audio/wav");
    expect(p("mts")).toBe("video/mp2t");
    expect(p("woff2")).toBe("font/woff2");
    expect(p("zst")).toBe("application/zstd");
  });

  it("classifies text and compressibility", () => {
    expect(isTextual("text/css")).toBe(true);
    expect(isTextual("application/json")).toBe(true);
    expect(isTextual("image/svg+xml")).toBe(true);
    expect(isTextual("image/png")).toBe(false);
    expect(compressibleOf(ENTRY_BY_EXT.get("css")!.primary)).toBe(true);
    expect(compressibleOf(ENTRY_BY_EXT.get("png")!.primary)).toBe(false);
    expect(compressibleOf(ENTRY_BY_EXT.get("jpg")!.primary)).toBe(false);
  });
});
