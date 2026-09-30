import { describe, expect, it } from "vitest";
import { buildArgs, canStreamCopy } from "@/sections/video/engine/ffargs";
import { GIF_MIN_DELAY_CS, gifDelays, gifFrameCount, gifSize, gifTimestamps, paletteSampleIndices, subsampleRgba } from "@/sections/video/engine/gif";
import { bitrateForSize, estimateBytes, even, outputName, suggestedBitrate } from "@/sections/video/engine/spec";
import { checkRange, ffTime, formatTime, parseFfmpegTime, parseTime } from "@/sections/video/engine/time";

describe("time codes", () => {
  it("parses common forms", () => {
    expect(parseTime("00:01:05.5")).toBeCloseTo(65.5);
    expect(parseTime("1:05.5")).toBeCloseTo(65.5);
    expect(parseTime("65.5")).toBeCloseTo(65.5);
    expect(parseTime("65,5")).toBeCloseTo(65.5);
    expect(parseTime("1:02:03,25")).toBeCloseTo(3723.25);
    expect(parseTime(" 2:00 ")).toBe(120);
    expect(parseTime("1h2m3.5s")).toBeCloseTo(3723.5);
    expect(parseTime("90s")).toBe(90);
    expect(parseTime("2m")).toBe(120);
    expect(parseTime("0")).toBe(0);
  });
  it("rejects invalid input", () => {
    expect(parseTime("")).toBeNull();
    expect(parseTime("abc")).toBeNull();
    expect(parseTime("1:75")).toBeNull();
    expect(parseTime("1:2:3:4")).toBeNull();
    expect(parseTime("-5")).toBeNull();
    expect(parseTime("1::2")).toBeNull();
  });
  it("formats and round-trips", () => {
    expect(formatTime(65.5, 1)).toBe("1:05.5");
    expect(formatTime(3725, 0)).toBe("1:02:05");
    expect(formatTime(59.99, 1)).toBe("1:00.0");
    expect(formatTime(0, 2)).toBe("0:00.00");
    expect(formatTime(5, 0, true)).toBe("0:00:05");
    for (const s of [0, 1.25, 59.5, 61.75, 3599.9, 7322.3]) expect(parseTime(formatTime(s, 2))).toBeCloseTo(s, 2);
  });
  it("builds ffmpeg time and parses ffmpeg logs", () => {
    expect(ffTime(65.5)).toBe("00:01:05.500");
    expect(ffTime(3723.25)).toBe("01:02:03.250");
    expect(parseFfmpegTime("  Duration: 00:01:05.50, start: 0.000000, bitrate: 1200 kb/s", "Duration")).toBeCloseTo(65.5);
    expect(parseFfmpegTime("frame=  120 fps= 30 q=28.0 size=512kB time=00:00:12.34 bitrate=339.8kbits/s", "time")).toBeCloseTo(12.34);
    expect(parseFfmpegTime("nothing here", "time")).toBeNull();
  });
  it("validates ranges", () => {
    expect(checkRange(1, 5, 10)).toEqual({ ok: true, range: { start: 1, end: 5 } });
    expect(checkRange(5, 1, 10)).toEqual({ ok: false, error: "order" });
    expect(checkRange(null, 1, 10)).toEqual({ ok: false, error: "start" });
    expect(checkRange(1, 11, 10)).toEqual({ ok: false, error: "end" });
    expect(checkRange(1, 1.01, 10)).toEqual({ ok: false, error: "short" });
  });
});

describe("gif maths", () => {
  it("keeps aspect ratio and never upscales", () => {
    expect(gifSize(1920, 1080, 480)).toEqual({ width: 480, height: 270 });
    expect(gifSize(320, 240, 480)).toEqual({ width: 320, height: 240 });
    expect(gifSize(1080, 1920, 360)).toEqual({ width: 360, height: 640 });
  });
  it("counts frames and timestamps", () => {
    expect(gifFrameCount(10, 10)).toBe(100);
    expect(gifFrameCount(1.05, 10)).toBe(11);
    expect(gifFrameCount(0, 10)).toBe(0);
    const ts = gifTimestamps(2, 3, 4);
    expect(ts).toEqual([2, 2.25, 2.5, 2.75]);
  });
  it("uses accumulated centisecond delays", () => {
    const d30 = gifDelays(30, 30);
    expect(d30.reduce((a, b) => a + b, 0)).toBe(100); // exactly one second
    expect(new Set(d30)).toEqual(new Set([3, 4]));
    expect(gifDelays(10, 5)).toEqual([10, 10, 10, 10, 10]);
    expect(gifDelays(12, 12).reduce((a, b) => a + b, 0)).toBe(100);
    // 60 fps is capped to 50 fps (browsers treat < 2 cs as 10 cs)
    expect(Math.min(...gifDelays(60, 20))).toBeGreaterThanOrEqual(GIF_MIN_DELAY_CS);
  });
  it("samples frames for a global palette", () => {
    expect(paletteSampleIndices(5, 16)).toEqual([0, 1, 2, 3, 4]);
    const idx = paletteSampleIndices(100, 4);
    expect(idx).toHaveLength(4);
    expect(idx[0]).toBeGreaterThanOrEqual(0);
    expect(idx[3]).toBeLessThan(100);
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });
  it("subsamples RGBA pixels", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(Array.from(subsampleRgba(data, 2))).toEqual([1, 2, 3, 4, 9, 10, 11, 12, 17, 18, 19, 20]);
    expect(subsampleRgba(data, 1)).toHaveLength(20);
  });
});

describe("size estimates", () => {
  it("estimates bytes from bitrate × duration", () => {
    // 2 Mbit/s video + 128 kbit/s audio for 60 s ≈ 16.3 MB (+2 % overhead)
    expect(estimateBytes(2_000_000, 128_000, 60)).toBe(Math.round((2_128_000 * 60 * 1.02) / 8));
  });
  it("computes the bitrate for a target size", () => {
    const br = bitrateForSize(10 * 1024 * 1024, 60, 128_000)!;
    expect(br).toBeGreaterThan(1_000_000);
    expect(estimateBytes(br, 128_000, 60)).toBeLessThanOrEqual(10 * 1024 * 1024);
    expect(bitrateForSize(100_000, 600, 128_000)).toBeNull();
  });
  it("suggests typical H.264 bitrates", () => {
    const b = suggestedBitrate(1920, 1080, 30, "medium");
    expect(b).toBeGreaterThan(4_000_000);
    expect(b).toBeLessThan(6_000_000);
    expect(suggestedBitrate(1280, 720, 30, "low")).toBeLessThan(b);
  });
  it("helpers", () => {
    expect(even(719)).toBe(720);
    expect(even(1)).toBe(2);
    expect(outputName("my clip.final.mov", "mp4")).toBe("my clip.final.mp4");
    expect(outputName("audio", "mp3", "-trimmed")).toBe("audio-trimmed.mp3");
  });
});

describe("ffmpeg arguments", () => {
  const input = { path: "/in/input.mkv", videoCodec: "avc", audioCodec: "aac", hasVideo: true };

  it("remuxes MKV (H.264/AAC) to MP4 without re-encoding", () => {
    expect(canStreamCopy(input, { target: "mp4" })).toBe(true);
    const args = buildArgs(input, { target: "mp4" }, "/out.mp4");
    expect(args).toContain("copy");
    expect(args).not.toContain("libx264");
    expect(args.join(" ")).toContain("-movflags +faststart");
  });
  it("re-encodes when codecs don't fit the container", () => {
    const vp9 = { ...input, videoCodec: "vp9", audioCodec: "vorbis" };
    expect(canStreamCopy(vp9, { target: "mp4" })).toBe(false);
    expect(canStreamCopy({ ...input, audioCodec: "aac" }, { target: "webm" })).toBe(false);
    expect(canStreamCopy(input, { target: "mp4", video: { width: 640 } })).toBe(false);
  });
  it("uses different codec sets per container", () => {
    const avi = { path: "/in/input.avi", hasVideo: true };
    const mp4 = buildArgs(avi, { target: "mp4" }, "/o.mp4").join(" ");
    const webm = buildArgs(avi, { target: "webm" }, "/o.webm").join(" ");
    const mkv = buildArgs(avi, { target: "mkv" }, "/o.mkv").join(" ");
    expect(mp4).toContain("libx264");
    expect(mp4).toContain("-c:a aac");
    expect(mp4).toContain("+faststart");
    expect(webm).toContain("libvpx");
    expect(webm).toContain("libopus");
    expect(webm).not.toContain("libx264");
    expect(mkv).toContain("libx264");
    expect(mkv).not.toContain("faststart");
  });
  it("builds audio extraction and encoding", () => {
    const mp3 = buildArgs({ path: "/in/a.mp4", audioCodec: "aac" }, { target: "mp3", audio: { bitrate: 320_000 } }, "/o.mp3");
    expect(mp3).toEqual(expect.arrayContaining(["-vn", "libmp3lame", "320k"]));
    const m4a = buildArgs({ path: "/in/a.mp4", audioCodec: "aac" }, { target: "m4a" }, "/o.m4a");
    expect(m4a.join(" ")).toContain("-c:a copy");
    const ogg = buildArgs({ path: "/in/a.wav" }, { target: "ogg" }, "/o.ogg");
    expect(ogg).toContain("libvorbis");
    const flac = buildArgs({ path: "/in/a.wav" }, { target: "flac" }, "/o.flac");
    expect(flac).toContain("flac");
  });
  it("builds a palette-based GIF graph", () => {
    const g = buildArgs({ path: "/in/v.mp4" }, { target: "gif", gif: { fps: 12, width: 480, palette: "global", loop: true } }, "/o.gif").join(" ");
    expect(g).toContain("palettegen");
    expect(g).toContain("paletteuse");
    expect(g).toContain("fps=12");
    expect(g).toContain("-loop 0");
    const f = buildArgs({ path: "/in/v.mp4" }, { target: "gif", gif: { fps: 10, width: 320, palette: "frame", loop: false } }, "/o.gif").join(" ");
    expect(f).toContain("stats_mode=single");
    expect(f).toContain("new=1");
    expect(f).toContain("-loop -1");
  });
  it("adds trim, rotation, speed and mute", () => {
    const a = buildArgs({ path: "/in/v.mov", hasVideo: true }, { target: "mp4", trim: { start: 5, end: 12.5 }, video: { rotate: 90, flip: true }, speed: { factor: 2, keepPitch: true } }, "/o.mp4").join(" ");
    expect(a).toContain("-ss 00:00:05.000");
    expect(a).toContain("-t 00:00:07.500");
    expect(a).toContain("transpose=1");
    expect(a).toContain("hflip");
    expect(a).toContain("setpts=PTS/2");
    expect(a).toContain("atempo=2");
    const m = buildArgs({ ...input }, { target: "mp4", audio: { discard: true } }, "/o.mp4");
    expect(m).toContain("-an");
  });
});
