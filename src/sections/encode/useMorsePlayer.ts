"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { morseTimeline, type Tone } from "./morse";

/**
 * Plays Morse with Web Audio: one oscillator, a gain envelope scheduled ahead on
 * AudioContext.currentTime (sample-accurate, no setTimeout jitter), 5 ms ramps against clicks.
 * `light` is true while a tone sounds (driven by rAF reading the audio clock).
 */
export function useMorsePlayer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [light, setLight] = useState(false);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const ctx = ctxRef.current;
    ctxRef.current = null;
    if (ctx) void ctx.close();
    setPlaying(false);
    setLight(false);
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    (code: string, o: { wpm: number; fwpm?: number; freq: number }) => {
      stop();
      const { tones, total } = morseTimeline(code, o.wpm, o.fwpm ?? o.wpm);
      if (!tones.length) return;
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = o.freq;
      osc.connect(gain).connect(ctx.destination);
      const t0 = ctx.currentTime + 0.08;
      const r = 0.005;
      gain.gain.setValueAtTime(0, t0);
      for (const { t, d } of tones) {
        gain.gain.setValueAtTime(0, t0 + t);
        gain.gain.linearRampToValueAtTime(0.5, t0 + t + r);
        gain.gain.setValueAtTime(0.5, t0 + t + d - r);
        gain.gain.linearRampToValueAtTime(0, t0 + t + d);
      }
      osc.start(t0);
      osc.stop(t0 + total + 0.05);
      setPlaying(true);
      let i = 0;
      const tick = () => {
        if (ctxRef.current !== ctx) return;
        const now = ctx.currentTime - t0;
        while (i < tones.length && now > tones[i].t + tones[i].d) i++;
        const cur: Tone | undefined = tones[i];
        setLight(!!cur && now >= cur.t && now <= cur.t + cur.d);
        if (now > total) {
          stop();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [stop],
  );

  return { play, stop, playing, light };
}
