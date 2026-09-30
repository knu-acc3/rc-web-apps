/// <reference lib="webworker" />
import { computeDiff, type DiffOptions } from "./lib/diff";

self.onmessage = (e: MessageEvent<{ id: number; a: string; b: string; opts: DiffOptions }>) => {
  const { id, a, b, opts } = e.data;
  try {
    self.postMessage({ id, res: computeDiff(a, b, opts) });
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
