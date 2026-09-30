import { describe, expect, it } from "vitest";
import {
  detectFile,
  FILE_LIMITS,
  fileMatchesAccept,
  getLimitError,
  recommendedFormat,
  sniffFileSignature,
} from "@/src/lib/file-conversion/formats";
import {
  extractClipboardFiles,
  shouldHandleFilePaste,
} from "@/src/lib/file-conversion/clipboard";
import { buildFfmpegArgs } from "@/src/lib/file-conversion/media-engine";

function fileWithBytes(name: string, type: string, bytes: number[]) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("file type detection", () => {
  it("prefers a PDF signature over a misleading extension", async () => {
    const file = new File(["%PDF-1.7\n"], "scan.jpg", { type: "image/jpeg" });
    const detected = await detectFile(file);
    expect(detected.category).toBe("pdf");
    expect(detected.detection).toBe("signature");
  });

  it("recognizes HEIC and AVIF brands", () => {
    const heic = new Uint8Array(24);
    heic.set(new TextEncoder().encode("ftypheic"), 4);
    expect(sniffFileSignature(heic)?.mime).toBe("image/heic");

    const avif = new Uint8Array(24);
    avif.set(new TextEncoder().encode("ftypavif"), 4);
    expect(sniffFileSignature(avif)?.mime).toBe("image/avif");
  });

  it("falls back to MIME and extension for browser clipboard files", async () => {
    const image = fileWithBytes("clipboard.png", "image/png", [0]);
    const audio = fileWithBytes("recording.wav", "", [0]);
    expect((await detectFile(image)).category).toBe("image");
    expect((await detectFile(audio)).category).toBe("audio");
  });
});

describe("conversion recommendations and limits", () => {
  it("uses practical default formats", async () => {
    expect(recommendedFormat(await detectFile(fileWithBytes("photo.tiff", "image/tiff", [0])))).toBe("jpeg");
    expect(recommendedFormat(await detectFile(fileWithBytes("sound.wav", "audio/wav", [0])))).toBe("mp3");
    expect(recommendedFormat(await detectFile(fileWithBytes("clip.mov", "video/quicktime", [0])))).toBe("mp4");
    expect(recommendedFormat(await detectFile(new File(["%PDF-"], "scan.pdf", { type: "application/pdf" })))).toBe("jpeg");
  });

  it("enforces per-category size limits", async () => {
    const file = fileWithBytes("large.tiff", "image/tiff", [0]);
    Object.defineProperty(file, "size", { value: FILE_LIMITS.image + 1 });
    expect(getLimitError(await detectFile(file), true)).toContain("250 MB");
  });

  it("matches MIME wildcards and rare image extensions", () => {
    expect(fileMatchesAccept(fileWithBytes("camera.nef", "", [0]), "image/*,.nef,.dng")).toBe(true);
    expect(fileMatchesAccept(fileWithBytes("movie.mov", "video/quicktime", [0]), "audio/*")).toBe(false);
  });
});

describe("clipboard file filtering", () => {
  it("extracts only file items", () => {
    const file = fileWithBytes("shot.png", "image/png", [0]);
    const data = {
      items: [
        { kind: "string", getAsFile: () => null },
        { kind: "file", getAsFile: () => file },
      ],
      files: [],
    } as unknown as DataTransfer;
    expect(extractClipboardFiles(data)).toEqual([file]);
  });

  it("does not intercept ordinary text paste", () => {
    const event = {
      clipboardData: { items: [{ kind: "string", getAsFile: () => null }], files: [] },
    } as unknown as ClipboardEvent;
    expect(shouldHandleFilePaste(event)).toBe(false);
  });
});

describe("FFmpeg command construction", () => {
  it("builds fixed argument arrays without a shell", () => {
    const args = buildFfmpegArgs("input-a.wav", "output-a.mp3", "mp3");
    expect(args).toEqual([
      "-i",
      "input-a.wav",
      "-vn",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "192k",
      "output-a.mp3",
    ]);
    expect(args.join(" ")).not.toContain(";");
  });
});

