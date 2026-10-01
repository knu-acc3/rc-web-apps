import { expect, it } from "vitest";
import { NOISE_WORKLET_SRC } from "@/tools/files/audio/lib/noise";
it("worklet source is self-contained", () => {
  const fn = new Function("registerProcessor", "AudioWorkletProcessor", NOISE_WORKLET_SRC + "\nreturn NoiseCore;");
  const Core = fn(() => {}, class {});
  const c = new Core("pink", 5);
  const a = new Float32Array(8);
  c.fill(a);
  expect(a.some((v: number) => v !== 0)).toBe(true);
});
