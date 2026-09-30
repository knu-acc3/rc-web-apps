/**
 * Metronome clock: workers are not throttled like background tabs' timers,
 * so the lookahead scheduler keeps ticking when the tab is hidden.
 */
interface Scope {
  postMessage(msg: unknown): void;
  onmessage: ((e: MessageEvent<{ cmd: "start" | "stop"; interval?: number }>) => void) | null;
}
const scope = self as unknown as Scope;
let timer: ReturnType<typeof setInterval> | null = null;

scope.onmessage = (e) => {
  if (timer) clearInterval(timer);
  timer = null;
  if (e.data.cmd === "start") timer = setInterval(() => scope.postMessage("tick"), e.data.interval ?? 25);
};

export {};
