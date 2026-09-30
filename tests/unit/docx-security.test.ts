import { describe, expect, it } from "vitest";
import JSZip from "jszip";

import {
  assertSafeDocxArchive,
  DOCX_ARCHIVE_LIMITS,
} from "@/src/lib/docxSecurity";

function entry(uncompressedSize: number) {
  return { dir: false, _data: { uncompressedSize } };
}

describe("DOCX archive limits", () => {
  it("accepts a bounded archive", () => {
    expect(() =>
      assertSafeDocxArchive(
        {
          "[Content_Types].xml": entry(1_000),
          "word/document.xml": entry(10_000),
        },
        5_000,
      ),
    ).not.toThrow();
  });

  it("reads expanded sizes from a real JSZip archive", async () => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", "<Types />");
    zip.file("word/document.xml", "<document><p>safe</p></document>");
    const bytes = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
    });
    const loaded = await JSZip.loadAsync(bytes);

    expect(() =>
      assertSafeDocxArchive(
        loaded.files as unknown as Parameters<typeof assertSafeDocxArchive>[0],
        bytes.byteLength,
      ),
    ).not.toThrow();
  });

  it("rejects excessive entry counts", () => {
    const entries = Object.fromEntries(
      Array.from(
        { length: DOCX_ARCHIVE_LIMITS.maxEntries + 1 },
        (_, index) => [`word/item-${index}.xml`, entry(1)],
      ),
    );
    expect(() => assertSafeDocxArchive(entries, 1_000)).toThrow(/too many/i);
  });

  it("rejects excessive uncompressed size and compression ratio", () => {
    expect(() =>
      assertSafeDocxArchive(
        { "word/document.xml": entry(DOCX_ARCHIVE_LIMITS.maxUncompressedBytes + 1) },
        1_000_000,
      ),
    ).toThrow(/expands/i);
    expect(() =>
      assertSafeDocxArchive(
        { "word/document.xml": entry(10_000_000) },
        1,
      ),
    ).toThrow(/ratio/i);
  });

  it("rejects entries whose expanded size is unavailable", () => {
    expect(() =>
      assertSafeDocxArchive({ "word/document.xml": { dir: false } }, 1_000),
    ).toThrow(/unknown size/i);
  });
});
