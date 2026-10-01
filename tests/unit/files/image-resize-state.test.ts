import { describe, expect, it } from "vitest";
import { plannedSize, RESIZE_DEFAULT, resizeSpecOf, setSide, shownSides, switchMode, toggleLock, type ResizeState } from "@/tools/files/image/lib/resize-state";

const S = (p: Partial<ResizeState>): ResizeState => ({ ...RESIZE_DEFAULT, ...p });
const photo = { w: 4032, h: 3024 };

describe("resizeSpecOf", () => {
  it("100 % and empty fields mean no resize", () => {
    expect(resizeSpecOf(RESIZE_DEFAULT)).toBeNull();
    expect(resizeSpecOf(S({ percent: 100, up: true }))).toBeNull();
    expect(resizeSpecOf(S({ mode: "px" }))).toBeNull();
    expect(resizeSpecOf(S({ mode: "long", long: null }))).toBeNull();
  });
  it("percent", () => {
    expect(resizeSpecOf(S({ percent: 50 }))).toEqual({ mode: "percent", percent: 50, allowUpscale: false });
    expect(resizeSpecOf(S({ percent: 250, up: true }))).toEqual({ mode: "percent", percent: 250, allowUpscale: true });
  });
  it("pixels with the lock: only the typed side", () => {
    expect(resizeSpecOf(S({ mode: "px", w: 1920 }))).toEqual({ mode: "box", width: 1920, allowUpscale: false });
    expect(resizeSpecOf(S({ mode: "px", h: 1080 }))).toEqual({ mode: "box", height: 1080, allowUpscale: false });
    // a stale second side is ignored while locked
    expect(resizeSpecOf(S({ mode: "px", w: 1920, h: 5 }))).toEqual({ mode: "box", width: 1920, allowUpscale: false });
  });
  it("pixels without the lock: both sides and the fit", () => {
    expect(resizeSpecOf(S({ mode: "px", locked: false, w: 1080, h: 1080, fit: "cover" }))).toEqual({
      mode: "box",
      width: 1080,
      height: 1080,
      fit: "cover",
      allowUpscale: false,
    });
    expect(resizeSpecOf(S({ mode: "px", locked: false, w: 800, h: null }))).toEqual({ mode: "box", width: 800, allowUpscale: false });
  });
  it("long side", () => {
    expect(resizeSpecOf(S({ mode: "long", long: 1600 }))).toEqual({ mode: "long", long: 1600, allowUpscale: false });
  });
});

describe("resize controls state", () => {
  it("plans the output size for the live line", () => {
    expect(plannedSize(S({ percent: 50 }), photo)).toEqual({ w: 2016, h: 1512 });
    expect(plannedSize(RESIZE_DEFAULT, photo)).toEqual(photo);
    expect(plannedSize(S({ percent: 50 }), null)).toBeNull();
    // no enlarging unless allowed
    expect(plannedSize(S({ mode: "px", w: 8000 }), photo)).toEqual(photo);
  });
  it("with the lock the other side follows the photo", () => {
    expect(shownSides(S({ mode: "px", w: 2016 }), photo)).toEqual({ w: 2016, h: 1512 });
    expect(shownSides(S({ mode: "px", h: 1512 }), photo)).toEqual({ w: 2016, h: 1512 });
    expect(shownSides(S({ mode: "px", w: 2016 }), null)).toEqual({ w: 2016, h: null });
  });
  it("typing a side while locked drops the other one", () => {
    expect(setSide(S({ mode: "px", w: 100 }), "h", 50)).toMatchObject({ w: null, h: 50 });
    expect(setSide(S({ mode: "px", locked: false, w: 100, h: 20 }), "h", 50)).toMatchObject({ w: 100, h: 50 });
  });
  it("unlocking keeps the numbers shown; locking keeps the width", () => {
    const open = toggleLock(S({ mode: "px", w: 2016 }), photo);
    expect(open).toMatchObject({ locked: false, w: 2016, h: 1512 });
    expect(toggleLock(open, photo)).toMatchObject({ locked: true, w: 2016, h: null });
  });
  it("switching to pixels starts from the current size", () => {
    expect(switchMode(S({ percent: 50 }), "px", photo)).toMatchObject({ mode: "px", w: 2016, h: null });
    expect(switchMode(S({ percent: 50 }), "long", photo)).toMatchObject({ mode: "long", long: 2016 });
    expect(switchMode(S({ mode: "px", w: 640 }), "percent", photo)).toMatchObject({ mode: "percent", w: 640 });
  });
});
