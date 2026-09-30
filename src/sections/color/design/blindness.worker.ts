/// <reference lib="webworker" />
import { linearTable, simulatePixels } from "./lib/cvd";

const lut = linearTable();

interface Job {
  id: number;
  buf: ArrayBuffer;
  m: number[];
}

self.onmessage = (e: MessageEvent<Job>) => {
  const { id, buf, m } = e.data;
  const data = new Uint8ClampedArray(buf);
  simulatePixels(data, m, lut);
  (self as unknown as Worker).postMessage({ id, buf: data.buffer }, [data.buffer]);
};
