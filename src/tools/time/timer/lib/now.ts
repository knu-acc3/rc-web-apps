/** Wall-clock milliseconds. Only call from event handlers, effects and tickers — never during render. */
export const nowMs = (): number => Date.now();
