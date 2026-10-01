/* Image engine worker: decode → transform → encode off the main thread. */
import { handle } from "./handler";
import type { WorkerIn, WorkerOut } from "./types";

const scope = self as unknown as {
  postMessage(msg: WorkerOut, transfer?: Transferable[]): void;
  addEventListener(type: "message", fn: (e: MessageEvent<WorkerIn>) => void): void;
};

let offscreen = false;
try {
  offscreen = typeof OffscreenCanvas !== "undefined" && !!new OffscreenCanvas(1, 1).getContext("2d");
} catch {
  offscreen = false;
}
scope.postMessage({ id: 0, kind: "ready", offscreen });

scope.addEventListener("message", async (e) => {
  const { id, req } = e.data;
  try {
    const { result, transfer } = await handle(req, { progress: (value) => scope.postMessage({ id, kind: "progress", value }) });
    scope.postMessage({ id, kind: "done", result }, transfer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    scope.postMessage({ id, kind: "error", message });
  }
});
