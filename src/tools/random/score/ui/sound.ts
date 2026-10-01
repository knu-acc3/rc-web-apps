"use client";

import { useCallback, useRef } from "react";

type Sound = "tick" | "goal" | "end";

/** Tones of each sound: frequency (Hz), length (s), wave, volume. */
const TONES: Record<Sound, { f: number[]; len: number; gap: number; type: OscillatorType; vol: number }> = {
  tick: { f: [1400], len: 0.025, gap: 0, type: "square", vol: 0.08 },
  goal: { f: [880, 1320], len: 0.11, gap: 0.12, type: "sine", vol: 0.25 },
  end: { f: [660, 660, 880], len: 0.16, gap: 0.22, type: "square", vol: 0.12 },
};

/**
 * Short sounds made on the fly (Web Audio, nothing to download): a click, a two-tone "goal reached", a buzzer at
 * the end of a period. Browsers only start audio after a tap, so `prime()` is called from a click handler before
 * a sound that will play later on its own (the game clock running out).
 */
export function useSound() {
  const ctx = useRef<AudioContext | null>(null);

  const prime = useCallback((): AudioContext | null => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx.current ??= new AC();
      if (ctx.current.state === "suspended") void ctx.current.resume();
      return ctx.current;
    } catch {
      return null;
    }
  }, []);

  const play = useCallback(
    (kind: Sound) => {
      const c = prime();
      if (!c) return;
      try {
        const s = TONES[kind];
        s.f.forEach((f, i) => {
          const o = c.createOscillator();
          const g = c.createGain();
          const t0 = c.currentTime + i * s.gap;
          o.frequency.value = f;
          o.type = s.type;
          g.gain.setValueAtTime(s.vol, t0);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + s.len);
          o.connect(g).connect(c.destination);
          o.start(t0);
          o.stop(t0 + s.len + 0.01);
        });
      } catch {
        // audio unavailable
      }
    },
    [prime],
  );

  return { play, prime };
}
